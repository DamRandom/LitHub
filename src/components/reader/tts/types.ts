export type PlaybackStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'stopped'

export interface TTSParagraph {
  id: string
  index: number
  element: HTMLElement | null
  text: string
  firstSegmentIndex: number
  segmentCount: number
}

export interface TTSSegment {
  id: string
  text: string
  element?: HTMLElement | null
  index: number
  paragraphId?: string
  paragraphIndex?: number
  isFirstInParagraph?: boolean
  isLastInParagraph?: boolean
  pageNumber?: number
}

export interface TTSExtractionResult {
  segments: TTSSegment[]
  paragraphs: TTSParagraph[]
}

export interface TTSVoiceOption {
  voice: SpeechSynthesisVoice
  name: string
  lang: string
  isDefault: boolean
  isLocalService: boolean
  isLanguageMatch: boolean
}

export interface TTSPlayerProps {
  currentBookTitle: string
  currentBookAuthor: string
  currentBookLanguage?: string
  currentPage: number
  totalPages: number
  segments: TTSSegment[]
  currentSegmentIndex: number
  status: PlaybackStatus
  rate: number
  voices: TTSVoiceOption[]
  selectedVoice: SpeechSynthesisVoice | null
  isSupported: boolean
  autoAdvancePage: boolean
  onPlay: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
  onNextSegment: () => void
  onPrevSegment: () => void
  onSelectSegment: (index: number) => void
  onRateChange: (rate: number) => void
  onVoiceChange: (voice: SpeechSynthesisVoice) => void
  onToggleAutoAdvance: () => void
  onClose: () => void
}
