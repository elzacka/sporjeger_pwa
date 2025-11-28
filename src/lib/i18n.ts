// Norske oversettelser for UI
// Database er på engelsk, UI er på norsk

export const t = {
  // Verktøytyper
  toolType: {
    web: 'Nettside',
    terminal: 'Terminal',
    desktop: 'Program',
    mobile: 'Mobilapp',
    browser_extension: 'Utvidelse',
    api: 'API',
    dork: 'Søkeoperator',
    database: 'Database'
  },

  // Prismodell
  pricing: {
    free: 'Gratis',
    freemium: 'Gratish',
    paid: 'Betalt'
  },

  // Intelligence cycle
  phase: {
    planning: 'Planlegging',
    collection: 'Innsamling',
    processing: 'Prosessering',
    analysis: 'Analyse',
    dissemination: 'Formidling'
  },

  // Badges
  badge: {
    terminal: 'T',
    registration: 'R',
    manual: 'M'
  },

  // Kategorier (slug -> norsk)
  category: {
    'social-media': 'Sosiale medier',
    'search-engines': 'Søkemotorer',
    'username': 'Brukernavn',
    'email': 'E-post',
    'domain': 'Domene',
    'ip-address': 'IP-adresse',
    'image-video': 'Bilde og video',
    'maps-satellites': 'Kart og satellitt',
    'transportation': 'Transport',
    'companies-finance': 'Selskaper og finans',
    'archiving': 'Arkivering',
    'public-records': 'Offentlige registre',
    'phone': 'Telefon',
    'metadata-documents': 'Metadata',
    'dark-web': 'Mørkt nett',
    'cybersecurity': 'Cybersikkerhet',
    'environment-nature': 'Miljø og natur',
    'people-search': 'Personsøk',
    'geolocation': 'Geolokalisering',
    'verification': 'Verifisering'
  },

  // UI-tekster
  ui: {
    search: 'Søk',
    searchPlaceholder: '',
    noResults: 'Ingen verktøy funnet',
    noResultsHint: 'Prøv andre søkeord eller fjern noen filtre',
    clear: 'Nullstill',
    showMore: 'Vis flere',
    showLess: 'Vis færre',
    tools: 'verktøy',
    tool: 'verktøy',
    footer: 'Sporjeger er en norsk OSINT-katalog.',
    loading: 'Laster...',
    offline: 'Du er frakoblet. Viser bufret data.',

    // Filter-grupper
    filterByCategory: 'Kategori',
    filterByType: 'Type',
    filterByPrice: 'Pris',
    filterByPhase: 'Fase',

    // Hints for søk
    hints: [
      'brukernavn',
      'verifisere bilde',
      'selskap norge',
      'arkiv',
      'gratis',
      'terminal',
      'sosiale medier'
    ]
  }
} as const

// Hjelpefunksjon for å oversette
export function translate<T extends keyof typeof t>(
  category: T,
  key: keyof (typeof t)[T]
): string {
  return (t[category] as Record<string, string>)[key as string] ?? key
}
