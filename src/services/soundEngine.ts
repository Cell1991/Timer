import { Howl } from 'howler';
import {
  AMBIENT_SOUND_MAP,
  type AmbientSoundId,
} from '../core/ambientCatalog';
import type { AmbientMix, TimerMode } from '../core/types';

interface ActiveSynthTrack {
  stop: () => void;
  setVolume: (vol: number) => void;
}

/**
 * Multi-track ambient SoundEngine powered by Howler.js (Web Audio gapless looping)
 * plus a studio-grade Web Audio API synthesizer with shared stereo convolution reverb,
 * organic timing, harmonic envelope shaping, and stereo panning.
 */
class SoundEngine {
  private ctx: AudioContext | null = null;
  private reverbNode: ConvolverNode | null = null;
  private reverbReturnGain: GainNode | null = null;
  private howls = new Map<AmbientSoundId, Howl>();
  private activeFileVolumes = new Map<AmbientSoundId, number>();
  private activeSynths = new Map<AmbientSoundId, ActiveSynthTrack>();
  private loadingStateListeners = new Set<(loading: Set<AmbientSoundId>) => void>();
  private loadingIds = new Set<AmbientSoundId>();
  private alarmIntervalId: number | null = null;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Creates a warm, silky 2.8s stereo hall impulse response for lush acoustic space.
   */
  private ensureReverb(ctx: AudioContext): GainNode {
    if (this.reverbNode && this.reverbReturnGain) {
      return this.reverbReturnGain;
    }

    const duration = 2.8;
    const length = Math.floor(ctx.sampleRate * duration);
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate);

    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < length; i++) {
        const t = i / length;
        const env = Math.pow(1 - t, 2.6);
        const white = Math.random() * 2 - 1;
        // Gentle lowpass inside impulse so reverb tail is warm, never metallic
        lp = 0.72 * lp + 0.28 * white;
        data[i] = lp * env * 0.65;
      }
    }

    const convolver = ctx.createConvolver();
    convolver.buffer = impulse;

    const returnGain = ctx.createGain();
    returnGain.gain.value = 0.55;

    const inputBus = ctx.createGain();
    inputBus.gain.value = 1;
    inputBus.connect(convolver);
    convolver.connect(returnGain);
    returnGain.connect(ctx.destination);

    this.reverbNode = convolver;
    this.reverbReturnGain = inputBus;
    return inputBus;
  }

  onLoadingChange(listener: (loading: Set<AmbientSoundId>) => void): () => void {
    this.loadingStateListeners.add(listener);
    return () => {
      this.loadingStateListeners.delete(listener);
    };
  }

  private emitLoading(): void {
    const snapshot = new Set(this.loadingIds);
    for (const fn of this.loadingStateListeners) {
      fn(snapshot);
    }
  }

  private resolveSoundUrl(file: string): string {
    if (typeof window === 'undefined') return `./sounds/${file}`;
    try {
      return new URL(`./sounds/${file}`, window.location.href).href;
    } catch {
      return `./sounds/${file}`;
    }
  }

  private getOrCreateHowl(id: AmbientSoundId, file: string): Howl {
    const existing = this.howls.get(id);
    if (existing) return existing;

    this.loadingIds.add(id);
    this.emitLoading();

    const howl = new Howl({
      src: [this.resolveSoundUrl(file)],
      loop: true,
      volume: 0,
      preload: true,
      onload: () => {
        this.loadingIds.delete(id);
        this.emitLoading();
      },
      onloaderror: () => {
        this.loadingIds.delete(id);
        this.emitLoading();
      },
    });

    this.howls.set(id, howl);
    return howl;
  }

  syncMix(mix: AmbientMix, muted: boolean, masterVolume = 0.65): void {
    if (typeof window === 'undefined') return;

    const effectiveMaster = muted ? 0 : Math.max(0, Math.min(1, masterVolume));
    const desiredIds = new Set<AmbientSoundId>();

    for (const [rawId, rawVol] of Object.entries(mix)) {
      const id = rawId as AmbientSoundId;
      const trackVol = rawVol ?? 0;
      if (trackVol <= 0.01) continue;
      const def = AMBIENT_SOUND_MAP[id];
      if (!def) continue;

      desiredIds.add(id);
      const targetVol = Math.max(0, Math.min(1, trackVol * effectiveMaster));

      if (def.kind === 'file' && def.file) {
        const howl = this.getOrCreateHowl(id, def.file);
        const prevVol = this.activeFileVolumes.get(id) ?? 0;
        if (!howl.playing() && targetVol > 0) {
          howl.volume(0);
          howl.play();
          howl.fade(0, targetVol, 450);
        } else if (howl.playing()) {
          if (targetVol === 0) {
            howl.fade(prevVol, 0, 250);
            setTimeout(() => {
              if ((this.activeFileVolumes.get(id) ?? 0) === 0 && howl.playing()) {
                howl.pause();
              }
            }, 270);
          } else {
            howl.volume(targetVol);
          }
        }
        this.activeFileVolumes.set(id, targetVol);
      } else if (def.kind === 'synth') {
        const existingSynth = this.activeSynths.get(id);
        if (targetVol === 0) {
          if (existingSynth) {
            existingSynth.stop();
            this.activeSynths.delete(id);
          }
        } else if (existingSynth) {
          existingSynth.setVolume(targetVol);
        } else {
          const synth = this.startSynthTrack(id, targetVol);
          if (synth) {
            this.activeSynths.set(id, synth);
          }
        }
      }
    }

    for (const [id, howl] of this.howls.entries()) {
      if (!desiredIds.has(id) && howl.playing()) {
        const prev = this.activeFileVolumes.get(id) ?? howl.volume();
        this.activeFileVolumes.delete(id);
        howl.fade(prev, 0, 300);
        setTimeout(() => {
          if (!this.activeFileVolumes.has(id) && howl.playing()) {
            howl.stop();
          }
        }, 320);
      }
    }

    for (const [id, synth] of this.activeSynths.entries()) {
      if (!desiredIds.has(id)) {
        synth.stop();
        this.activeSynths.delete(id);
      }
    }
  }

  private startSynthTrack(
    id: AmbientSoundId,
    initialVolume: number,
  ): ActiveSynthTrack | null {
    const ctx = this.ensureContext();
    if (!ctx) return null;

    const def = AMBIENT_SOUND_MAP[id];
    const spec = def?.synth;
    if (!spec) return null;

    const reverbBus = this.ensureReverb(ctx);

    const dryGain = ctx.createGain();
    dryGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    dryGain.gain.exponentialRampToValueAtTime(
      Math.max(0.001, initialVolume * 0.42),
      ctx.currentTime + 0.7,
    );

    const wetGain = ctx.createGain();
    wetGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    wetGain.gain.exponentialRampToValueAtTime(
      Math.max(0.001, initialVolume * 0.35),
      ctx.currentTime + 0.7,
    );

    dryGain.connect(ctx.destination);
    wetGain.connect(reverbBus);

    let stopped = false;
    const stopCallbacks: Array<() => void> = [];
    let timerId: number | null = null;

    if (spec.mode === 'noise') {
      const bufferSize = ctx.sampleRate * 3;
      const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const output = buffer.getChannelData(ch);
        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          lastOut = 0.94 * lastOut + 0.06 * white;
          output[i] = (lastOut * 1.4 + white * 0.25) * 0.45;
        }
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = spec.filterType ?? 'lowpass';
      filter.frequency.value = spec.cutoff ?? 800;
      filter.Q.value = spec.filterType === 'bandpass' ? 1.1 : 0.7;

      source.connect(filter);
      filter.connect(dryGain);
      source.start();
      stopCallbacks.push(() => {
        source.stop();
        source.disconnect();
        filter.disconnect();
      });
    } else if (spec.mode === 'pad') {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = spec.cutoff ?? 520;
      filter.Q.value = 0.6;
      filter.connect(dryGain);
      filter.connect(wetGain);

      // Slow organic breathing LFO
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.value = 0.07;
      lfoGain.gain.value = (spec.cutoff ?? 520) * 0.28;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();
      stopCallbacks.push(() => {
        lfo.stop();
        lfo.disconnect();
        lfoGain.disconnect();
        filter.disconnect();
      });

      const freqs = spec.freqs ?? [110, 164.81, 220];
      const baseType = spec.oscType === 'sawtooth' ? 'triangle' : (spec.oscType ?? 'sine');

      // Stereo detuned chorus pairs for lush, warm studio pad
      freqs.forEach((freq, idx) => {
        const panOffsets = [-0.35, 0.35];
        panOffsets.forEach((panVal, pIdx) => {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          const panner = ctx.createStereoPanner();

          osc.type = idx === 0 && pIdx === 0 ? 'sine' : baseType;
          osc.frequency.value = freq;
          osc.detune.value = pIdx === 0 ? -5.5 : 5.5;
          panner.pan.value = panVal;
          g.gain.value = idx === 0 ? 0.16 : 0.08;

          osc.connect(g);
          g.connect(panner);
          panner.connect(filter);
          osc.start();
          stopCallbacks.push(() => {
            osc.stop();
            osc.disconnect();
            g.disconnect();
            panner.disconnect();
          });
        });
      });
    } else if (spec.mode === 'chords') {
      // Lush multi-harmonic felt-piano / Rhodes / Ambient Guitar chords
      const isGuitar = id === 'ambient_guitar';
      const isRhodes = id === 'lofi_rhodes';

      const chords = [
        [261.63, 329.63, 392.0, 493.88, 587.33], // Cmaj9
        [220.0, 261.63, 329.63, 392.0, 493.88],  // Am9
        [174.61, 220.0, 261.63, 329.63, 392.0],  // Fmaj9
        [196.0, 246.94, 293.66, 329.63, 440.0],  // G6add9
      ];
      let step = 0;

      const scheduleNextChord = () => {
        if (stopped) return;
        const chord = chords[step % chords.length]!;
        step++;
        const now = ctx.currentTime;

        chord.forEach((freq, i) => {
          const delay = isGuitar ? i * 0.085 : i * 0.045;
          const t0 = now + delay;

          const voiceFilter = ctx.createBiquadFilter();
          voiceFilter.type = 'lowpass';
          voiceFilter.frequency.setValueAtTime(
            isGuitar ? 2200 : isRhodes ? 1400 : 1200,
            t0,
          );
          voiceFilter.frequency.exponentialRampToValueAtTime(
            spec.cutoff ?? 580,
            t0 + 1.4,
          );

          const panner = ctx.createStereoPanner();
          panner.pan.value = (i - 2) * 0.16;

          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const g1 = ctx.createGain();
          const g2 = ctx.createGain();

          osc1.type = isGuitar ? 'triangle' : 'sine';
          osc1.frequency.value = freq;

          // Subtle harmonic overtone (tine for Rhodes, warm 2nd partial for piano/guitar)
          osc2.type = 'sine';
          osc2.frequency.value = isRhodes ? freq * 2 : freq * 2.002;

          const dur = isGuitar ? 3.8 : 4.8;
          g1.gain.setValueAtTime(0.0001, t0);
          g1.gain.linearRampToValueAtTime(0.09, t0 + 0.025);
          g1.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

          g2.gain.setValueAtTime(0.0001, t0);
          g2.gain.linearRampToValueAtTime(isRhodes ? 0.035 : 0.02, t0 + 0.015);
          g2.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.9);

          osc1.connect(g1);
          osc2.connect(g2);
          g1.connect(voiceFilter);
          g2.connect(voiceFilter);
          voiceFilter.connect(panner);
          panner.connect(dryGain);
          panner.connect(wetGain);

          osc1.start(t0);
          osc2.start(t0);
          osc1.stop(t0 + dur + 0.1);
          osc2.stop(t0 + 1.0);
        });

        const baseMs = spec.intervalMs ?? 4800;
        const jitter = (Math.random() - 0.5) * 600;
        timerId = window.setTimeout(scheduleNextChord, baseMs + jitter);
      };

      scheduleNextChord();
    } else if (spec.mode === 'pluck') {
      // Rich acoustic plucked / mallet / bell synthesis with realistic overtone ratios
      const isBell =
        id === 'crystal_bells' || id === 'temple_bell' || id === 'glockenspiel' || id === 'music_box';
      const isHandpan = id === 'hang_drum';
      const isString = id === 'harp_pluck' || id === 'koto_pluck';

      const overtoneRatio = isBell ? 2.756 : isHandpan ? 2.0 : 2.0;
      const scale = spec.freqs ?? [329.63, 392.0, 440.0, 523.25, 587.33];
      let lastIdx = Math.floor(scale.length / 2);

      const scheduleNextPluck = () => {
        if (stopped) return;
        const delta = Math.floor(Math.random() * 3) - 1;
        lastIdx = Math.max(0, Math.min(scale.length - 1, lastIdx + delta));
        const freq = scale[lastIdx]!;
        const now = ctx.currentTime;

        const voiceFilter = ctx.createBiquadFilter();
        voiceFilter.type = 'lowpass';
        voiceFilter.frequency.setValueAtTime(
          isString ? 3200 : isBell ? 3800 : 1800,
          now,
        );
        voiceFilter.frequency.exponentialRampToValueAtTime(
          spec.cutoff ?? 900,
          now + 0.75,
        );

        const panner = ctx.createStereoPanner();
        panner.pan.value = (Math.random() - 0.5) * 0.6;

        const osc = ctx.createOscillator();
        const overtone = ctx.createOscillator();
        const sub = ctx.createOscillator();

        const g = ctx.createGain();
        const og = ctx.createGain();
        const sg = ctx.createGain();

        osc.type = isString ? 'triangle' : 'sine';
        osc.frequency.value = freq;

        overtone.type = 'sine';
        overtone.frequency.value = freq * overtoneRatio;

        sub.type = 'sine';
        sub.frequency.value = freq * 0.5;

        const decay = id === 'temple_bell' ? 3.8 : isBell ? 2.6 : 2.1;
        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(0.14, now + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, now + decay);

        og.gain.setValueAtTime(0.0001, now);
        og.gain.linearRampToValueAtTime(isBell ? 0.06 : 0.035, now + 0.008);
        og.gain.exponentialRampToValueAtTime(0.0001, now + decay * 0.45);

        sg.gain.setValueAtTime(0.0001, now);
        sg.gain.linearRampToValueAtTime(isHandpan ? 0.07 : 0.025, now + 0.02);
        sg.gain.exponentialRampToValueAtTime(0.0001, now + decay * 0.7);

        osc.connect(g);
        overtone.connect(og);
        sub.connect(sg);
        g.connect(voiceFilter);
        og.connect(voiceFilter);
        sg.connect(voiceFilter);
        voiceFilter.connect(panner);
        panner.connect(dryGain);
        panner.connect(wetGain);

        osc.start(now);
        overtone.start(now);
        sub.start(now);
        osc.stop(now + decay + 0.1);
        overtone.stop(now + decay * 0.5 + 0.05);
        sub.stop(now + decay * 0.75 + 0.05);

        const baseMs = spec.intervalMs ?? 1200;
        const jitter = (Math.random() - 0.5) * (baseMs * 0.45);
        timerId = window.setTimeout(scheduleNextPluck, Math.max(450, baseMs + jitter));
      };

      scheduleNextPluck();
    }

    return {
      setVolume: (vol: number) => {
        if (stopped) return;
        const d = Math.max(0.0001, Math.min(0.6, vol * 0.42));
        const w = Math.max(0.0001, Math.min(0.5, vol * 0.35));
        dryGain.gain.setTargetAtTime(d, ctx.currentTime, 0.12);
        wetGain.gain.setTargetAtTime(w, ctx.currentTime, 0.12);
      },
      stop: () => {
        if (stopped) return;
        stopped = true;
        if (timerId !== null) {
          window.clearTimeout(timerId);
        }
        const now = ctx.currentTime;
        dryGain.gain.setTargetAtTime(0.0001, now, 0.14);
        wetGain.gain.setTargetAtTime(0.0001, now, 0.14);
        setTimeout(() => {
          for (const cb of stopCallbacks) {
            try {
              cb();
            } catch {
              // ignore
            }
          }
          dryGain.disconnect();
          wetGain.disconnect();
        }, 360);
      },
    };
  }

  stopAmbient(): void {
    this.syncMix({}, false, 0);
  }

  startCompletionAlarm(mode: TimerMode): void {
    this.stopCompletionAlarm();
    this.playCompletionChime(mode);
    if (typeof window !== 'undefined') {
      this.alarmIntervalId = window.setInterval(() => {
        this.playCompletionChime(mode);
      }, 2400);
    }
  }

  stopCompletionAlarm(): void {
    if (typeof window !== 'undefined' && this.alarmIntervalId !== null) {
      window.clearInterval(this.alarmIntervalId);
      this.alarmIntervalId = null;
    }
  }

  playCompletionChime(mode: TimerMode): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const reverbBus = this.ensureReverb(ctx);
    const notes =
      mode === 'focus' || mode === 'flow'
        ? [523.25, 659.25, 783.99]
        : [440, 523.25];

    const now = ctx.currentTime;
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.14);

      gain.gain.setValueAtTime(0.0001, now + idx * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.11, now + idx * 0.14 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.14 + 1.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.connect(reverbBus);
      osc.start(now + idx * 0.14);
      osc.stop(now + idx * 0.14 + 1.5);
    });
  }
}

export const soundEngine = new SoundEngine();
