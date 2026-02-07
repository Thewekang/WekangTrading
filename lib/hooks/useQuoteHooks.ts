/**
 * Quote System Hooks
 * Helper hooks for common quote operations
 */

import { useQuoteSystem } from '@/contexts/QuoteSystemContext';
import type { QuoteCategory } from '@/lib/validations/quote';

// ============================================
// POST-TRADE QUOTE HOOK
// ============================================

/**
 * Hook for showing post-trade motivational quotes
 * Usage: Call after successful trade entry
 */
export function usePostTradeQuote() {
  const { showQuote, isLoading } = useQuoteSystem();

  const showWinQuote = () => showQuote('WIN');
  const showLossQuote = () => showQuote('LOSS');
  const showDisciplineQuote = () => showQuote('DISCIPLINE');
  const showRandomQuote = () => showQuote(); // Any category

  return {
    showWinQuote,
    showLossQuote,
    showDisciplineQuote,
    showRandomQuote,
    isLoading,
  };
}

// ============================================
// CATEGORY-SPECIFIC HOOKS
// ============================================

/**
 * Hook for discipline-related quotes
 * Usage: After discipline tracker updates
 */
export function useDisciplineQuote() {
  const { showQuote, isLoading } = useQuoteSystem();

  const showDisciplineQuote = () => showQuote('DISCIPLINE');
  const showPatienceQuote = () => showQuote('PATIENCE');
  const showOvertradinQuote = () => showQuote('OVERTRADING');

  return {
    showDisciplineQuote,
    showPatienceQuote,
    showOvertradinQuote,
    isLoading,
  };
}

/**
 * Hook for risk management quotes
 * Usage: After high-risk trades or risk violations
 */
export function useRiskManagementQuote() {
  const { showQuote, isLoading } = useQuoteSystem();

  const showRiskQuote = () => showQuote('RISK');
  const showConfidenceQuote = () => showQuote('CONFIDENCE');

  return {
    showRiskQuote,
    showConfidenceQuote,
    isLoading,
  };
}
