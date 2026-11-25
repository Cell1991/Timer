export type AmbientCategoryId =
  | 'noise'
  | 'rain'
  | 'nature'
  | 'animals'
  | 'transport'
  | 'cozy'
  | 'instruments';

export type AmbientSoundId =
  // Focus & Noise (14)
  | 'white_noise'
  | 'pink_noise'
  | 'brown_noise'
  | 'binaural_alpha'
  | 'binaural_theta'
  | 'binaural_beta'
  | 'binaural_delta'
  | 'binaural_gamma'
  | 'green_noise'
  | 'blue_noise'
  | 'violet_noise'
  | 'deep_sub'
  | 'tape_hiss'
  | 'space_drone'
  // Rain & Storm (10)
  | 'light_rain'
  | 'heavy_rain'
  | 'rain_leaves'
  | 'rain_window'
  | 'rain_tent'
  | 'rain_car'
  | 'rain_umbrella'
  | 'thunder'
  | 'droplets'
  | 'windshield_wipers'
  // Nature (14)
  | 'wind'
  | 'wind_trees'
  | 'howling_wind'
  | 'waves'
  | 'river'
  | 'waterfall'
  | 'campfire'
  | 'jungle'
  | 'walk_snow'
  | 'walk_gravel'
  | 'walk_leaves'
  | 'underwater'
  | 'bubbles'
  | 'night_village'
  // Animals (11)
  | 'birds'
  | 'crickets'
  | 'frog'
  | 'cat_purr'
  | 'whale'
  | 'owl'
  | 'seagulls'
  | 'beehive'
  | 'sheep'
  | 'wolf'
  | 'woodpecker'
  // Travel & Places (14)
  | 'train'
  | 'train_outer'
  | 'highway'
  | 'road'
  | 'traffic'
  | 'airplane'
  | 'subway'
  | 'rowing_boat'
  | 'sailboat'
  | 'submarine'
  | 'cafe'
  | 'library'
  | 'office'
  | 'restaurant'
  // Cozy & Home (14)
  | 'clock'
  | 'ceiling_fan'
  | 'keyboard'
  | 'typewriter'
  | 'paper'
  | 'vinyl_effect'
  | 'boiling_water'
  | 'washing_machine'
  | 'dryer'
  | 'laundry_room'
  | 'temple'
  | 'church'
  | 'soft_hearth'
  | 'rainy_porch'
  // Instruments & Frequencies (23)
  | 'singing_bowl'
  | 'wind_chimes'
  | 'warm_pad'
  | 'soft_piano'
  | 'kalimba'
  | 'pad_432hz'
  | 'pad_528hz'
  | 'pad_639hz'
  | 'pad_741hz'
  | 'pad_852hz'
  | 'lofi_rhodes'
  | 'music_box'
  | 'cello_drone'
  | 'harp_pluck'
  | 'hang_drum'
  | 'marimba'
  | 'flute_pad'
  | 'koto_pluck'
  | 'soft_organ'
  | 'crystal_bells'
  | 'temple_bell'
  | 'glockenspiel'
  | 'ambient_guitar';

export interface AmbientCategoryDef {
  id: AmbientCategoryId;
  label: string;
}

export interface SynthSpec {
  mode: 'noise' | 'pad' | 'pluck' | 'chords';
  /** Base frequencies in Hz */
  freqs?: number[];
  /** Cutoff frequency for lowpass/bandpass */
  cutoff?: number;
  filterType?: BiquadFilterType;
  oscType?: OscillatorType;
  intervalMs?: number;
}

export interface AmbientSoundDef {
  id: AmbientSoundId;
  label: string;
  category: AmbientCategoryId;
  kind: 'file' | 'synth';
  file?: string;
  synth?: SynthSpec;
  defaultVolume: number;
}

export interface CuratedMixPreset {
  id: string;
  name: string;
  subtitle: string;
  mix: Partial<Record<AmbientSoundId, number>>;
}

export const AMBIENT_CATEGORIES: AmbientCategoryDef[] = [
  { id: 'noise', label: 'Focus & Noise' },
  { id: 'rain', label: 'Rain & Storm' },
  { id: 'nature', label: 'Nature' },
  { id: 'animals', label: 'Animals' },
  { id: 'transport', label: 'Travel & Places' },
  { id: 'cozy', label: 'Cozy & Home' },
  { id: 'instruments', label: 'Instruments' },
];

export const AMBIENT_SOUNDS: AmbientSoundDef[] = [
  // 1. Focus & Noise (14)
  { id: 'white_noise', label: 'White Noise', category: 'noise', kind: 'file', file: 'white-noise.wav', defaultVolume: 0.3 },
  { id: 'pink_noise', label: 'Pink Noise', category: 'noise', kind: 'file', file: 'pink-noise.wav', defaultVolume: 0.35 },
  { id: 'brown_noise', label: 'Brown Noise', category: 'noise', kind: 'file', file: 'brown-noise.wav', defaultVolume: 0.45 },
  { id: 'binaural_alpha', label: 'Alpha Focus', category: 'noise', kind: 'file', file: 'binaural-alpha.wav', defaultVolume: 0.35 },
  { id: 'binaural_theta', label: 'Theta Calm', category: 'noise', kind: 'file', file: 'binaural-theta.wav', defaultVolume: 0.35 },
  { id: 'binaural_beta', label: 'Beta Alert', category: 'noise', kind: 'file', file: 'binaural-beta.wav', defaultVolume: 0.3 },
  { id: 'binaural_delta', label: 'Delta Rest', category: 'noise', kind: 'file', file: 'binaural-delta.wav', defaultVolume: 0.35 },
  { id: 'binaural_gamma', label: 'Gamma Clarity', category: 'noise', kind: 'file', file: 'binaural-gamma.wav', defaultVolume: 0.28 },
  { id: 'green_noise', label: 'Green Noise', category: 'noise', kind: 'synth', synth: { mode: 'noise', filterType: 'bandpass', cutoff: 500 }, defaultVolume: 0.4 },
  { id: 'blue_noise', label: 'Blue Noise', category: 'noise', kind: 'synth', synth: { mode: 'noise', filterType: 'bandpass', cutoff: 2200 }, defaultVolume: 0.25 },
  { id: 'violet_noise', label: 'Violet Shimmer', category: 'noise', kind: 'synth', synth: { mode: 'noise', filterType: 'highpass', cutoff: 1800 }, defaultVolume: 0.2 },
  { id: 'deep_sub', label: 'Deep Sub Hum', category: 'noise', kind: 'synth', synth: { mode: 'pad', freqs: [65.41, 98.0, 130.81], cutoff: 240, oscType: 'sine' }, defaultVolume: 0.4 },
  { id: 'tape_hiss', label: 'Warm Tape Hiss', category: 'noise', kind: 'synth', synth: { mode: 'noise', filterType: 'lowpass', cutoff: 1400 }, defaultVolume: 0.3 },
  { id: 'space_drone', label: 'Space Drone', category: 'noise', kind: 'synth', synth: { mode: 'pad', freqs: [73.42, 110.0, 146.83, 220.0], cutoff: 340, oscType: 'triangle' }, defaultVolume: 0.35 },

  // 2. Rain & Storm (10)
  { id: 'light_rain', label: 'Light Rain', category: 'rain', kind: 'file', file: 'light-rain.mp3', defaultVolume: 0.5 },
  { id: 'heavy_rain', label: 'Heavy Rain', category: 'rain', kind: 'file', file: 'heavy-rain.mp3', defaultVolume: 0.4 },
  { id: 'rain_leaves', label: 'Rain on Leaves', category: 'rain', kind: 'file', file: 'rain-on-leaves.mp3', defaultVolume: 0.5 },
  { id: 'rain_window', label: 'Rain on Window', category: 'rain', kind: 'file', file: 'rain-on-window.mp3', defaultVolume: 0.5 },
  { id: 'rain_tent', label: 'Rain on Tent', category: 'rain', kind: 'file', file: 'rain-on-tent.mp3', defaultVolume: 0.45 },
  { id: 'rain_car', label: 'Rain on Car', category: 'rain', kind: 'file', file: 'rain-on-car-roof.mp3', defaultVolume: 0.45 },
  { id: 'rain_umbrella', label: 'Rain Umbrella', category: 'rain', kind: 'file', file: 'rain-on-umbrella.mp3', defaultVolume: 0.45 },
  { id: 'thunder', label: 'Soft Thunder', category: 'rain', kind: 'file', file: 'thunder.mp3', defaultVolume: 0.35 },
  { id: 'droplets', label: 'Water Droplets', category: 'rain', kind: 'file', file: 'droplets.mp3', defaultVolume: 0.4 },
  { id: 'windshield_wipers', label: 'Car Wipers', category: 'rain', kind: 'file', file: 'windshield-wipers.mp3', defaultVolume: 0.35 },

  // 3. Nature (14)
  { id: 'wind', label: 'Gentle Wind', category: 'nature', kind: 'file', file: 'wind.mp3', defaultVolume: 0.4 },
  { id: 'wind_trees', label: 'Wind in Trees', category: 'nature', kind: 'file', file: 'wind-in-trees.mp3', defaultVolume: 0.45 },
  { id: 'howling_wind', label: 'Mountain Wind', category: 'nature', kind: 'file', file: 'howling-wind.mp3', defaultVolume: 0.35 },
  { id: 'waves', label: 'Ocean Waves', category: 'nature', kind: 'file', file: 'waves.mp3', defaultVolume: 0.45 },
  { id: 'river', label: 'Flowing River', category: 'nature', kind: 'file', file: 'river.mp3', defaultVolume: 0.45 },
  { id: 'waterfall', label: 'Waterfall', category: 'nature', kind: 'file', file: 'waterfall.mp3', defaultVolume: 0.35 },
  { id: 'campfire', label: 'Campfire', category: 'nature', kind: 'file', file: 'campfire.mp3', defaultVolume: 0.5 },
  { id: 'jungle', label: 'Tropical Jungle', category: 'nature', kind: 'file', file: 'jungle.mp3', defaultVolume: 0.4 },
  { id: 'walk_snow', label: 'Snow Steps', category: 'nature', kind: 'file', file: 'walk-in-snow.mp3', defaultVolume: 0.35 },
  { id: 'walk_gravel', label: 'Gravel Path', category: 'nature', kind: 'file', file: 'walk-on-gravel.mp3', defaultVolume: 0.35 },
  { id: 'walk_leaves', label: 'Autumn Leaves', category: 'nature', kind: 'file', file: 'walk-on-leaves.mp3', defaultVolume: 0.35 },
  { id: 'underwater', label: 'Underwater', category: 'nature', kind: 'file', file: 'underwater.mp3', defaultVolume: 0.4 },
  { id: 'bubbles', label: 'Soft Bubbles', category: 'nature', kind: 'file', file: 'bubbles.mp3', defaultVolume: 0.35 },
  { id: 'night_village', label: 'Night Village', category: 'nature', kind: 'file', file: 'night-village.mp3', defaultVolume: 0.4 },

  // 4. Animals (11)
  { id: 'birds', label: 'Forest Birds', category: 'animals', kind: 'file', file: 'birds.mp3', defaultVolume: 0.4 },
  { id: 'crickets', label: 'Night Crickets', category: 'animals', kind: 'file', file: 'crickets.mp3', defaultVolume: 0.35 },
  { id: 'frog', label: 'Pond Frogs', category: 'animals', kind: 'file', file: 'frog.mp3', defaultVolume: 0.35 },
  { id: 'cat_purr', label: 'Cat Purring', category: 'animals', kind: 'file', file: 'cat-purring.mp3', defaultVolume: 0.55 },
  { id: 'whale', label: 'Whale Song', category: 'animals', kind: 'file', file: 'whale.mp3', defaultVolume: 0.35 },
  { id: 'owl', label: 'Night Owl', category: 'animals', kind: 'file', file: 'owl.mp3', defaultVolume: 0.3 },
  { id: 'seagulls', label: 'Seagulls', category: 'animals', kind: 'file', file: 'seagulls.mp3', defaultVolume: 0.3 },
  { id: 'beehive', label: 'Meadow Bees', category: 'animals', kind: 'file', file: 'beehive.mp3', defaultVolume: 0.25 },
  { id: 'sheep', label: 'Pasture Sheep', category: 'animals', kind: 'file', file: 'sheep.mp3', defaultVolume: 0.3 },
  { id: 'wolf', label: 'Distant Wolf', category: 'animals', kind: 'file', file: 'wolf.mp3', defaultVolume: 0.25 },
  { id: 'woodpecker', label: 'Woodpecker', category: 'animals', kind: 'file', file: 'woodpecker.mp3', defaultVolume: 0.3 },

  // 5. Travel & Places (14)
  { id: 'train', label: 'Train Cabin', category: 'transport', kind: 'file', file: 'inside-a-train.mp3', defaultVolume: 0.45 },
  { id: 'train_outer', label: 'Distant Train', category: 'transport', kind: 'file', file: 'train.mp3', defaultVolume: 0.35 },
  { id: 'highway', label: 'Distant Highway', category: 'transport', kind: 'file', file: 'highway.mp3', defaultVolume: 0.35 },
  { id: 'road', label: 'Country Road', category: 'transport', kind: 'file', file: 'road.mp3', defaultVolume: 0.35 },
  { id: 'traffic', label: 'City Traffic', category: 'transport', kind: 'file', file: 'traffic.mp3', defaultVolume: 0.3 },
  { id: 'airplane', label: 'Airplane Cabin', category: 'transport', kind: 'file', file: 'airplane.mp3', defaultVolume: 0.35 },
  { id: 'subway', label: 'Subway Station', category: 'transport', kind: 'file', file: 'subway-station.mp3', defaultVolume: 0.3 },
  { id: 'rowing_boat', label: 'Rowing Boat', category: 'transport', kind: 'file', file: 'rowing-boat.mp3', defaultVolume: 0.4 },
  { id: 'sailboat', label: 'Sailboat', category: 'transport', kind: 'file', file: 'sailboat.mp3', defaultVolume: 0.4 },
  { id: 'submarine', label: 'Submarine', category: 'transport', kind: 'file', file: 'submarine.mp3', defaultVolume: 0.35 },
  { id: 'cafe', label: 'Cozy Cafe', category: 'transport', kind: 'file', file: 'cafe.mp3', defaultVolume: 0.4 },
  { id: 'library', label: 'Quiet Library', category: 'transport', kind: 'file', file: 'library.mp3', defaultVolume: 0.45 },
  { id: 'office', label: 'Quiet Office', category: 'transport', kind: 'file', file: 'office.mp3', defaultVolume: 0.35 },
  { id: 'restaurant', label: 'Bistro Ambience', category: 'transport', kind: 'file', file: 'restaurant.mp3', defaultVolume: 0.3 },

  // 6. Cozy & Home (14)
  { id: 'clock', label: 'Wall Clock', category: 'cozy', kind: 'file', file: 'clock.mp3', defaultVolume: 0.35 },
  { id: 'ceiling_fan', label: 'Ceiling Fan', category: 'cozy', kind: 'file', file: 'ceiling-fan.mp3', defaultVolume: 0.4 },
  { id: 'keyboard', label: 'Mechanical Keys', category: 'cozy', kind: 'file', file: 'keyboard.mp3', defaultVolume: 0.35 },
  { id: 'typewriter', label: 'Typewriter', category: 'cozy', kind: 'file', file: 'typewriter.mp3', defaultVolume: 0.3 },
  { id: 'paper', label: 'Turning Pages', category: 'cozy', kind: 'file', file: 'paper.mp3', defaultVolume: 0.35 },
  { id: 'vinyl_effect', label: 'Vinyl Crackle', category: 'cozy', kind: 'file', file: 'vinyl-effect.mp3', defaultVolume: 0.4 },
  { id: 'boiling_water', label: 'Simmering Kettle', category: 'cozy', kind: 'file', file: 'boiling-water.mp3', defaultVolume: 0.35 },
  { id: 'washing_machine', label: 'Washer Hum', category: 'cozy', kind: 'file', file: 'washing-machine.mp3', defaultVolume: 0.35 },
  { id: 'dryer', label: 'Warm Dryer', category: 'cozy', kind: 'file', file: 'dryer.mp3', defaultVolume: 0.35 },
  { id: 'laundry_room', label: 'Laundry Room', category: 'cozy', kind: 'file', file: 'laundry-room.mp3', defaultVolume: 0.35 },
  { id: 'temple', label: 'Quiet Temple', category: 'cozy', kind: 'file', file: 'temple.mp3', defaultVolume: 0.4 },
  { id: 'church', label: 'Cathedral Hall', category: 'cozy', kind: 'file', file: 'church.mp3', defaultVolume: 0.35 },
  { id: 'soft_hearth', label: 'Warm Hearth', category: 'cozy', kind: 'synth', synth: { mode: 'noise', filterType: 'lowpass', cutoff: 260 }, defaultVolume: 0.45 },
  { id: 'rainy_porch', label: 'Porch Breeze', category: 'cozy', kind: 'synth', synth: { mode: 'noise', filterType: 'bandpass', cutoff: 750 }, defaultVolume: 0.35 },

  // 7. Instruments & Frequencies (23)
  { id: 'singing_bowl', label: 'Singing Bowl', category: 'instruments', kind: 'file', file: 'singing-bowl.mp3', defaultVolume: 0.4 },
  { id: 'wind_chimes', label: 'Wind Chimes', category: 'instruments', kind: 'file', file: 'wind-chimes.mp3', defaultVolume: 0.35 },
  { id: 'warm_pad', label: 'Warm Pad', category: 'instruments', kind: 'synth', synth: { mode: 'pad', freqs: [110, 164.81, 220, 277.18], cutoff: 460, oscType: 'sine' }, defaultVolume: 0.4 },
  { id: 'soft_piano', label: 'Soft Piano', category: 'instruments', kind: 'synth', synth: { mode: 'chords', cutoff: 780, intervalMs: 4600 }, defaultVolume: 0.4 },
  { id: 'kalimba', label: 'Kalimba', category: 'instruments', kind: 'synth', synth: { mode: 'pluck', freqs: [329.63, 392.0, 440.0, 523.25, 587.33, 659.25], cutoff: 1400, intervalMs: 1150 }, defaultVolume: 0.4 },
  { id: 'pad_432hz', label: '432Hz Healing', category: 'instruments', kind: 'synth', synth: { mode: 'pad', freqs: [108, 216, 432], cutoff: 520, oscType: 'sine' }, defaultVolume: 0.35 },
  { id: 'pad_528hz', label: '528Hz Solfeggio', category: 'instruments', kind: 'synth', synth: { mode: 'pad', freqs: [132, 264, 528], cutoff: 580, oscType: 'sine' }, defaultVolume: 0.35 },
  { id: 'pad_639hz', label: '639Hz Harmony', category: 'instruments', kind: 'synth', synth: { mode: 'pad', freqs: [159.75, 319.5, 639], cutoff: 640, oscType: 'sine' }, defaultVolume: 0.32 },
  { id: 'pad_741hz', label: '741Hz Clarity', category: 'instruments', kind: 'synth', synth: { mode: 'pad', freqs: [185.25, 370.5, 741], cutoff: 720, oscType: 'sine' }, defaultVolume: 0.3 },
  { id: 'pad_852hz', label: '852Hz Serene', category: 'instruments', kind: 'synth', synth: { mode: 'pad', freqs: [213, 426, 852], cutoff: 820, oscType: 'sine' }, defaultVolume: 0.28 },
  { id: 'lofi_rhodes', label: 'Lo-Fi Rhodes', category: 'instruments', kind: 'synth', synth: { mode: 'chords', cutoff: 620, oscType: 'sine', intervalMs: 5200 }, defaultVolume: 0.4 },
  { id: 'music_box', label: 'Music Box', category: 'instruments', kind: 'synth', synth: { mode: 'pluck', freqs: [523.25, 659.25, 783.99, 987.77, 1046.5], cutoff: 2200, intervalMs: 950 }, defaultVolume: 0.32 },
  { id: 'cello_drone', label: 'Cello Drone', category: 'instruments', kind: 'synth', synth: { mode: 'pad', freqs: [65.41, 98.0, 130.81, 196.0], cutoff: 380, oscType: 'sawtooth' }, defaultVolume: 0.3 },
  { id: 'harp_pluck', label: 'Celtic Harp', category: 'instruments', kind: 'synth', synth: { mode: 'pluck', freqs: [261.63, 293.66, 329.63, 392.0, 440.0, 523.25], cutoff: 1600, intervalMs: 850 }, defaultVolume: 0.35 },
  { id: 'hang_drum', label: 'Handpan Drum', category: 'instruments', kind: 'synth', synth: { mode: 'pluck', freqs: [146.83, 220.0, 261.63, 293.66, 329.63, 392.0], cutoff: 1100, intervalMs: 1400 }, defaultVolume: 0.4 },
  { id: 'marimba', label: 'Soft Marimba', category: 'instruments', kind: 'synth', synth: { mode: 'pluck', freqs: [261.63, 329.63, 392.0, 440.0, 523.25], cutoff: 950, intervalMs: 1050 }, defaultVolume: 0.38 },
  { id: 'flute_pad', label: 'Bamboo Flute', category: 'instruments', kind: 'synth', synth: { mode: 'pad', freqs: [293.66, 440.0, 587.33], cutoff: 760, oscType: 'sine' }, defaultVolume: 0.32 },
  { id: 'koto_pluck', label: 'Zen Koto', category: 'instruments', kind: 'synth', synth: { mode: 'pluck', freqs: [293.66, 329.63, 392.0, 440.0, 587.33], cutoff: 1700, intervalMs: 1600 }, defaultVolume: 0.35 },
  { id: 'soft_organ', label: 'Warm Organ', category: 'instruments', kind: 'synth', synth: { mode: 'pad', freqs: [130.81, 196.0, 261.63, 329.63], cutoff: 500, oscType: 'triangle' }, defaultVolume: 0.32 },
  { id: 'crystal_bells', label: 'Crystal Bells', category: 'instruments', kind: 'synth', synth: { mode: 'pluck', freqs: [783.99, 987.77, 1174.66, 1318.51, 1567.98], cutoff: 2600, intervalMs: 2200 }, defaultVolume: 0.25 },
  { id: 'temple_bell', label: 'Temple Bell', category: 'instruments', kind: 'synth', synth: { mode: 'pluck', freqs: [220.0, 329.63, 440.0], cutoff: 900, intervalMs: 3600 }, defaultVolume: 0.35 },
  { id: 'glockenspiel', label: 'Glockenspiel', category: 'instruments', kind: 'synth', synth: { mode: 'pluck', freqs: [587.33, 659.25, 783.99, 880.0, 1046.5], cutoff: 2400, intervalMs: 1300 }, defaultVolume: 0.26 },
  { id: 'ambient_guitar', label: 'Ambient Guitar', category: 'instruments', kind: 'synth', synth: { mode: 'chords', cutoff: 900, oscType: 'triangle', intervalMs: 4200 }, defaultVolume: 0.35 },
];

export const AMBIENT_SOUND_MAP: Record<AmbientSoundId, AmbientSoundDef> =
  Object.fromEntries(AMBIENT_SOUNDS.map((s) => [s.id, s])) as Record<
    AmbientSoundId,
    AmbientSoundDef
  >;

export const CURATED_MIX_PRESETS: CuratedMixPreset[] = [
  {
    id: 'preset_rainy_cafe',
    name: 'Rainy Cafe',
    subtitle: 'Window rain + warm cafe + piano',
    mix: { rain_window: 0.45, cafe: 0.4, soft_piano: 0.3 },
  },
  {
    id: 'preset_deep_focus',
    name: 'Deep Focus',
    subtitle: 'Brown noise + alpha waves + library',
    mix: { brown_noise: 0.5, binaural_alpha: 0.3, library: 0.25 },
  },
  {
    id: 'preset_forest_night',
    name: 'Forest Night',
    subtitle: 'Crickets + campfire + trees + owl',
    mix: { crickets: 0.4, campfire: 0.5, wind_trees: 0.35, owl: 0.25 },
  },
  {
    id: 'preset_cozy_cabin',
    name: 'Cozy Cabin',
    subtitle: 'Tent rain + fireplace + cat purr',
    mix: { rain_tent: 0.45, campfire: 0.55, thunder: 0.25, cat_purr: 0.4 },
  },
  {
    id: 'preset_zen_garden',
    name: 'Zen Garden',
    subtitle: 'River + singing bowl + chimes + birds',
    mix: { river: 0.45, singing_bowl: 0.35, wind_chimes: 0.3, birds: 0.3 },
  },
  {
    id: 'preset_night_train',
    name: 'Night Train',
    subtitle: 'Train cabin + light rain + warm pad',
    mix: { train: 0.5, light_rain: 0.35, warm_pad: 0.25 },
  },
  {
    id: 'preset_ocean_meditation',
    name: 'Ocean Calm',
    subtitle: 'Ocean waves + whale + theta calm',
    mix: { waves: 0.55, whale: 0.3, binaural_theta: 0.3 },
  },
  {
    id: 'preset_lofi_study',
    name: 'Lo-Fi Study',
    subtitle: 'Vinyl crackle + Rhodes + leaf rain',
    mix: { vinyl_effect: 0.35, lofi_rhodes: 0.45, rain_leaves: 0.35 },
  },
];
