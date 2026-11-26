import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BookmarkPlus,
  Check,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  RotateCcw,
  Search,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import {
  AMBIENT_CATEGORIES,
  AMBIENT_SOUNDS,
  AMBIENT_SOUND_MAP,
  CURATED_MIX_PRESETS,
  type AmbientCategoryId,
  type AmbientSoundId,
} from '../core/ambientCatalog';
import { soundEngine } from '../services/soundEngine';
import { useTimerStore } from '../store/useTimerStore';
import { AmbientSoundIcon } from './AmbientIcons';

function formatMixSummary(mix: Partial<Record<AmbientSoundId, number>>): string {
  return Object.entries(mix)
    .filter(([, vol]) => (vol ?? 0) > 0.01)
    .map(([id, vol]) => {
      const label = AMBIENT_SOUND_MAP[id as AmbientSoundId]?.label ?? id;
      return `${label} ${Math.round((vol ?? 0) * 100)}%`;
    })
    .join(' · ');
}

export function AmbientBar() {
  const preferences = useTimerStore((s) => s.preferences);
  const soundPresets = useTimerStore((s) => s.soundPresets);
  const toggleAmbientSound = useTimerStore((s) => s.toggleAmbientSound);
  const setAmbientSoundVolume = useTimerStore((s) => s.setAmbientSoundVolume);
  const toggleAmbientMute = useTimerStore((s) => s.toggleAmbientMute);
  const clearAmbientMix = useTimerStore((s) => s.clearAmbientMix);
  const applyAmbientMix = useTimerStore((s) => s.applyAmbientMix);
  const saveCustomSoundPreset = useTimerStore((s) => s.saveCustomSoundPreset);
  const deleteCustomSoundPreset = useTimerStore((s) => s.deleteCustomSoundPreset);
  const updatePreferences = useTimerStore((s) => s.updatePreferences);

  const [expanded, setExpanded] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'sounds' | 'mixes'>('sounds');
  const [activeCategory, setActiveCategory] = useState<AmbientCategoryId | 'all' | 'active'>('all');
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [savingPreset, setSavingPreset] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [loadingIds, setLoadingIds] = useState<Set<AmbientSoundId>>(new Set());
  const categoryMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!categoryMenuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (
        categoryMenuRef.current &&
        !categoryMenuRef.current.contains(e.target as Node)
      ) {
        setCategoryMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', onPointerDown);
    return () => window.removeEventListener('mousedown', onPointerDown);
  }, [categoryMenuOpen]);

  useEffect(() => {
    return soundEngine.onLoadingChange(setLoadingIds);
  }, []);

  useEffect(() => {
    if (!expanded) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (savingPreset) {
          setSavingPreset(false);
        } else {
          setExpanded(false);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [expanded, savingPreset]);

  const activeEntries = (
    Object.entries(preferences.ambientMix) as Array<[AmbientSoundId, number]>
  ).filter(([id, vol]) => vol > 0.01 && Boolean(AMBIENT_SOUND_MAP[id]));

  const hasActiveSounds = activeEntries.length > 0;
  const isMuted = preferences.ambientMuted || !hasActiveSounds;

  const queryLower = searchQuery.trim().toLowerCase();
  const filteredSounds = AMBIENT_SOUNDS.filter((s) => {
    const matchesCat =
      activeCategory === 'all'
        ? true
        : activeCategory === 'active'
          ? (preferences.ambientMix[s.id] ?? 0) > 0.01
          : s.category === activeCategory;
    const matchesQuery =
      !queryLower || s.label.toLowerCase().includes(queryLower);
    return matchesCat && matchesQuery;
  });

  const handleSavePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!presetName.trim()) return;
    saveCustomSoundPreset(presetName.trim());
    setPresetName('');
    setSavingPreset(false);
  };

  return (
    <>
      {/* Left Sidebar (Desktop docked, Mobile slide-over) */}
      <AnimatePresence>
        {expanded && (
          <>
            {/* Mobile-only backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExpanded(false)}
              className="fixed inset-0 z-30 bg-black/15 backdrop-blur-[1px] lg:hidden"
            />

            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 344, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 34 }}
              aria-label="Soundscape Sidebar"
              className="fixed top-0 bottom-0 left-0 z-40 flex h-screen w-[min(90vw,344px)] shrink-0 flex-col overflow-hidden border-r border-neutral-200/70 bg-white shadow-xl"
            >
              <div className="flex h-full w-[min(90vw,344px)] flex-col px-4 pt-5 pb-4">
                {/* Sidebar Header */}
                <div className="flex items-center justify-between gap-2 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium tracking-tight text-neutral-900">
                      Soundscape
                    </span>
                    {hasActiveSounds && (
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600 tabular-nums">
                        {activeEntries.length}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {hasActiveSounds && (
                      <>
                        <button
                          type="button"
                          onClick={() => setSavingPreset((v) => !v)}
                          title="Save current mix preset"
                          className="flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                        >
                          <BookmarkPlus className="h-3 w-3" />
                          <span>Save</span>
                        </button>
                        <button
                          type="button"
                          onClick={clearAmbientMix}
                          title="Clear all active sounds"
                          className="flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span>Clear</span>
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => setExpanded(false)}
                      title="Collapse sidebar"
                      className="cursor-pointer rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                    >
                      <PanelLeftClose className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Inline Save Mix Preset Form */}
                <AnimatePresence>
                  {savingPreset && (
                    <motion.form
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      onSubmit={handleSavePreset}
                      className="mb-2.5 flex items-center gap-1.5 overflow-hidden"
                    >
                      <input
                        type="text"
                        value={presetName}
                        onChange={(e) => setPresetName(e.target.value)}
                        placeholder="Preset name (e.g. Late Night)"
                        autoFocus
                        className="flex-1 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs text-neutral-900 outline-none focus:border-neutral-400"
                      />
                      <button
                        type="submit"
                        className="cursor-pointer rounded-xl bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800"
                      >
                        Save
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>

                {/* Master Volume Row */}
                <div className="flex items-center gap-2.5 border-y border-neutral-100 py-2.5">
                  <button
                    type="button"
                    onClick={toggleAmbientMute}
                    title={preferences.ambientMuted ? 'Unmute all' : 'Mute all'}
                    className="cursor-pointer rounded-lg p-1 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                  >
                    {isMuted ? (
                      <VolumeX className="h-3.5 w-3.5 text-neutral-400" />
                    ) : (
                      <Volume2 className="h-3.5 w-3.5 text-neutral-900" />
                    )}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(preferences.ambientVolume * 100)}
                    onChange={(e) =>
                      updatePreferences({
                        ambientVolume: Number(e.target.value) / 100,
                      })
                    }
                    aria-label="Master ambient volume"
                    className="minimal-slider flex-1 cursor-pointer"
                  />
                  <span className="w-8 text-right text-[11px] font-medium text-neutral-400 tabular-nums">
                    {Math.round(preferences.ambientVolume * 100)}%
                  </span>
                </div>

                {/* Segmented Control: Sounds vs Quick Mixes */}
                <div className="mt-3 grid grid-cols-2 rounded-xl bg-neutral-100/80 p-1">
                  <button
                    type="button"
                    onClick={() => setSidebarTab('sounds')}
                    className={`cursor-pointer rounded-lg py-1.5 text-xs font-medium transition-all ${
                      sidebarTab === 'sounds'
                        ? 'bg-white text-neutral-900 shadow-xs'
                        : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                  >
                    Sounds ({AMBIENT_SOUNDS.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSidebarTab('mixes')}
                    className={`cursor-pointer rounded-lg py-1.5 text-xs font-medium transition-all ${
                      sidebarTab === 'mixes'
                        ? 'bg-white text-neutral-900 shadow-xs'
                        : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                  >
                    Quick Mixes ({CURATED_MIX_PRESETS.length + soundPresets.length})
                  </button>
                </div>

                {sidebarTab === 'sounds' ? (
                  <>
                    {/* Single Compact Row: Search + Category Dropdown */}
                    <div className="mt-2.5 flex items-center gap-1.5 pb-2">
                      <div className="relative flex-1">
                        <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search..."
                          className="w-full rounded-xl bg-neutral-50 py-1.5 pr-7 pl-8 text-xs text-neutral-900 placeholder:text-neutral-400 outline-none focus:bg-neutral-100"
                        />
                        {searchQuery && (
                          <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer text-neutral-400 hover:text-neutral-700"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>

                      <div ref={categoryMenuRef} className="relative">
                        <button
                          type="button"
                          onClick={() => setCategoryMenuOpen((v) => !v)}
                          aria-expanded={categoryMenuOpen}
                          aria-label="Filter by category"
                          className={`flex cursor-pointer items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-colors ${
                            categoryMenuOpen || activeCategory !== 'all'
                              ? 'bg-neutral-900 text-white'
                              : 'bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                          }`}
                        >
                          <span className="max-w-[92px] truncate">
                            {activeCategory === 'all'
                              ? 'All'
                              : activeCategory === 'active'
                                ? `Active (${activeEntries.length})`
                                : AMBIENT_CATEGORIES.find((c) => c.id === activeCategory)
                                    ?.label ?? 'All'}
                          </span>
                          <ChevronDown
                            className={`h-3.5 w-3.5 transition-transform duration-150 ${
                              categoryMenuOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </button>

                        <AnimatePresence>
                          {categoryMenuOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: -4, scale: 0.97 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -4, scale: 0.97 }}
                              transition={{ duration: 0.14 }}
                              className="absolute right-0 z-50 mt-1.5 w-44 rounded-2xl border border-neutral-200/80 bg-white/95 p-1.5 shadow-lg backdrop-blur-md"
                            >
                              {[
                                { id: 'all' as const, label: 'All Sounds' },
                                ...(hasActiveSounds
                                  ? [
                                      {
                                        id: 'active' as const,
                                        label: `Active (${activeEntries.length})`,
                                      },
                                    ]
                                  : []),
                                ...AMBIENT_CATEGORIES,
                              ].map((item) => {
                                const selected = activeCategory === item.id;
                                return (
                                  <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => {
                                      setActiveCategory(item.id);
                                      setCategoryMenuOpen(false);
                                    }}
                                    className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-xs font-medium transition-colors ${
                                      selected
                                        ? 'bg-neutral-900 text-white'
                                        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                                    }`}
                                  >
                                    <span>{item.label}</span>
                                    {selected && <Check className="h-3 w-3" />}
                                  </button>
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Clean Grouped 2-Column Sound Grid */}
                    <div className="minimal-scroll flex-1 space-y-4 overflow-y-auto pr-1 pb-2">
                      {filteredSounds.length === 0 ? (
                        <div className="py-12 text-center text-xs text-neutral-400">
                          No sounds match your filter
                        </div>
                      ) : (
                        AMBIENT_CATEGORIES.map((cat) => {
                          const catSounds = filteredSounds.filter(
                            (s) => s.category === cat.id,
                          );
                          if (catSounds.length === 0) return null;

                          return (
                            <section key={cat.id}>
                              <div className="mb-1.5 flex items-center justify-between px-0.5">
                                <h3 className="text-[11px] font-medium tracking-wide text-neutral-400 uppercase">
                                  {cat.label}
                                </h3>
                                <span className="text-[10px] text-neutral-300 tabular-nums">
                                  {catSounds.length}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-1.5">
                                {catSounds.map((sound) => {
                                  const vol = preferences.ambientMix[sound.id] ?? 0;
                                  const active = vol > 0.01;
                                  const isLoading = loadingIds.has(sound.id);

                                  return (
                                    <div
                                      key={sound.id}
                                      role="button"
                                      tabIndex={0}
                                      onClick={() => toggleAmbientSound(sound.id)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                          e.preventDefault();
                                          toggleAmbientSound(sound.id);
                                        }
                                      }}
                                      className={`group flex cursor-pointer flex-col justify-center rounded-2xl px-3 py-2.5 transition-all select-none ${
                                        active
                                          ? 'bg-neutral-900 text-white shadow-xs'
                                          : 'bg-neutral-50/90 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2.5">
                                        <AmbientSoundIcon
                                          id={sound.id}
                                          className={`h-4 w-4 shrink-0 transition-transform duration-150 group-hover:scale-105 ${
                                            isLoading ? 'animate-pulse opacity-60' : ''
                                          }`}
                                        />
                                        <span className="truncate text-xs font-medium">
                                          {sound.label}
                                        </span>
                                      </div>

                                      {active && (
                                        <div
                                          className="mt-2 flex items-center gap-1.5"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <input
                                            type="range"
                                            min={5}
                                            max={100}
                                            value={Math.round(vol * 100)}
                                            onChange={(e) =>
                                              setAmbientSoundVolume(
                                                sound.id,
                                                Number(e.target.value) / 100,
                                              )
                                            }
                                            aria-label={`${sound.label} volume`}
                                            className="minimal-slider-light w-full cursor-pointer"
                                          />
                                          <span className="w-7 text-right text-[10px] tabular-nums opacity-75">
                                            {Math.round(vol * 100)}%
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </section>
                          );
                        })
                      )}
                    </div>
                  </>
                ) : (
                  /* Quick Mixes Tab */
                  <div className="minimal-scroll mt-3 flex flex-1 flex-col gap-1.5 overflow-y-auto pr-1">
                    {soundPresets.map((preset) => (
                      <div
                        key={preset.id}
                        onClick={() => applyAmbientMix(preset.mix)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            applyAmbientMix(preset.mix);
                          }
                        }}
                        className="group flex cursor-pointer items-center justify-between rounded-2xl bg-neutral-50/90 px-3.5 py-2.5 transition-colors hover:bg-neutral-100"
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="text-xs font-medium text-neutral-900">
                            {preset.name}
                          </div>
                          <div className="mt-0.5 text-[11px] leading-relaxed text-neutral-400">
                            {formatMixSummary(preset.mix) || preset.description || 'Saved mix'}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCustomSoundPreset(preset.id);
                          }}
                          title="Delete saved mix"
                          className="cursor-pointer rounded-lg p-1 text-neutral-400 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-neutral-200/70 hover:text-neutral-800"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}

                    {CURATED_MIX_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => applyAmbientMix(preset.mix)}
                        className="flex cursor-pointer flex-col items-start rounded-2xl bg-neutral-50/90 px-3.5 py-2.5 text-left transition-colors hover:bg-neutral-100"
                      >
                        <span className="text-xs font-medium text-neutral-900">
                          {preset.name}
                        </span>
                        <span className="mt-0.5 text-[11px] leading-relaxed text-neutral-400">
                          {formatMixSummary(preset.mix)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Docked Vertical Left Rail (shown when sidebar is collapsed) */}
      {!expanded && (
        <aside
          aria-label="Soundscape Rail"
          className="fixed top-0 bottom-0 left-0 z-20 flex h-screen w-15 shrink-0 flex-col items-center justify-between border-r border-neutral-200/80 bg-white py-5 text-sm text-neutral-600"
        >
          {/* Top: Expand Sidebar Button */}
          <motion.button
            type="button"
            onClick={() => setExpanded(true)}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            title="Expand soundscape sidebar"
            aria-label="Expand soundscape sidebar"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </motion.button>

          {/* Middle: Active sounds OR minimalist vertical soundscape motif */}
          <div className="minimal-scroll flex flex-1 flex-col items-center justify-center gap-1.5 overflow-x-hidden overflow-y-auto py-2">
            {activeEntries.length === 0 ? (
              <motion.button
                type="button"
                onClick={() => setExpanded(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Open soundscape mixer"
                aria-label="Open soundscape mixer"
                className="group flex cursor-pointer flex-col items-center gap-4 rounded-2xl px-2 py-4 text-neutral-300 transition-colors hover:bg-neutral-50 hover:text-neutral-500"
              >
                {/* Minimalist static soundwave bars */}
                <div className="flex items-center gap-[3px]">
                  <span className="h-2 w-[2px] rounded-full bg-current transition-all duration-300 group-hover:h-3" />
                  <span className="h-4 w-[2px] rounded-full bg-current transition-all duration-300 group-hover:h-5" />
                  <span className="h-6 w-[2px] rounded-full bg-current transition-all duration-300 group-hover:h-3.5" />
                  <span className="h-3.5 w-[2px] rounded-full bg-current transition-all duration-300 group-hover:h-5" />
                  <span className="h-2 w-[2px] rounded-full bg-current transition-all duration-300 group-hover:h-2.5" />
                </div>

                <span
                  style={{ writingMode: 'vertical-rl' }}
                  className="rotate-180 text-[10px] font-medium tracking-[0.22em] uppercase select-none"
                >
                  Soundscape
                </span>
              </motion.button>
            ) : (
              activeEntries.map(([id, vol]) => {
                const def = AMBIENT_SOUND_MAP[id];
                if (!def) return null;

                return (
                  <motion.button
                    key={id}
                    type="button"
                    onClick={() => toggleAmbientSound(id)}
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.92 }}
                    title={`${def.label} (${Math.round(vol * 100)}%) — click to turn off`}
                    aria-label={def.label}
                    className={`flex w-11 shrink-0 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl py-2 transition-colors ${
                      preferences.ambientMuted
                        ? 'bg-neutral-100 text-neutral-400'
                        : 'bg-neutral-900 text-white shadow-xs'
                    }`}
                  >
                    <AmbientSoundIcon id={id} className="h-4 w-4" />
                    <span className="text-[9px] leading-none font-medium tabular-nums">
                      {Math.round(vol * 100)}%
                    </span>
                  </motion.button>
                );
              })
            )}
          </div>

          {/* Bottom: Mute / Unmute Button */}
          <motion.button
            type="button"
            onClick={() => {
              if (hasActiveSounds) {
                toggleAmbientMute();
              } else {
                setExpanded(true);
              }
            }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            title={
              hasActiveSounds
                ? preferences.ambientMuted
                  ? 'Unmute ambient mix'
                  : 'Mute ambient mix'
                : 'Open soundscape sidebar'
            }
            className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl transition-colors ${
              !isMuted
                ? 'bg-neutral-100 text-neutral-900'
                : 'text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700'
            }`}
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </motion.button>
        </aside>
      )}
    </>
  );
}
