'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import Link from 'next/link';

interface EconomicEvent {
  id: string;
  eventDate: string;
  eventName: string;
  importance: 'HIGH' | 'MEDIUM' | 'LOW';
  forecast: string | null;
  previous: string | null;
  actual: string | null;
  currency: string;
}

interface AlertStatus {
  type: 'safe' | 'warning' | 'danger-before' | 'danger-after';
  icon: React.ReactNode;
  message: string;
  bgColor: string;
}

export default function TodayNewsWidget() {
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [nextEvent, setNextEvent] = useState<EconomicEvent | null>(null);
  const [alertStatus, setAlertStatus] = useState<AlertStatus | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodayEvents();

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (events.length > 0) {
      calculateNextEventAndAlert();
    }
  }, [events, currentTime]);

  const fetchTodayEvents = async () => {
    try {
      const response = await fetch('/api/calendar?type=today');
      const data = await response.json();

      if (data.success) {
        setEvents(data.data.events);
      }
    } catch (error) {
      console.error('Error fetching today events:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateNextEventAndAlert = () => {
    const now = currentTime.getTime();

    // Find the next upcoming event or most recent past event
    let closestEvent: EconomicEvent | null = null;
    let closestDiff = Infinity;

    for (const event of events) {
      const eventTime = new Date(event.eventDate).getTime();
      const diffMs = eventTime - now;
      const diffMinutes = Math.floor(diffMs / 60000);

      // Check if this is the closest event to current time
      if (Math.abs(diffMs) < Math.abs(closestDiff)) {
        closestDiff = diffMs;
        closestEvent = event;
      }

      // DANGER ZONE: Within 5 minutes before or after
      if (diffMinutes >= -5 && diffMinutes <= 5) {
        if (diffMinutes < 0) {
          // After release
          setAlertStatus({
            type: 'danger-after',
            icon: <AlertTriangle className="h-4 w-4" />,
            message: `⚠️ DO NOT TRADE - ${event.eventName} just released!`,
            bgColor: 'bg-red-100 dark:bg-red-950 border-red-500',
          });
        } else {
          // Before release
          setAlertStatus({
            type: 'danger-before',
            icon: <AlertTriangle className="h-4 w-4" />,
            message: `🔴 CLOSE POSITIONS NOW! ${diffMinutes}m until ${event.eventName}`,
            bgColor: 'bg-red-100 dark:bg-red-950 border-red-500',
          });
        }
        setNextEvent(event);
        return;
      }

      // WARNING ZONE: 5-10 minutes before
      if (diffMinutes > 5 && diffMinutes <= 10) {
        setAlertStatus({
          type: 'warning',
          icon: <Clock className="h-4 w-4 text-yellow-600" />,
          message: `⚡ Prepare to close positions - ${diffMinutes}m until ${event.eventName}`,
          bgColor: 'bg-yellow-100 dark:bg-yellow-950 border-yellow-500',
        });
        setNextEvent(event);
        return;
      }
    }

    // SAFE ZONE: No immediate events
    const upcomingEvents = events.filter((event) => {
      const eventTime = new Date(event.eventDate).getTime();
      return eventTime > now + 600000; // More than 10 minutes away
    });

    if (upcomingEvents.length > 0) {
      const nextUpcoming = upcomingEvents[0];
      const eventTime = new Date(nextUpcoming.eventDate).getTime();
      const diffMinutes = Math.floor((eventTime - now) / 60000);

      setAlertStatus({
        type: 'safe',
        icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
        message: `✅ Safe to trade - Next: ${nextUpcoming.eventName} in ${Math.floor(diffMinutes / 60)}h ${diffMinutes % 60}m`,
        bgColor: 'bg-green-100 dark:bg-green-950 border-green-500',
      });
      setNextEvent(nextUpcoming);
    } else if (closestEvent) {
      // All events are in the past
      setAlertStatus({
        type: 'safe',
        icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
        message: '✅ No more news today - Safe to trade!',
        bgColor: 'bg-green-100 dark:bg-green-950 border-green-500',
      });
      setNextEvent(null);
    } else {
      setAlertStatus({
        type: 'safe',
        icon: <Info className="h-4 w-4" />,
        message: 'No economic news scheduled today',
        bgColor: 'bg-muted',
      });
      setNextEvent(null);
    }
  };

  const getCountdown = (eventDate: string) => {
    const now = currentTime.getTime();
    const eventTime = new Date(eventDate).getTime();
    const diffMs = eventTime - now;

    if (diffMs < 0) {
      const elapsed = Math.abs(diffMs);
      const minutes = Math.floor(elapsed / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      return `+${minutes}m ${seconds}s`;
    }

    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Today&apos;s Economic News
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading calendar...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Today&apos;s Economic News
          </span>
          <Link href="/calendar" className="text-sm text-primary hover:underline">
            View Calendar
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Alert Status */}
        {alertStatus && (
          <Alert className={alertStatus.bgColor}>
            {alertStatus.icon}
            <AlertDescription className="font-semibold">
              {alertStatus.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Next Event Countdown */}
        {nextEvent && (
          <div className="border rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold">
                    {formatTime(nextEvent.eventDate)}
                  </span>
                  <Badge
                    variant={
                      nextEvent.importance === 'HIGH'
                        ? 'destructive'
                        : nextEvent.importance === 'MEDIUM'
                          ? 'default'
                          : 'secondary'
                    }
                  >
                    {nextEvent.importance}
                  </Badge>
                </div>
                <p className="font-semibold">{nextEvent.eventName}</p>
                {(nextEvent.forecast || nextEvent.previous) && (
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    {nextEvent.forecast && <span>Fcst: {nextEvent.forecast}</span>}
                    {nextEvent.previous && <span>Prev: {nextEvent.previous}</span>}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold font-mono">
                  {getCountdown(nextEvent.eventDate)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(nextEvent.eventDate).getTime() > currentTime.getTime()
                    ? 'until release'
                    : 'since release'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* All Events Summary */}
        {events.length > 1 && (
          <div className="text-sm text-muted-foreground">
            <p>
              {events.length} event(s) today •{' '}
              {events.filter((e) => e.importance === 'HIGH').length} HIGH impact
            </p>
          </div>
        )}

        {/* No Events State */}
        {events.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No economic news today</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
