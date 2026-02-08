'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, TrendingUp, CheckCircle2 } from 'lucide-react';
import { useTimezone } from '@/contexts/TimezoneContext';

interface EconomicEvent {
  id: string;
  eventDate: string;
  country: string;
  currency: string;
  eventName: string;
  importance: 'HIGH' | 'MEDIUM' | 'LOW';
}

export default function TodayEconomicNews() {
  const { formatDate } = useTimezone();
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchTodayEvents();
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchTodayEvents = async () => {
    try {
      const response = await fetch('/api/calendar?type=today');
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

  const getCountdown = (eventDate: string) => {
    const now = currentTime.getTime();
    const event = new Date(eventDate).getTime();
    const diff = event - now;

    if (diff < 0) return 'Passed';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Today's Economic Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="p-3 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
          Today's Economic Events
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">High-impact events today - close positions before these</CardDescription>
      </CardHeader>
      <CardContent className="p-3 sm:p-6 pt-0">
        {events.length === 0 ? (
          <div className="py-6 sm:py-8 text-center space-y-2">
            <CheckCircle2 className="h-10 w-10 sm:h-12 sm:w-12 text-green-600 mx-auto" />
            <p className="text-base sm:text-lg font-semibold text-green-600">No news today</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Safe to trade! ✅</p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {events.map((event) => {
              const countdown = getCountdown(event.eventDate);
              const isPassed = countdown === 'Passed';

              return (
                <div
                  key={event.id}
                  className={`flex items-center justify-between p-2 sm:p-3 border rounded-lg ${
                    isPassed ? 'opacity-50 bg-muted' : 'bg-card'
                  }`}
                >
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <span className="text-xl sm:text-2xl flex-shrink-0">{getCountryFlag(event.country)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs sm:text-sm truncate">{event.eventName}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">{formatTime(event.eventDate)}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {isPassed ? (
                      <Badge variant="secondary" className="text-[10px] sm:text-xs">Passed</Badge>
                    ) : (
                      <div className="flex items-center gap-1 sm:gap-2">
                        <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                        <span className="text-xs sm:text-sm font-mono font-bold text-red-500">
                          {countdown}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
