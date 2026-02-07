'use client';

import { X, Quote, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================
// TYPES
// ============================================

interface QuoteCardProps {
  quote: {
    id: string;
    text: string;
    language: 'en' | 'bm';
    category: string;
    author: string;
    sourceType: string;
  };
  remainingQuotes: number;
  onClose: () => void;
  variant?: 'toast' | 'inline'; // toast for post-trade, inline for dashboard
}

// ============================================
// QUOTE CARD COMPONENT
// ============================================

export function QuoteCard({ 
  quote, 
  remainingQuotes, 
  onClose,
  variant = 'toast'
}: QuoteCardProps) {
  
  const isToast = variant === 'toast';

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg shadow-lg",
        isToast 
          ? "w-[420px] max-w-[90vw]" 
          : "w-full"
      )}
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Quote className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white/90 text-xs font-medium uppercase tracking-wide">
                Trading Wisdom
              </p>
              <p className="text-white/70 text-[10px]">
                {quote.language === 'en' ? 'English' : 'Bahasa Melayu'}
              </p>
            </div>
          </div>

          {isToast && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          )}
        </div>

        {/* Quote Text */}
        <blockquote className="mb-4">
          <p className="text-white text-base font-medium leading-relaxed italic">
            "{quote.text}"
          </p>
        </blockquote>

        {/* Author */}
        <div className="flex items-center justify-between">
          <p className="text-white/80 text-sm">
            — {quote.author}
          </p>
          
          {/* Category Badge */}
          <div className="flex items-center space-x-2">
            <span className="px-2 py-1 bg-white/20 rounded-full text-white/90 text-[10px] font-medium uppercase tracking-wider backdrop-blur-sm">
              {quote.category}
            </span>
          </div>
        </div>

        {/* Footer Stats */}
        {isToast && (
          <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-white/70" />
              <span className="text-white/70 text-xs">
                {remainingQuotes} quotes remaining this session
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Animated gradient border */}
      <div 
        className="absolute inset-0 opacity-50"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
          animation: 'shimmer 3s infinite',
        }}
      />

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

// ============================================
// QUOTE OF THE DAY CARD (INLINE VARIANT)
// ============================================

interface QuoteOfTheDayCardProps {
  quote: {
    id: string;
    text: string;
    language: 'en' | 'bm';
    category: string;
    author: string;
    sourceType: string;
  };
  date: string; // YYYY-MM-DD
}

export function QuoteOfTheDayCard({ quote, date }: QuoteOfTheDayCardProps) {
  return (
    <div className="w-full">
      <div className="mb-2 flex items-center space-x-2">
        <Quote className="w-4 h-4 text-purple-600" />
        <h3 className="text-sm font-semibold text-gray-700">Quote of the Day</h3>
        <span className="text-xs text-gray-500">{date}</span>
      </div>
      
      <QuoteCard 
        quote={quote} 
        remainingQuotes={0} 
        onClose={() => {}} 
        variant="inline"
      />
    </div>
  );
}
