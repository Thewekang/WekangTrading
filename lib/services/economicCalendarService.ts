import { db } from '@/lib/db';
import { economicEvents, type NewEconomicEvent } from '@/lib/db/schema';
import { eq, gte, lte, and, desc } from 'drizzle-orm';

// RapidAPI configuration
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';
const RAPIDAPI_HOST = 'ultimate-economic-calendar.p.rapidapi.com';

interface RapidAPIEvent {
  id: string;
  title: string;
  date: string;
  country: string;
  currency: string;
  indicator?: string;
  importance: number; // -1 = HIGH, 0 = MEDIUM, 1+ = LOW
  forecast?: string | number;
  actual?: string | number;
  previous?: string | number;
  period?: string;
}

/**
 * Fetch economic events from RapidAPI Ultimate Economic Calendar
 * @param fromDate - Start date (default: today)
 * @param toDate - End date (default: 14 days from now)
 * @param country - Country filter (default: 'US')
 * @returns Array of economic events
 */
export async function fetchEconomicEventsFromAPI(
  fromDate?: Date,
  toDate?: Date,
  country: string = 'US'
): Promise<RapidAPIEvent[]> {
  if (!RAPIDAPI_KEY) {
    throw new Error('RAPIDAPI_KEY environment variable is not set');
  }

  const from = fromDate || new Date();
  const to = toDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days from now

  const url = `https://${RAPIDAPI_HOST}/economic-events?country=${country}&from=${from.toISOString().split('T')[0]}&to=${to.toISOString().split('T')[0]}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-rapidapi-key': RAPIDAPI_KEY,
      'x-rapidapi-host': RAPIDAPI_HOST,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`RapidAPI request failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

/**
 * Convert RapidAPI importance to our importance levels
 */
function mapImportance(importance: number): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (importance === -1) return 'HIGH';
  if (importance === 0) return 'MEDIUM';
  return 'LOW';
}

/**
 * Sync economic events from API to database
 */
export async function syncEconomicEventsFromAPI(): Promise<{
  success: boolean;
  imported: number;
  error?: string;
}> {
  try {
    const events = await fetchEconomicEventsFromAPI();

    // Filter only HIGH and MEDIUM importance events
    const filteredEvents = events.filter((event) => {
      const importance = mapImportance(event.importance);
      return importance === 'HIGH' || importance === 'MEDIUM';
    });

    const fetchedAt = new Date();

    // Prepare events for insertion
    const eventsToInsert: NewEconomicEvent[] = filteredEvents.map((event) => ({
      id: event.id,
      eventDate: new Date(event.date),
      country: event.country,
      currency: event.currency,
      eventName: event.title,
      indicator: event.indicator || null,
      importance: mapImportance(event.importance),
      forecast: event.forecast?.toString() || null,
      actual: event.actual?.toString() || null,
      previous: event.previous?.toString() || null,
      period: event.period || null,
      source: 'API',
      fetchedAt,
      createdAt: new Date(),
    }));

    // Clear existing future events from API source before inserting new ones
    await db
      .delete(economicEvents)
      .where(
        and(
          gte(economicEvents.eventDate, new Date()),
          eq(economicEvents.source, 'API')
        )
      );

    // Insert new events
    if (eventsToInsert.length > 0) {
      await db.insert(economicEvents).values(eventsToInsert);
    }

    return {
      success: true,
      imported: eventsToInsert.length,
    };
  } catch (error) {
    console.error('Error syncing economic events from API:', error);
    return {
      success: false,
      imported: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Import economic events from manual JSON upload
 */
export async function importEconomicEventsFromJSON(
  events: Array<{
    eventDate: string;
    eventTime?: string; // HH:mm:ss format
    eventName: string;
    country?: string;
    currency?: string;
    indicator?: string;
    importance: 'HIGH' | 'MEDIUM' | 'LOW';
    forecast?: string;
    previous?: string;
    period?: string;
  }>
): Promise<{
  success: boolean;
  imported: number;
  errors: string[];
}> {
  const errors: string[] = [];
  const eventsToInsert: NewEconomicEvent[] = [];

  for (let i = 0; i < events.length; i++) {
    try {
      const event = events[i];

      // Validate required fields
      if (!event.eventDate || !event.eventName || !event.importance) {
        errors.push(`Event ${i + 1}: Missing required fields (eventDate, eventName, importance)`);
        continue;
      }

      // Parse date and time
      let eventDateTime: Date;
      if (event.eventTime) {
        eventDateTime = new Date(`${event.eventDate}T${event.eventTime}Z`);
      } else {
        eventDateTime = new Date(event.eventDate);
      }

      if (isNaN(eventDateTime.getTime())) {
        errors.push(`Event ${i + 1}: Invalid date format`);
        continue;
      }

      // Generate unique ID
      const id = `manual_${eventDateTime.getTime()}_${event.eventName.replace(/\s+/g, '_')}`;

      eventsToInsert.push({
        id,
        eventDate: eventDateTime,
        country: event.country || 'US',
        currency: event.currency || 'USD',
        eventName: event.eventName,
        indicator: event.indicator || null,
        importance: event.importance,
        forecast: event.forecast || null,
        actual: null, // Will be updated later
        previous: event.previous || null,
        period: event.period || null,
        source: 'MANUAL',
        fetchedAt: null,
        createdAt: new Date(),
      });
    } catch (error) {
      errors.push(`Event ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  try {
    if (eventsToInsert.length > 0) {
      await db.insert(economicEvents).values(eventsToInsert);
    }

    return {
      success: true,
      imported: eventsToInsert.length,
      errors,
    };
  } catch (error) {
    return {
      success: false,
      imported: 0,
      errors: [...errors, error instanceof Error ? error.message : 'Database error'],
    };
  }
}

/**
 * Get upcoming economic events
 */
export async function getUpcomingEvents(days: number = 7) {
  const now = new Date();
  const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  return db
    .select()
    .from(economicEvents)
    .where(
      and(
        gte(economicEvents.eventDate, now),
        lte(economicEvents.eventDate, endDate)
      )
    )
    .orderBy(economicEvents.eventDate);
}

/**
 * Get today's economic events
 */
export async function getTodayEvents() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  return db
    .select()
    .from(economicEvents)
    .where(
      and(
        gte(economicEvents.eventDate, startOfDay),
        lte(economicEvents.eventDate, endOfDay)
      )
    )
    .orderBy(economicEvents.eventDate);
}

/**
 * Get last sync information
 */
export async function getLastSyncInfo() {
  const lastEvent = await db
    .select()
    .from(economicEvents)
    .where(eq(economicEvents.source, 'API'))
    .orderBy(desc(economicEvents.fetchedAt))
    .limit(1);

  return lastEvent[0]?.fetchedAt || null;
}

/**
 * Delete an event by ID (admin only)
 */
export async function deleteEvent(eventId: string) {
  await db.delete(economicEvents).where(eq(economicEvents.id, eventId));
}

/**
 * Update event actual value after release
 */
export async function updateEventActual(eventId: string, actualValue: string) {
  await db
    .update(economicEvents)
    .set({ actual: actualValue })
    .where(eq(economicEvents.id, eventId));
}
