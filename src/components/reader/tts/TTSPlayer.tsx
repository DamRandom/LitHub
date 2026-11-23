'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  ChevronUp,
  ChevronDown,
  X,
  Volume2,
  Gauge,
  AlertCircle,
  HelpCircle,
} from 'lucide-react'
import { TTSPlayerProps } from './types'

const SPEEDS = [0.75, 1.0, 1.25, 1.5, 1.75, 2.0]

export default function TTSPlayer({
  currentBookTitle,
  currentBookAuthor,
  currentBookLanguage = 'es',
  currentPage,
  totalPages,
  segments,
  currentSegmentIndex,
  status,
  rate,
  voices,
  selectedVoice,
  isSupported,
  autoAdvancePage,
  onPlay,
  onPause,
  onResume,
  onStop,
  onNextSegment,
  onPrevSegment,
  onSelectSegment,
  onRateChange,
  onVoiceChange,
  onToggleAutoAdvance,
  onClose,
}: TTSPlayerProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [voiceDropdownOpen, setVoiceDropdownOpen] = useState(false)
  const voiceSelectRef = useRef<HTMLDivElement>(null)

  const isPlaying = status === 'playing'
  const isPaused = status === 'paused'

  const totalCount = segments.length
  const currentIndex = currentSegmentIndex

  const handleNext = onNextSegment
  const handlePrev = onPrevSegment
  const handleSelect = onSelectSegment

  // Close voice dropdown on outside click
  useEffect(() => {
    if (!voiceDropdownOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (voiceSelectRef.current && !voiceSelectRef.current.contains(e.target as Node)) {
        setVoiceDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [voiceDropdownOpen])

  // Cycle speed quickly on compact pill click
  const cycleSpeed = () => {
    const currentIdx = SPEEDS.indexOf(rate)
    const nextIdx = (currentIdx + 1) % SPEEDS.length
    onRateChange(SPEEDS[nextIdx])
  }

  // Language match categorization
  const matchingVoices = voices.filter((v) => v.isLanguageMatch)
  const otherVoices = voices.filter((v) => !v.isLanguageMatch)

  if (!isSupported) {
    return (
      <div className="fixed bottom-16 sm:bottom-20 left-1/2 -translate-x-1/2 z-[120] w-[calc(100%-1.5rem)] max-w-md animate-fadeIn">
        <div className="bg-neutral-900 text-white rounded-2xl p-4 shadow-2xl border border-white/10 flex items-start gap-3">
          <AlertCircle size={20} className="text-neutral-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <p className="font-bold text-white mb-0.5">Lectura por voz no soportada</p>
            <p className="text-neutral-400 leading-relaxed">
              Este navegador no cuenta con la API nativa Web Speech Synthesis. Te sugerimos usar Chrome o Safari para escuchar tus libros.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white transition"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* 1. Compact Floating Bottom Player */}
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="fixed bottom-14 sm:bottom-16 left-1/2 -translate-x-1/2 z-[115] w-[calc(100%-1.25rem)] max-w-xl select-none"
      >
        <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl rounded-2xl sm:rounded-3xl p-1.5 sm:p-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.18)] border border-neutral-200/90 dark:border-zinc-800 ring-1 ring-black/5 flex items-center justify-between gap-1 sm:gap-2">
          {/* Left: Play / Pause button & Integrated Anterior/Siguiente controls */}
          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            <button
              onClick={handlePrev}
              disabled={currentPage <= 1 && currentIndex <= 0}
              className="p-1 sm:p-2 rounded-xl text-neutral-600 dark:text-zinc-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-zinc-800 transition disabled:opacity-25 disabled:pointer-events-none cursor-pointer flex items-center justify-center"
              title="Oración anterior"
              aria-label="Oración anterior"
            >
              <SkipBack size={15} />
            </button>

            {isPlaying ? (
              <button
                onClick={onPause}
                className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title="Pausar lectura"
                aria-label="Pausar"
              >
                <Pause size={17} fill="currentColor" />
              </button>
            ) : (
              <button
                onClick={isPaused ? onResume : onPlay}
                className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title="Reproducir lectura en voz alta"
                aria-label="Reproducir"
              >
                <Play size={17} fill="currentColor" className="ml-0.5" />
              </button>
            )}

            <button
              onClick={handleNext}
              disabled={currentPage >= totalPages && currentIndex >= totalCount - 1}
              className="p-1 sm:p-2 rounded-xl text-neutral-600 dark:text-zinc-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-zinc-800 transition disabled:opacity-25 disabled:pointer-events-none cursor-pointer flex items-center justify-center"
              title="Oración siguiente"
              aria-label="Oración siguiente"
            >
              <SkipForward size={15} />
            </button>
          </div>

          {/* Center: Audio status & reading progress */}
          <div
            onClick={() => setIsExpanded(true)}
            className="flex-1 min-w-0 px-1 sm:px-2 cursor-pointer group"
          >
            <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5 sm:mb-1">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1 sm:gap-1.5 shrink-0">
                {isPlaying ? (
                  <>
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold hidden sm:inline">Narrando en voz alta</span>
                  </>
                ) : isPaused ? (
                  <>
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-neutral-400 dark:bg-zinc-500" />
                    <span className="text-neutral-600 dark:text-zinc-400 font-semibold hidden sm:inline">Lectura en pausa</span>
                  </>
                ) : (
                  <span className="hidden sm:inline">Listo para escuchar</span>
                )}
              </span>

              <span className="text-[10px] text-neutral-400 dark:text-zinc-500 font-medium truncate">
                <span className="hidden sm:inline">• </span>Pág. {currentPage} de {totalPages}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-zinc-300">
              <span className="flex items-center gap-1 sm:gap-1.5 font-medium truncate">
                <Volume2 size={12} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                {totalCount > 0 ? (
                  <span className="truncate">
                    <span className="hidden sm:inline">Oración </span>
                    <span className="font-semibold text-neutral-900 dark:text-white">{currentIndex + 1}</span>
                    <span className="text-neutral-400">/{totalCount}</span>
                  </span>
                ) : (
                  <span>Preparando audio...</span>
                )}
              </span>

              {totalCount > 1 && (
                <span className="text-[10px] font-mono text-neutral-400 dark:text-zinc-500 shrink-0 ml-1.5">
                  {Math.round(((currentIndex + 1) / totalCount) * 100)}%
                </span>
              )}
            </div>
          </div>

          {/* Right: Quick Speed Pill, Expand & Close */}
          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            <button
              onClick={cycleSpeed}
              className="px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-xl bg-neutral-100 dark:bg-zinc-800 hover:bg-neutral-200/80 text-neutral-700 dark:text-zinc-200 text-[11px] sm:text-xs font-mono font-bold transition shadow-2xs cursor-pointer"
              title="Cambiar velocidad de lectura"
            >
              {rate.toFixed(2).replace(/\.00$/, '')}x
            </button>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 sm:p-2 rounded-xl text-neutral-500 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              title={isExpanded ? 'Minimizar reproductor' : 'Expandir ajustes de audio'}
              aria-label="Ajustes de voz"
            >
              <ChevronUp size={16} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition cursor-pointer"
              title="Detener y cerrar audio"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* 2. Expanded Mobile-First Audio Control Sheet */}
      <AnimatePresence>
        {isExpanded && (
          <div
            className="fixed inset-0 z-[125] bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn"
            onClick={() => setIsExpanded(false)}
          >
            <motion.div
              initial={{ y: 200, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 200, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-lg bg-white dark:bg-zinc-900 text-neutral-900 dark:text-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-neutral-200/90 dark:border-zinc-800 p-5 sm:p-6 space-y-5 max-h-[85vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-neutral-100 dark:border-zinc-800 pb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center text-xs">
                      <Volume2 size={13} />
                    </span>
                    <h3 className="text-sm font-bold truncate leading-tight">
                      {currentBookTitle}
                    </h3>
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-zinc-400 truncate mt-0.5 ml-8">
                    Página {currentPage} de {totalPages} • {currentBookAuthor}
                  </p>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-zinc-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition cursor-pointer"
                >
                  <ChevronDown size={18} />
                </button>
              </div>

              {/* Progress Scrubber */}
              {totalCount > 1 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-neutral-500 font-medium">
                    <span>Oración {currentIndex + 1} de {totalCount}</span>
                    <span>{Math.round(((currentIndex + 1) / totalCount) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(0, totalCount - 1)}
                    value={currentIndex}
                    onChange={(e) => handleSelect(Number(e.target.value))}
                    className="w-full h-1.5 rounded-lg accent-neutral-900 dark:accent-white cursor-pointer"
                  />
                </div>
              )}

              {/* Main Playback Controls */}
              <div className="flex items-center justify-center gap-4 sm:gap-6 py-1">
                <button
                  onClick={handlePrev}
                  disabled={currentPage <= 1 && currentIndex <= 0}
                  className="p-3 rounded-2xl text-neutral-700 dark:text-zinc-200 hover:bg-neutral-100 dark:hover:bg-zinc-800 transition disabled:opacity-25 disabled:pointer-events-none cursor-pointer"
                  title="Oración anterior"
                >
                  <SkipBack size={20} />
                </button>

                <button
                  onClick={onStop}
                  className="p-3 rounded-2xl text-neutral-700 dark:text-zinc-200 hover:bg-neutral-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                  title="Detener lectura"
                >
                  <Square size={18} />
                </button>

                {isPlaying ? (
                  <button
                    onClick={onPause}
                    className="w-14 h-14 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition cursor-pointer"
                    title="Pausar"
                  >
                    <Pause size={24} fill="currentColor" />
                  </button>
                ) : (
                  <button
                    onClick={isPaused ? onResume : onPlay}
                    className="w-14 h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition cursor-pointer"
                    title="Reproducir"
                  >
                    <Play size={24} fill="currentColor" className="ml-0.5" />
                  </button>
                )}

                <button
                  onClick={handleNext}
                  disabled={currentPage >= totalPages && currentIndex >= totalCount - 1}
                  className="p-3 rounded-2xl text-neutral-700 dark:text-zinc-200 hover:bg-neutral-100 dark:hover:bg-zinc-800 transition disabled:opacity-25 disabled:pointer-events-none cursor-pointer"
                  title="Oración siguiente"
                >
                  <SkipForward size={20} />
                </button>
              </div>

              {/* Speed Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-neutral-700 dark:text-zinc-300">
                  <span className="flex items-center gap-1.5">
                    <Gauge size={14} className="text-neutral-400" />
                    <span>Velocidad de reproducción</span>
                  </span>
                  <span className="text-neutral-500 font-mono text-[11px]">{rate}x</span>
                </div>
                <div className="grid grid-cols-6 gap-1 bg-neutral-100 dark:bg-zinc-800 p-1 rounded-2xl">
                  {SPEEDS.map((s) => (
                    <button
                      key={s}
                      onClick={() => onRateChange(s)}
                      className={`py-1.5 text-xs font-mono font-bold rounded-xl transition cursor-pointer ${
                        rate === s
                          ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-xs'
                          : 'text-neutral-600 dark:text-zinc-400 hover:text-neutral-900'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Voice Selector */}
              <div className="space-y-2" ref={voiceSelectRef}>
                <div className="flex items-center justify-between text-xs font-semibold text-neutral-700 dark:text-zinc-300">
                  <span className="flex items-center gap-1.5">
                    <Volume2 size={14} className="text-neutral-400" />
                    <span>Voz del dispositivo</span>
                  </span>
                  <span className="text-[10px] text-neutral-400 font-medium">
                    {voices.length} disponibles
                  </span>
                </div>

                <div className="relative">
                  <button
                    onClick={() => setVoiceDropdownOpen(!voiceDropdownOpen)}
                    className="w-full flex items-center justify-between p-3 bg-neutral-50 dark:bg-zinc-800/80 border border-neutral-200/90 dark:border-zinc-700 rounded-2xl text-xs font-medium text-left hover:border-neutral-400 transition cursor-pointer"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-neutral-900 dark:text-white truncate">
                        {selectedVoice ? selectedVoice.name : 'Voz predeterminada'}
                      </p>
                      <p className="text-[10px] text-neutral-500 dark:text-zinc-400">
                        {selectedVoice?.lang || currentBookLanguage} • {selectedVoice?.localService ? 'Voz local' : 'Voz sintetizada'}
                      </p>
                    </div>
                    <ChevronDown size={15} className={`text-neutral-400 transition-transform ${voiceDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {voiceDropdownOpen && (
                    <div className="absolute left-0 bottom-full mb-2 w-full max-h-56 overflow-y-auto bg-white dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 rounded-2xl shadow-xl p-1.5 z-50 space-y-1">
                      {matchingVoices.length > 0 && (
                        <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                          Voces recomendadas ({currentBookLanguage.toUpperCase()})
                        </div>
                      )}
                      {matchingVoices.map((v) => {
                        const isSelected = selectedVoice?.name === v.voice.name
                        return (
                          <button
                            key={v.voice.name + v.voice.lang}
                            onClick={() => {
                              onVoiceChange(v.voice)
                              setVoiceDropdownOpen(false)
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition cursor-pointer ${
                              isSelected
                                ? 'bg-neutral-900 text-white font-bold'
                                : 'hover:bg-neutral-100 dark:hover:bg-zinc-700 text-neutral-800 dark:text-zinc-100'
                            }`}
                          >
                            <span className="truncate">{v.name}</span>
                            <span className="text-[10px] opacity-70 ml-2 shrink-0">{v.lang}</span>
                          </button>
                        )
                      })}

                      {otherVoices.length > 0 && (
                        <>
                          <div className="px-2 pt-2 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400 border-t border-neutral-100 dark:border-zinc-700">
                            Otras voces del dispositivo
                          </div>
                          {otherVoices.map((v) => {
                            const isSelected = selectedVoice?.name === v.voice.name
                            return (
                              <button
                                key={v.voice.name + v.voice.lang}
                                onClick={() => {
                                  onVoiceChange(v.voice)
                                  setVoiceDropdownOpen(false)
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition cursor-pointer ${
                                  isSelected
                                    ? 'bg-neutral-900 text-white font-bold'
                                    : 'hover:bg-neutral-100 dark:hover:bg-zinc-700 text-neutral-700 dark:text-zinc-300'
                                }`}
                              >
                                <span className="truncate">{v.name}</span>
                                <span className="text-[10px] opacity-60 ml-2 shrink-0">{v.lang}</span>
                              </button>
                            )
                          })}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Auto Advance Toggle */}
              <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-zinc-800/60 border border-neutral-200/60 dark:border-zinc-700/60 rounded-2xl">
                <div>
                  <p className="text-xs font-bold text-neutral-800 dark:text-zinc-200">
                    Giro de página automático
                  </p>
                  <p className="text-[11px] text-neutral-500 dark:text-zinc-400">
                    Avanza a la página siguiente al terminar de leer
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onToggleAutoAdvance}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    autoAdvancePage ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-300 dark:bg-zinc-700'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-white dark:bg-neutral-900 shadow-md block absolute top-1 transition-transform ${
                      autoAdvancePage ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Privacy / Zero-cost note */}
              <div className="flex items-start gap-2 text-[11px] text-neutral-400 dark:text-zinc-500 pt-1">
                <HelpCircle size={14} className="shrink-0 mt-0.5" />
                <p>
                  LitHub utiliza las voces nativas de tu dispositivo. La síntesis es completamente gratuita, privada y no envía tus libros a servidores externos.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
