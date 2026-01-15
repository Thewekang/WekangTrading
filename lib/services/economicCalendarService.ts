import { db } from '@/lib/db';
import { economicEvents, type NewEconomicEvent } from '@/lib/db/schema';
import { eq, gte, lte, and, desc } from 'drizzle-orm';

// RapidAPI configuration - Multilingual Economic Calendar API by TrueData
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';
const RAPIDAPI_HOST = 'multilingual-economic-calendar-api-by-truedata.p.rapidapi.com';

interface RapidAPIEvent {
  occurrence_id: number;
  event_id: number;
  short_name: string;
  long_name: string;
  occurrence_time: string; // ISO 8601 datetime
  country_id: number;
  country_name: string;
  country_flag: string;
  importance: string; // 'high', 'medium', 'low'
  currency: string;
  forecast?: number | string | null;
  actual?: number | string | null;
  previous?: number | string | null;
  reference_period?: string;
  category: string; // e.g., 'economic_activity', 'inflation', 'employment'
  source?: string;
  description?: string;
}

/**
 * Fetch economic events from RapidAPI Multilingual Economic Calendar
 * @param fromDate - Start date (default: today)
 * @param toDate - End date (default: 14 days from now)
 * @param countryId - Country ID (default: '5' for USA)
 * @returns Array of economic events
 */
export async function fetchEconomicEventsFromAPI(
  fromDate?: Date,
  toDate?: Date,
  countryId: string = '5' // USA country ID
): Promise<RapidAPIEvent[]> {
  if (!RAPIDAPI_KEY) {
    throw new Error('RAPIDAPI_KEY environment variable is not set');
  }

  const from = fromDate || new Date();
  const to = toDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days from now

  // Only fetch HIGH importance events
  const url = `https://${RAPIDAPI_HOST}/economic-events/filter?date_from=${from.toISOString().split('T')[0]}&date_to=${to.toISOString().split('T')[0]}&country_id=${countryId}&importance=high&lang=en`;
  
  console.log('🌐 API Request URL:', url);
  console.log('📅 Date range:', from.toISOString().split('T')[0], 'to', to.toISOString().split('T')[0]);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-rapidapi-key': RAPIDAPI_KEY,
      'x-rapidapi-host': RAPIDAPI_HOST,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ API Error:', response.status, errorText);
    throw new Error(`RapidAPI request failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log('✅ API Response received');
  console.log('Response type:', typeof data);
  console.log('Is Array:', Array.isArray(data));
  
  if (typeof data === 'object' && !Array.isArray(data)) {
    console.log('Data keys:', Object.keys(data));
    // If response is wrapped in an object, try to find the array
    if (data.data && Array.isArray(data.data)) {
      console.log('Found data.data array with', data.data.length, 'events');
      return data.data;
    }
    if (data.events && Array.isArray(data.events)) {
      console.log('Found data.events array with', data.events.length, 'events');
      return data.events;
    }
  }
  
  return Array.isArray(data) ? data : [];
}

/**
 * Convert API importance to our importance levels
 */
function mapImportance(importance: string): 'HIGH' | 'MEDIUM' | 'LOW' {
  const imp = importance.toLowerCase();
  if (imp === 'high') return 'HIGH';
  if (imp === 'medium') return 'MEDIUM';
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
    
    console.log('📥 Received', events.length, 'events from API');

    // Filter to only HIGH importance events
    const filteredEvents = events.filter((event) => {
      const importance = mapImportance(event.importance);
      return importance === 'HIGH';
    });
    
    console.log('✅ Filtered HIGH importance events:', filteredEvents.length);

    const fetchedAt = new Date();

    // Prepare events for insertion
    const eventsToInsert: NewEconomicEvent[] = filteredEvents.map((event) => {
      // Use occurrence_time (ISO 8601 format with timezone)
      const eventDate = new Date(event.occurrence_time);
      
      // Country code from country_flag (already 3 chars: 'USA', 'EUR', etc.)
      const countryCode = event.country_flag.substring(0, 3).toUpperCase();
      const currencyCode = event.currency.substring(0, 3).toUpperCase();
      
      return {
        id: `${event.occurrence_id}`,
        eventDate,
        country: countryCode,
        currency: currencyCode,
        eventName: event.short_name,
        indicator: event.category,
        importance: mapImportance(event.importance),
        forecast: event.forecast !== null ? String(event.forecast) : null,
        actual: event.actual !== null ? String(event.actual) : null,
        previous: event.previous !== null ? String(event.previous) : null,
        period: event.reference_period || null,
        source: 'API' as const,
        fetchedAt,
      };
    });

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
