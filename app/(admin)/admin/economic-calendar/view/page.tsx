'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTimezone } from '@/contexts/TimezoneContext';
import { Settings, Calendar as CalendarIcon } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface EconomicEvent {
  id: string;
  eventDate: string;
  country: string;
  currency: string;
  eventName: string;
  indicator: string | null;
  importance: 'HIGH' | 'MEDIUM' | 'LOW';
  forecast: string | null;
  actual: string | null;
  previous: string | null;
  period: string | null;
}

interface GroupedEvents {
  [date: string]: EconomicEvent[];
}

export default function AdminCalendarViewPage() {
  const { formatDate } = useTimezone();
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/calendar?type=upcoming');
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
      const eventDate = new Date(event.eventDate);
      const dateKey = formatDate(eventDate, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: undefined,
        minute: undefined,
        second: undefined,
        hour12: undefined,
      });
      
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(event);
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

  const getImpactBar = (importance: string) => {
    if (importance === 'HIGH') {
      return (
        <div className="flex gap-0.5">
          <div className="w-1.5 h-6 bg-red-500"></div>
          <div className="w-1.5 h-6 bg-red-500"></div>
          <div className="w-1.5 h-6 bg-red-500"></div>
        </div>
      );
    }
    if (importance === 'MEDIUM') {
      return (
        <div className="flex gap-0.5">
          <div className="w-1.5 h-6 bg-yellow-500"></div>
          <div className="w-1.5 h-6 bg-yellow-500"></div>
          <div className="w-1.5 h-6 bg-gray-300"></div>
        </div>
      );
    }
    return (
      <div className="flex gap-0.5">
        <div className="w-1.5 h-6 bg-yellow-500"></div>
        <div className="w-1.5 h-6 bg-gray-300"></div>
        <div className="w-1.5 h-6 bg-gray-300"></div>
      </div>
    );
  };

  const groupedEvents = groupEventsByDate(events);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Economic Calendar View</h1>
          <p className="text-muted-foreground mt-2">
            Upcoming HIGH impact economic events
          </p>
        </div>
        <Button variant="outline" onClick={() => window.location.href = '/admin/economic-calendar'}>
          <Settings className="mr-2 h-4 w-4" />
          Cron Settings
        </Button>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-lg font-medium text-gray-900">No upcoming events</p>
            <p className="mt-2 text-sm text-gray-500">
              Run a sync from the Cron Settings page to import events
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedEvents).map(([date, dateEvents]) => (
            <Card key={date}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  {date}
                  <Badge variant="secondary">{dateEvents.length} events</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Impact</TableHead>
                      <TableHead className="w-24">Time</TableHead>
                      <TableHead className="w-20">Currency</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead className="w-24">Forecast</TableHead>
                      <TableHead className="w-24">Previous</TableHead>
                      <TableHead className="w-24">Actual</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dateEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>{getImpactBar(event.importance)}</TableCell>
                        <TableCell className="font-medium">
                          {formatTime(event.eventDate)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {getCountryFlag(event.country)}
                            <span className="text-xs font-medium">{event.currency}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{event.eventName}</p>
                            {event.period && (
                              <p className="text-xs text-muted-foreground">{event.period}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {event.forecast || '-'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {event.previous || '-'}
                        </TableCell>
                        <TableCell className="text-sm font-semibold">
                          {event.actual || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
