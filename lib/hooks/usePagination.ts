import { useState, useEffect, useMemo } from 'react';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';

export type PaginationMode = 'per-page' | 'weekly' | 'monthly';

interface PaginationSettings {
  mode: PaginationMode;
  itemsPerPage: number;
}

interface UsePaginationOptions<T> {
  items: T[];
  storageKey?: string;
  defaultItemsPerPage?: number;
  getItemDate?: (item: T) => Date | string;
}

export function usePagination<T>({
  items,
  storageKey = 'pagination-settings',
  defaultItemsPerPage = 10,
  getItemDate,
}: UsePaginationOptions<T>) {
  // Load settings from localStorage
  const [settings, setSettings] = useState<PaginationSettings>(() => {
    if (typeof window === 'undefined') {
      return { mode: 'per-page' as PaginationMode, itemsPerPage: defaultItemsPerPage };
    }
    
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          mode: parsed.mode || 'per-page',
          itemsPerPage: parsed.itemsPerPage || defaultItemsPerPage,
        };
      }
    } catch (error) {
      console.error('Failed to load pagination settings:', error);
    }
    
    return { mode: 'per-page' as PaginationMode, itemsPerPage: defaultItemsPerPage };
  });

  const [currentPage, setCurrentPage] = useState(1);

  // Save settings to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify(settings));
      } catch (error) {
        console.error('Failed to save pagination settings:', error);
      }
    }
  }, [settings, storageKey]);

  // Calculate paginated data based on mode
  const paginatedData = useMemo(() => {
    if (settings.mode === 'per-page') {
      const startIndex = (currentPage - 1) * settings.itemsPerPage;
      const endIndex = startIndex + settings.itemsPerPage;
      return items.slice(startIndex, endIndex);
    }

    if (!getItemDate) {
      return items;
    }

    // Group items by week or month
    const now = new Date();
    const groups: T[][] = [];
    const processedItems = [...items].sort((a, b) => {
      const dateA = getItemDate(a);
      const dateB = getItemDate(b);
      const parsedA = typeof dateA === 'string' ? parseISO(dateA) : dateA;
      const parsedB = typeof dateB === 'string' ? parseISO(dateB) : dateB;
      return parsedB.getTime() - parsedA.getTime(); // Newest first
    });

    if (settings.mode === 'weekly') {
      // Group by weeks
      const weekGroups = new Map<string, T[]>();
      
      processedItems.forEach((item) => {
        const date = getItemDate(item);
        const parsedDate = typeof date === 'string' ? parseISO(date) : date;
        const weekStart = startOfWeek(parsedDate, { weekStartsOn: 1 }); // Monday
        const weekKey = weekStart.toISOString();
        
        if (!weekGroups.has(weekKey)) {
          weekGroups.set(weekKey, []);
        }
        weekGroups.get(weekKey)!.push(item);
      });

      // Convert to array and sort by week start date (newest first)
      const sortedWeeks = Array.from(weekGroups.entries())
        .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
      
      sortedWeeks.forEach(([_, items]) => groups.push(items));
    } else if (settings.mode === 'monthly') {
      // Group by months
      const monthGroups = new Map<string, T[]>();
      
      processedItems.forEach((item) => {
        const date = getItemDate(item);
        const parsedDate = typeof date === 'string' ? parseISO(date) : date;
        const monthStart = startOfMonth(parsedDate);
        const monthKey = `${monthStart.getFullYear()}-${monthStart.getMonth()}`;
        
        if (!monthGroups.has(monthKey)) {
          monthGroups.set(monthKey, []);
        }
        monthGroups.get(monthKey)!.push(item);
      });

      // Convert to array and sort by month (newest first)
      const sortedMonths = Array.from(monthGroups.entries())
        .sort((a, b) => {
          const [yearA, monthA] = a[0].split('-').map(Number);
          const [yearB, monthB] = b[0].split('-').map(Number);
          if (yearA !== yearB) return yearB - yearA;
          return monthB - monthA;
        });
      
      sortedMonths.forEach(([_, items]) => groups.push(items));
    }

    // Return the current page's group
    if (groups.length === 0) return [];
    const pageIndex = currentPage - 1;
    return groups[pageIndex] || [];
  }, [items, settings, currentPage, getItemDate]);

  // Calculate total pages
  const totalPages = useMemo(() => {
    if (settings.mode === 'per-page') {
      return Math.ceil(items.length / settings.itemsPerPage);
    }

    if (!getItemDate) {
      return 1;
    }

    // Count unique weeks or months
    const dates = items.map((item) => {
      const date = getItemDate(item);
      return typeof date === 'string' ? parseISO(date) : date;
    });

    if (settings.mode === 'weekly') {
      const weeks = new Set(
        dates.map((date) => startOfWeek(date, { weekStartsOn: 1 }).toISOString())
      );
      return weeks.size;
    } else if (settings.mode === 'monthly') {
      const months = new Set(
        dates.map((date) => `${date.getFullYear()}-${date.getMonth()}`)
      );
      return months.size;
    }

    return 1;
  }, [items, settings, getItemDate]);

  // Update mode
  const setMode = (mode: PaginationMode) => {
    setSettings((prev) => ({ ...prev, mode }));
    setCurrentPage(1); // Reset to first page
  };

  // Update items per page
  const setItemsPerPage = (count: number) => {
    setSettings((prev) => ({ ...prev, itemsPerPage: count }));
    setCurrentPage(1); // Reset to first page
  };

  // Navigation
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const previousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Reset to first page when total pages changes
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  return {
    // Data
    paginatedData,
    totalItems: items.length,
    totalPages,
    currentPage,

    // Settings
    mode: settings.mode,
    itemsPerPage: settings.itemsPerPage,

    // Actions
    setMode,
    setItemsPerPage,
    goToPage,
    nextPage,
    previousPage,

    // State
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
  };
}
