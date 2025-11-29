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
    'transport': 'Transport',
    'companies-finance': 'Selskaper og finans',
    'archiving': 'Arkivering',
    'public-records': 'Offentlige registre',
    'phone': 'Telefon',
    'metadata': 'Metadata',
    'dark-web': 'Det mørke nettet',
    'cybersecurity': 'Cybersikkerhet',
    'environment': 'Miljø og natur',
    'people': 'Personsøk',
    'geolocation': 'Geolokalisering',
    'verification': 'Verifisering'
  },

  // UI-tekster
  ui: {
    search: 'Sok',
    searchPlaceholder: '',
    noResults: 'Ingen verktoy funnet',
    noResultsHint: 'Prov andre sokeord eller fjern noen filtre',
    clear: 'Nullstill',
    showMore: 'Vis flere',
    showLess: 'Vis farre',
    tools: 'verktoy',
    tool: 'verktoy',
    footer: 'Sporjeger - OSINT-katalog for digital skattejakt',
    loading: 'Laster...',
    offline: 'Du er frakoblet. Viser bufret data.',
    refreshing: 'Oppdaterer...',
    refresh: 'Oppdater',
    refreshTitle: 'Tom cache og hent oppdatert data fra Supabase',

    // Filter-grupper
    filterByCategory: 'Kategori',
    filterByType: 'Type',
    filterByPrice: 'Pris',
    filterByPhase: 'Fase',

    // Hints for sok
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
