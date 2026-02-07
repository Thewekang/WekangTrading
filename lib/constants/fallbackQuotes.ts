/**
 * Fallback Quotes
 * Used when database has no quotes yet
 */

export const FALLBACK_QUOTES = [
  {
    id: 'fallback-001',
    enabled: true,
    category: 'discipline' as const,
    weight: 10,
    textEn: 'Discipline is the bridge between goals and accomplishment.',
    textBm: 'Disiplin adalah jambatan antara matlamat dan pencapaian.',
    author: 'Jim Rohn',
    sourceType: 'original',
    displayCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'fallback-002',
    enabled: true,
    category: 'loss' as const,
    weight: 10,
    textEn: 'The most important rule of trading is to play great defense, not great offense.',
    textBm: 'Peraturan terpenting dalam trading adalah untuk bermain pertahanan yang hebat, bukan serangan yang hebat.',
    author: 'Paul Tudor Jones',
    sourceType: 'original',
    displayCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'fallback-003',
    enabled: true,
    category: 'general' as const,
    weight: 10,
    textEn: 'In trading, the hard part is not the technical analysis—it\'s the emotional discipline.',
    textBm: 'Dalam trading, bahagian yang sukar bukanlah analisis teknikal—tetapi disiplin emosi.',
    author: 'Trading Discipline Reminder',
    sourceType: 'original',
    displayCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'fallback-004',
    enabled: true,
    category: 'patience' as const,
    weight: 10,
    textEn: 'Patience is bitter, but its fruit is sweet.',
    textBm: 'Kesabaran itu pahit, tetapi buahnya manis.',
    author: 'Aristotle',
    sourceType: 'original',
    displayCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'fallback-005',
    enabled: true,
    category: 'risk' as const,
    weight: 10,
    textEn: 'Risk comes from not knowing what you\'re doing.',
    textBm: 'Risiko datang daripada tidak mengetahui apa yang anda lakukan.',
    author: 'Warren Buffett',
    sourceType: 'original',
    displayCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
] as const;

/**
 * Get a fallback quote (for when database is empty)
 */
export function getFallbackQuote(category?: string) {
  if (category) {
    const filtered = FALLBACK_QUOTES.filter(q => q.category === category);
    if (filtered.length > 0) {
      return filtered[0];
    }
  }
  return FALLBACK_QUOTES[0];
}

/**
 * Get fallback quote of the day (deterministic based on date)
 */
export function getFallbackQuoteOfTheDay() {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const index = seed % FALLBACK_QUOTES.length;
  return FALLBACK_QUOTES[index];
}
