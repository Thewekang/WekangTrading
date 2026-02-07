'use client';

import { useEffect, useState } from 'react';
import { QuoteOfTheDayCard } from './QuoteCard';
import { Loader2 } from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface Quote {
  id: string;
  text: string;
  language: 'en' | 'bm';
  category: string;
  author: string;
  sourceType: string;
}

// ============================================
// QUOTE OF THE DAY WIDGET
// ============================================

export function QuoteOfTheDayWidget() {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [date, setDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchQuoteOfTheDay() {
      try {
        const response = await fetch('/api/quotes/quote-of-the-day');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || 'Failed to fetch quote');
        }

        setQuote(data.data.quote);
        setDate(data.data.meta.date);
      } catch (err) {
        console.error('Failed to fetch quote of the day:', err);
        setError('Unable to load quote');
      } finally {
        setIsLoading(false);
      }
    }

    fetchQuoteOfTheDay();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 bg-white rounded-lg shadow">
        <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error || !quote) {
    return null; // Silent fail - don't show error to user
  }

  return <QuoteOfTheDayCard quote={quote} date={date} />;
}
