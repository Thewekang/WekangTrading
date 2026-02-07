'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';
import { useTimezone } from '@/contexts/TimezoneContext';

interface EconomicEvent {
  id: string;
  eventDate: string;
  country: string;
  currency: string;
  eventName: string;
  importance: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface GroupedEvents {
  [date: string]: EconomicEvent[];
}

export default function WeeklyEconomicNews() {
  const { formatDate } = useTimezone();
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWeeklyEvents();
  }, []);

  const fetchWeeklyEvents = async () => {
    try {
      const response = await fetch('/api/calendar?type=week');
      const data = await response.json();
      if (data.success) {
        setEvents(data.events);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupEventsByDate = (events: EconomicEvent[]): GroupedEvents => {
    return events.reduce((acc, event) => {
      // Format date only (no time) for grouping key
      const date = formatDate(new Date(event.eventDate), {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: undefined,
        minute: undefined,
        second: undefined,
        hour12: undefined,
      });
      if (!acc[date]) acc[date] = [];
      acc[date].push(event);
      return acc;
    }, {} as GroupedEvents);
  };

  const formatTime = (dateStr: string) => {
    return formatDate(new Date(dateStr), {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getCountryFlag = (countryCode: string) => {
    const flags: Record<string, string> = {
      USA: '🇺🇸',
      EUR: '🇪🇺',
      GBP: '🇬🇧',
      JPY: '🇯🇵',
      CHF: '🇨🇭',
      CAD: '🇨🇦',
      AUD: '🇦🇺',
      NZD: '🇳🇿',
    };
    return flags[countryCode] || '🏳️';
  };

  const groupedEvents = groupEventsByDate(events);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            This Week's Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          This Week's Events
        </CardTitle>
        <CardDescription>High-impact events for the next 7 days</CardDescription>
      </CardHeader>
      <CardContent className="max-h-[400px] overflow-y-auto">
        {events.length === 0 ? (
          <div className="py-4 text-center">
            <p className="text-sm text-muted-foreground">No high-impact events this week</p>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(groupedEvents).map(([date, dateEvents]) => (
              <div key={date} className="space-y-1.5">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {date}
                </h4>
                <div className="space-y-1.5">
                  {dateEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-2 p-1.5 border rounded hover:bg-muted/50 transition-colors"
                    >
                      <span className="text-base">{getCountryFlag(event.country)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs truncate leading-tight">{event.eventName}</p>
                        <p className="text-[10px] text-muted-foreground">{formatTime(event.eventDate)}</p>
                      </div>
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
                        HIGH
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
