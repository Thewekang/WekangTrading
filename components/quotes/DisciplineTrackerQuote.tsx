/**
 * Discipline Tracker Contextual Quote
 * Pinned quote at top of discipline tracker page
 * Weighted based on user's trading performance
 */

'use client';

import { useEffect, useState } from 'react';
import { QuoteCard } from '@/components/quotes/QuoteCard';
import type { TradingQuote } from '@/lib/validations/quote';
import { TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react';

interface ContextualQuoteData {
  quote: TradingQuote;
  context: {
    category: string;
    recentMood: 'winning' | 'losing' | 'mixed' | 'new';
    lastThreeResults: ('WIN' | 'LOSS')[];
    weeklyWinRate: number;
    weeklyTotalTrades: number;
  };
}

function getMoodIcon(mood: 'winning' | 'losing' | 'mixed' | 'new') {
  switch (mood) {
    case 'winning':
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    case 'losing':
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    case 'mixed':
      return <Minus className="h-4 w-4 text-yellow-600" />;
    case 'new':
      return <Sparkles className="h-4 w-4 text-purple-600" />;
  }
}

function getMoodText(context: ContextualQuoteData['context']): string {
  if (context.recentMood === 'new' || context.weeklyTotalTrades === 0) {
    return 'Ready to start trading';
  }

  const moodDescriptions = {
    winning: 'On a winning streak',
    losing: 'Recovery mode',
    mixed: 'Mixed results',
    new: 'Getting started',
  };

  const parts = [moodDescriptions[context.recentMood]];

  if (context.lastThreeResults.length > 0) {
    const resultStr = context.lastThreeResults
      .map(r => r === 'WIN' ? 'W' : 'L')
      .join('-');
    parts.push(`Last 3: ${resultStr}`);
  }

  if (context.weeklyTotalTrades > 0) {
    parts.push(`Weekly: ${context.weeklyWinRate.toFixed(0)}% (${context.weeklyTotalTrades} trades)`);
  }

  return parts.join(' · ');
}

export function DisciplineTrackerQuote() {
  const [quoteData, setQuoteData] = useState<ContextualQuoteData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [language, setLanguage] = useState<'en' | 'bm'>('en');

  useEffect(() => {
    fetchContextualQuote();
  }, []);

  const fetchContextualQuote = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/quotes/contextual');
      const data = await response.json();

      if (data.success) {
        setQuoteData(data.data);
        // Random initial language
        setLanguage(Math.random() > 0.5 ? 'en' : 'bm');
      }
    } catch (error) {
      console.error('Failed to fetch contextual quote:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mb-6 p-6 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
        <div className="animate-pulse">
          <div className="h-4 bg-purple-200 dark:bg-purple-800 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-purple-200 dark:bg-purple-800 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!quoteData) {
    return null;
  }

  return (
    <div className="mb-6">
      {/* Context Info Badge */}
      <div className="mb-2 flex items-center gap-2 text-sm text-purple-700 dark:text-purple-300">
        {getMoodIcon(quoteData.context.recentMood)}
        <span className="font-medium">
          {getMoodText(quoteData.context)}
        </span>
      </div>

      {/* Quote Card (Inline Variant) */}
      <QuoteCard 
        quote={{
          id: quoteData.quote.id,
          text: language === 'en' ? quoteData.quote.textEn : quoteData.quote.textBm,
          language: language,
          category: quoteData.quote.category,
          author: quoteData.quote.author || 'Trading Wisdom',
          sourceType: quoteData.quote.sourceType || 'original',
        }}
        variant="inline"
        showCategoryBadge={true}
      />

      {/* Refresh Hint */}
      <p className="mt-2 text-xs text-muted-foreground text-center">
        Quote weighted to your last 3 trades and weekly performance · Refresh page for new quote
      </p>
    </div>
  );
}
