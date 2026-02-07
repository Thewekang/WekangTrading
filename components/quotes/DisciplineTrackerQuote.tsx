/**
 * Discipline Tracker Contextual Quote
 * Pinned quote at top of discipline tracker page
 * Weighted based on user's trading performance
 */

'use client';

import { useEffect, useState } from 'react';
import { QuoteCard } from '@/components/quotes/QuoteCard';
import type { TradingQuote } from '@/lib/validations/quote';
import { Sparkles } from 'lucide-react';

interface ContextualQuoteData {
  quote: TradingQuote;
  context: {
    category: string;
    recentWinRate: number;
    streak: string;
    totalRecentTrades: number;
  };
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
        <Sparkles className="h-4 w-4" />
        <span className="font-medium">
          {quoteData.context.totalRecentTrades > 0 ? (
            <>
              Based on your recent performance: {quoteData.context.recentWinRate.toFixed(0)}% win rate
              {quoteData.context.streak !== 'neutral' && (
                <> · Current streak: {quoteData.context.streak}</>
              )}
            </>
          ) : (
            'Start trading to get personalized quotes'
          )}
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
        Refresh the page to see a new quote weighted to your trading context
      </p>
    </div>
  );
}
