'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

export default function CalendarPage() {
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
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
      const date = new Date(event.eventDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      if (!acc[date]) acc[date] = [];
      acc[date].push(event);
      return acc;
    }, {} as GroupedEvents);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
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
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Economic Calendar</h1>
        <p className="text-muted-foreground mt-2">
          HIGH impact economic events - Close positions before these events
        </p>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No upcoming high-impact events</p>
            <p className="text-sm text-green-600 font-semibold mt-2">✅ Safe to trade</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedEvents).map(([date, dateEvents]) => (
            <Card key={date}>
              <CardHeader>
                <CardTitle className="text-xl">{date.toUpperCase()}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Time</TableHead>
                      <TableHead className="w-[60px]"></TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead className="w-[80px] text-center">Impact</TableHead>
                      <TableHead className="w-[100px] text-center">Actual</TableHead>
                      <TableHead className="w-[100px] text-center">Forecast</TableHead>
                      <TableHead className="w-[100px] text-center">Previous</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dateEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium">
                          {formatTime(event.eventDate)}
                        </TableCell>
                        <TableCell>
                          <span className="text-2xl">{getCountryFlag(event.country)}</span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{event.eventName}</p>
                            {event.period && (
                              <p className="text-xs text-muted-foreground">{event.period}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            {getImpactBar(event.importance)}
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-semibold">
                          {event.actual || '-'}
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {event.forecast || '-'}
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">
                          {event.previous || '-'}
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
