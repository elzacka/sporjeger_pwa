import type { ToolType, PricingModel, Platform, IntelCyclePhase } from '@/types/database'

// Verktøytyper
export const TOOL_TYPES: { value: ToolType; label: string }[] = [
  { value: 'web', label: 'Nettside' },
  { value: 'terminal', label: 'Terminal' },
  { value: 'desktop', label: 'Program' },
  { value: 'mobile', label: 'Mobilapp' },
  { value: 'browser_extension', label: 'Utvidelse' },
  { value: 'api', label: 'API' },
  { value: 'dork', label: 'Søkeoperator' },
  { value: 'database', label: 'Database' },
]

// Prismodeller
export const PRICING_MODELS: { value: PricingModel; label: string }[] = [
  { value: 'free', label: 'Gratis' },
  { value: 'freemium', label: 'Gratish' },
  { value: 'paid', label: 'Betalt' },
]

// Plattformer
export const PLATFORMS: { value: Platform; label: string }[] = [
  { value: 'web', label: 'Web' },
  { value: 'windows', label: 'Windows' },
  { value: 'macos', label: 'macOS' },
  { value: 'linux', label: 'Linux' },
  { value: 'android', label: 'Android' },
  { value: 'ios', label: 'iOS' },
]

// OSINT-syklus faser
export const INTEL_PHASES: { value: IntelCyclePhase; label: string }[] = [
  { value: 'planning', label: 'Planlegging' },
  { value: 'collection', label: 'Innsamling' },
  { value: 'processing', label: 'Prosessering' },
  { value: 'analysis', label: 'Analyse' },
  { value: 'dissemination', label: 'Formidling' },
]

// Regioner
export const REGIONS = [
  { value: 'NO', label: 'Norge' },
  { value: 'global', label: 'Global' },
  { value: 'SE', label: 'Sverige' },
  { value: 'DK', label: 'Danmark' },
]
