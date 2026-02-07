'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { QuoteCard } from '@/components/quotes/QuoteCard';
import type { QuoteCategory } from '@/lib/validations/quote';

// ============================================
// TYPES
// ============================================

interface Quote {
  id: string;
  text: string;
  language: 'en' | 'bm';
  category: QuoteCategory;
  author: string;
  sourceType: string;
}

interface QuoteMeta {
  remainingQuotes: number;
  language: 'en' | 'bm';
}

interface QuoteSystemContextType {
  showQuote: (category?: QuoteCategory) => Promise<void>;
  isLoading: boolean;
  lastQuote: Quote | null;
  quoteMeta: QuoteMeta | null;
}

const QuoteSystemContext = createContext<QuoteSystemContextType | null>(null);

// ============================================
// QUOTE SYSTEM PROVIDER
// ============================================

interface QuoteSystemProviderProps {
  children: React.ReactNode;
}

export function QuoteSystemProvider({ children }: QuoteSystemProviderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [lastQuote, setLastQuote] = useState<Quote | null>(null);
  const [quoteMeta, setQuoteMeta] = useState<QuoteMeta | null>(null);

  const showQuote = useCallback(async (category?: QuoteCategory) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/quotes/random', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error codes
        if (data.error?.code === 'COOLDOWN_ACTIVE') {
          // Silent fail - cooldown is normal behavior
          return;
        }

        if (data.error?.code === 'SESSION_LIMIT_REACHED') {
          // Silent fail - session limit reached
          return;
        }

        throw new Error(data.error?.message || 'Failed to fetch quote');
      }

      const { quote, meta } = data.data;
      
      setLastQuote(quote);
      setQuoteMeta(meta);

      // Show quote card as toast
      toast.custom(
        (t) => (
          <QuoteCard
            quote={quote}
            remainingQuotes={meta.remainingQuotes}
            onClose={() => toast.dismiss(t)}
          />
        ),
        {
          duration: 8000, // 8 seconds
          position: 'top-center',
        }
      );

    } catch (error) {
      console.error('Failed to show quote:', error);
      // Silent fail - don't disrupt user experience
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <QuoteSystemContext.Provider 
      value={{ 
        showQuote, 
        isLoading, 
        lastQuote, 
        quoteMeta 
      }}
    >
      {children}
    </QuoteSystemContext.Provider>
  );
}

// ============================================
// QUOTE SYSTEM HOOK
// ============================================

export function useQuoteSystem() {
  const context = useContext(QuoteSystemContext);
  
  if (!context) {
    throw new Error('useQuoteSystem must be used within QuoteSystemProvider');
  }
  
  return context;
}
