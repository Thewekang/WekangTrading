'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// ============================================
// ACTIVE ACCOUNT CONTEXT
// ============================================
// Tracks which trading account is currently selected.
// The selected account id is synced to/from a cookie so it survives page refreshes.
// Cookie name: active_account_id

const COOKIE_NAME = 'active_account_id';

interface TradingAccountSummary {
  id: string;
  name: string;
  accountType: string;
  currency: string;
  isDefault: boolean;
}

interface ActiveAccountContextType {
  activeAccountId: string | null;
  activeAccount: TradingAccountSummary | null;
  accounts: TradingAccountSummary[];
  setActiveAccount: (accountId: string) => void;
  refreshAccounts: () => Promise<void>;
  isLoading: boolean;
}

const ActiveAccountContext = createContext<ActiveAccountContextType | null>(null);

// ============================================
// COOKIE HELPERS (client-side only)
// ============================================

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, days = 365) {
  const expires = new Date();
  expires.setDate(expires.getDate() + days);
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

// ============================================
// PROVIDER
// ============================================

interface ActiveAccountProviderProps {
  children: React.ReactNode;
  /** Pre-fetched accounts list from server (optional) */
  initialAccounts?: TradingAccountSummary[];
}

export function ActiveAccountProvider({ children, initialAccounts = [] }: ActiveAccountProviderProps) {
  const [accounts, setAccounts] = useState<TradingAccountSummary[]>(initialAccounts);

  // Initialize from initialAccounts only — NOT from cookie — so the server and
  // client agree on the first render and hydration never mismatches.
  // The cookie is reconciled in a useEffect after hydration (client-only).
  const defaultAccount = initialAccounts.find((a) => a.isDefault) ?? initialAccounts[0];
  const [activeAccountId, setActiveAccountId] = useState<string | null>(defaultAccount?.id ?? null);

  const [isLoading, setIsLoading] = useState(initialAccounts.length === 0);

  // After hydration: read the cookie and apply it if it points to a valid account.
  // This runs client-side only, so it never causes a server/client mismatch.
  useEffect(() => {
    const fromCookie = getCookie(COOKIE_NAME);
    if (fromCookie) {
      // Only accept the cookie value if the account still exists
      setActiveAccountId((prev) => {
        const valid = accounts.find((a) => a.id === fromCookie);
        return valid ? fromCookie : prev;
      });
    } else if (defaultAccount?.id) {
      // No cookie yet — persist the default so subsequent loads use it
      setCookie(COOKIE_NAME, defaultAccount.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally runs once on mount only

  const refreshAccounts = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/trading-accounts');
      const json = await res.json();
      if (json.success) {
        const fetched: TradingAccountSummary[] = json.data;
        setAccounts(fetched);

        // If current active id is no longer valid, fall back to default
        setActiveAccountId((prev) => {
          if (prev && fetched.find((a) => a.id === prev)) return prev;
          const def = fetched.find((a) => a.isDefault) ?? fetched[0];
          const newId = def?.id ?? null;
          if (newId) setCookie(COOKIE_NAME, newId);
          return newId;
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch accounts on mount if not pre-loaded
  useEffect(() => {
    if (initialAccounts.length === 0) {
      refreshAccounts();
    }
  }, [initialAccounts.length, refreshAccounts]);

  const setActiveAccount = useCallback((accountId: string) => {
    setActiveAccountId(accountId);
    setCookie(COOKIE_NAME, accountId);
  }, []);

  const activeAccount = accounts.find((a) => a.id === activeAccountId) ?? null;

  return (
    <ActiveAccountContext.Provider value={{ activeAccountId, activeAccount, accounts, setActiveAccount, refreshAccounts, isLoading }}>
      {children}
    </ActiveAccountContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useActiveAccount() {
  const ctx = useContext(ActiveAccountContext);
  if (!ctx) throw new Error('useActiveAccount must be used within ActiveAccountProvider');
  return ctx;
}
