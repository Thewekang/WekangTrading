import { db } from '@/lib/db';
import { economicEvents, type NewEconomicEvent } from '@/lib/db/schema';
import { eq, gte, lte, and, desc } from 'drizzle-orm';

// RapidAPI configuration - Multilingual Economic Calendar API by TrueData
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';
const RAPIDAPI_HOST = 'multilingual-economic-calendar-api-by-truedata.p.rapidapi.com';

interface RapidAPIEvent {
  id?: string;
  event_id?: string;
  title: string;
  event_name?: string;
  date: string;
  event_date?: string;
  time?: string;
  country: string;
  country_name?: string;
  currency: string;
  indicator?: string;
  category?: string;
  importance: string; // 'high', 'medium', 'low'
  forecast?: string | number;
  actual?: string | number;
  previous?: string | number;
  period?: string;
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

  const url = `https://${RAPIDAPI_HOST}/economic-events/filter?date_from=${from.toISOString().split('T')[0]}&date_to=${to.toISOString().split('T')[0]}&country_id=${countryId}&importance=high,medium&lang=en`;
  
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
    
    // Write raw API response to file for debugging
    const fs = require('fs');
    const path = require('path');
    const debugFile = path.join(process.cwd(), 'debug-api-response.json');
    fs.writeFileSync(debugFile, JSON.stringify({
      totalEvents: events.length,
      firstEvent: events[0],
      firstEventKeys: events[0] ? Object.keys(events[0]) : [],
      sampleEvents: events.slice(0, 5)
    }, null, 2));
    console.log('🔍 DEBUG: API response written to debug-api-response.json');
    console.log('🔍 First event keys:', events[0] ? Object.keys(events[0]) : 'no events');
    
    // STOP HERE - Return early to save API quota
    return {
      success: true,
      imported: 0,
      error: 'DEBUG MODE: Response saved to debug-api-response.json. Check the file to see field names.'
    };

    // API already filters by high,medium so we just need to map the data
    const filteredEvents = events.filter((event) => {
      const importance = mapImportance(event.importance);
      console.log(`Event "${event.title || event.event_name}" - Importance: ${event.importance} -> Mapped: ${importance}`);
      return importance === 'HIGH' || importance === 'MEDIUM';
    });
    
    console.log('🔍 DEBUG: After filtering');
    console.log('Filtered events count:', filteredEvents.length);
    console.log('Filtered events:', filteredEvents.map(e => ({
      title: e.title || e.event_name,
      date: e.date || e.event_date,
      importance: mapImportance(e.importance)
    })));

    const fetchedAt = new Date();

    // Prepare events for insertion
    const eventsToInsert: NewEconomicEvent[] = filteredEvents.map((event) => {
      // Combine date and time if available
      const eventDateStr = event.date || event.event_date || '';
      const eventTimeStr = event.time || '';
      const fullDateStr = eventTimeStr ? `${eventDateStr}T${eventTimeStr}` : eventDateStr;
      
      // Ensure country and currency are max 3 characters
      const countryCode = (event.country_name || event.country || 'US').substring(0, 3).toUpperCase();
      const currencyCode = (event.currency || 'USD').substring(0, 3).toUpperCase();
      
      const mappedEvent = {
        id: event.id || event.event_id || `${eventDateStr}-${event.title || event.event_name}`,
        eventDate: new Date(fullDateStr),
        country: countryCode,
        currency: currencyCode,
        eventName: event.title || event.event_name || 'Unknown Event',
        indicator: event.indicator || event.category || null,
        importance: mapImportance(event.importance),
        forecast: event.forecast?.toString() || null,
        actual: event.actual?.toString() || null,
        previous: event.previous?.toString() || null,
        period: event.period || null,
        source: 'API' as const,
        fetchedAt,
      };
      
      console.log('🔍 DEBUG: Mapped event for insertion:', JSON.stringify(mappedEvent, null, 2));
      return mappedEvent;
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
