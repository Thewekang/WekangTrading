'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Calendar, Clock, TrendingUp, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

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
  source: string;
}

interface AlertStatus {
  type: 'safe' | 'warning' | 'danger';
  message: string;
  event?: EconomicEvent;
  minutesUntil?: number;
}

export default function CalendarPage() {
  const [upcomingEvents, setUpcomingEvents] = useState<EconomicEvent[]>([]);
  const [todayEvents, setTodayEvents] = useState<EconomicEvent[]>([]);
  const [alertStatus, setAlertStatus] = useState<AlertStatus>({ type: 'safe', message: '' });
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (todayEvents.length > 0) {
      calculateAlertStatus();
    }
  }, [todayEvents, currentTime]);

  const fetchEvents = async () => {
    try {
      const [upcomingRes, todayRes] = await Promise.all([
        fetch('/api/calendar?type=upcoming&days=7'),
        fetch('/api/calendar?type=today'),
      ]);

      const upcomingData = await upcomingRes.json();
      const todayData = await todayRes.json();

      if (upcomingData.success) {
        setUpcomingEvents(upcomingData.data.events);
      }

      if (todayData.success) {
        setTodayEvents(todayData.data.events);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAlertStatus = () => {
    const now = currentTime.getTime();

    // Check each today's event
    for (const event of todayEvents) {
      const eventTime = new Date(event.eventDate).getTime();
      const diffMs = eventTime - now;
      const diffMinutes = Math.floor(diffMs / 60000);

      // DANGER ZONE: 5 minutes before to 5 minutes after
      if (diffMinutes >= -5 && diffMinutes <= 5) {
        if (diffMinutes < 0) {
          setAlertStatus({
            type: 'danger',
            message: `🔴 ${event.eventName} released ${Math.abs(diffMinutes)} minute(s) ago! Wait before trading.`,
            event,
            minutesUntil: Math.abs(5 + diffMinutes),
          });
        } else {
          setAlertStatus({
            type: 'danger',
            message: `⚠️ CLOSE POSITIONS NOW! ${event.eventName} in ${diffMinutes} minute(s)!`,
            event,
            minutesUntil: diffMinutes,
          });
        }
        return;
      }

      // WARNING ZONE: 5-10 minutes before
      if (diffMinutes > 5 && diffMinutes <= 10) {
        setAlertStatus({
          type: 'warning',
          message: `⚡ Prepare to close! ${event.eventName} in ${diffMinutes} minutes`,
          event,
          minutesUntil: diffMinutes,
        });
        return;
      }
    }

    // Check if there are upcoming events today
    const upcomingToday = todayEvents.filter((event) => {
      const eventTime = new Date(event.eventDate).getTime();
      return eventTime > now;
    });

    if (upcomingToday.length > 0) {
      const nextEvent = upcomingToday[0];
      const eventTime = new Date(nextEvent.eventDate).getTime();
      const diffMinutes = Math.floor((eventTime - now) / 60000);

      setAlertStatus({
        type: 'safe',
        message: `✅ Safe to trade. Next event: ${nextEvent.eventName} in ${Math.floor(diffMinutes / 60)}h ${diffMinutes % 60}m`,
        event: nextEvent,
      });
    } else {
      setAlertStatus({
        type: 'safe',
        message: '✅ No more news today. Safe to trade!',
      });
    }
  };

  const getImportanceBadge = (importance: string) => {
    const variants = {
      HIGH: 'destructive',
      MEDIUM: 'default',
      LOW: 'secondary',
    } as const;

    return (
      <Badge variant={variants[importance as keyof typeof variants] || 'secondary'}>
        {importance}
      </Badge>
    );
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getCountdown = (eventDate: string) => {
    const now = currentTime.getTime();
    const eventTime = new Date(eventDate).getTime();
    const diffMs = eventTime - now;

    if (diffMs < 0) {
      return 'Released';
    }

    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading calendar...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Economic Calendar</h1>
        <p className="text-muted-foreground mt-2">
          Track major economic events and manage trading risk
        </p>
      </div>

      {/* Alert Status */}
      <Alert
        variant={alertStatus.type === 'danger' ? 'destructive' : 'default'}
        className={
          alertStatus.type === 'warning' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950' : ''
        }
      >
        {alertStatus.type === 'danger' && <AlertTriangle className="h-5 w-5" />}
        {alertStatus.type === 'warning' && <Clock className="h-5 w-5 text-yellow-600" />}
        {alertStatus.type === 'safe' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
        <AlertTitle className="font-bold text-lg">{alertStatus.message}</AlertTitle>
        {alertStatus.event && alertStatus.minutesUntil !== undefined && (
          <AlertDescription>
            <div className="mt-2 space-y-1">
              <p>Event: {alertStatus.event.eventName}</p>
              {alertStatus.event.forecast && <p>Forecast: {alertStatus.event.forecast}</p>}
              {alertStatus.event.previous && <p>Previous: {alertStatus.event.previous}</p>}
              {alertStatus.type === 'danger' && alertStatus.minutesUntil > 0 && (
                <p className="font-semibold">
                  ⏰ Countdown: {alertStatus.minutesUntil} minute(s)
                </p>
              )}
            </div>
          </AlertDescription>
        )}
      </Alert>

      {/* Today's Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Today&apos;s Events
          </CardTitle>
          <CardDescription>
            {todayEvents.length > 0
              ? `${todayEvents.length} event(s) scheduled today`
              : 'No events scheduled today'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todayEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Info className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No economic news today. Trade safely!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold">
                        {formatTime(event.eventDate)}
                      </span>
                      {getImportanceBadge(event.importance)}
                      <Badge variant="outline" className="text-xs">
                        {event.currency}
                      </Badge>
                    </div>
                    <p className="font-semibold">{event.eventName}</p>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      {event.forecast && (
                        <span>
                          <strong>Forecast:</strong> {event.forecast}
                        </span>
                      )}
                      {event.previous && (
                        <span>
                          <strong>Previous:</strong> {event.previous}
                        </span>
                      )}
                      {event.actual && (
                        <span className="text-green-600 dark:text-green-400">
                          <strong>Actual:</strong> {event.actual}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-lg font-bold">
                      {getCountdown(event.eventDate)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Week */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            This Week
          </CardTitle>
          <CardDescription>Next 7 days of economic events</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Info className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No upcoming events found. Admin should sync the calendar.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold">{formatDate(event.eventDate)}</span>
                      <span className="font-mono text-muted-foreground">
                        {formatTime(event.eventDate)}
                      </span>
                      {getImportanceBadge(event.importance)}
                      <Badge variant="outline" className="text-xs">
                        {event.currency}
                      </Badge>
                    </div>
                    <p className="font-medium">{event.eventName}</p>
                    {(event.forecast || event.previous) && (
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        {event.forecast && <span>Fcst: {event.forecast}</span>}
                        {event.previous && <span>Prev: {event.previous}</span>}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
