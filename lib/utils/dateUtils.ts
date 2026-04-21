/**
 * Get the local date string (YYYY-MM-DD) for a given timestamp in the specified timezone.
 */
export function getLocalDateStr(timestamp: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(timestamp);
}

/**
 * Get the UTC start and end boundaries for the trading day that contains `timestamp`
 * in the given IANA timezone.
 *
 * Uses a noon-UTC sampling trick to determine the UTC offset, which is DST-safe.
 */
export function getDayBoundariesInTimezone(
  timestamp: Date,
  timezone: string,
): { start: Date; end: Date; localDateStr: string } {
  // Get the local date string (YYYY-MM-DD) for this timestamp in the given timezone
  const localDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(timestamp);
  const [y, m, d] = localDateStr.split('-').map(Number);

  // Sample at noon UTC on that local date to determine the UTC offset (DST-safe)
  const noonUTC = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  }).formatToParts(noonUTC);

  const localHour = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '12', 10);
  const localMinute = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10);
  const localSecond = parseInt(parts.find((p) => p.type === 'second')?.value ?? '0', 10);

  // offsetMs = how far ahead/behind local is relative to UTC at noon
  // e.g. UTC+8: localHour=20 → offsetMs = (20-12)*3600000 = +8h
  // e.g. UTC-5: localHour=7  → offsetMs = (7-12)*3600000  = -5h
  const offsetMs =
    (localHour - 12) * 3_600_000 + localMinute * 60_000 + localSecond * 1_000;

  // Midnight UTC = noonUTC - 12h - offsetMs
  const start = new Date(noonUTC.getTime() - 12 * 3_600_000 - offsetMs);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1_000 - 1);

  return { start, end, localDateStr };
}
