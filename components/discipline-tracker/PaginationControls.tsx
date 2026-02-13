'use client';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Calendar, List, CalendarRange } from 'lucide-react';
import type { PaginationMode } from '@/lib/hooks/usePagination';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  mode: PaginationMode;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  onPageChange: (page: number) => void;
  onNextPage: () => void;
  onPreviousPage: () => void;
  onModeChange: (mode: PaginationMode) => void;
  onItemsPerPageChange: (count: number) => void;
}

export function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  mode,
  itemsPerPage,
  hasNextPage,
  hasPreviousPage,
  onPageChange,
  onNextPage,
  onPreviousPage,
  onModeChange,
  onItemsPerPageChange,
}: PaginationControlsProps) {
  const getPageLabel = () => {
    if (mode === 'weekly') return 'Week';
    if (mode === 'monthly') return 'Month';
    return 'Page';
  };

  const getModeIcon = (m: PaginationMode) => {
    if (m === 'weekly') return <CalendarRange className="h-4 w-4" />;
    if (m === 'monthly') return <Calendar className="h-4 w-4" />;
    return <List className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4">
      {/* Mode and Items Per Page Selection */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Pagination Mode */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-sm text-muted-foreground whitespace-nowrap">View by:</span>
          <Select value={mode} onValueChange={(value) => onModeChange(value as PaginationMode)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <div className="flex items-center gap-2">
                {getModeIcon(mode)}
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="per-page">
                <div className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  Per Page
                </div>
              </SelectItem>
              <SelectItem value="weekly">
                <div className="flex items-center gap-2">
                  <CalendarRange className="h-4 w-4" />
                  Weekly
                </div>
              </SelectItem>
              <SelectItem value="monthly">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Monthly
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Items Per Page (only for per-page mode) */}
        {mode === 'per-page' && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Rows per page:</span>
            <Select value={itemsPerPage.toString()} onValueChange={(value) => onItemsPerPageChange(Number(value))}>
              <SelectTrigger className="w-full sm:w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Total Items Info */}
        <div className="text-sm text-muted-foreground hidden sm:block">
          Total: {totalItems} {totalItems === 1 ? 'item' : 'items'}
        </div>
      </div>

      {/* Pagination Navigation */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Page Info */}
          <div className="text-sm text-muted-foreground order-2 sm:order-1">
            {getPageLabel()} {currentPage} of {totalPages}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-2 order-1 sm:order-2">
            {/* First Page (desktop only) */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(1)}
              disabled={!hasPreviousPage}
              className="hidden sm:flex"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>

            {/* Previous Page */}
            <Button
              variant="outline"
              size="sm"
              onClick={onPreviousPage}
              disabled={!hasPreviousPage}
              className="flex-1 sm:flex-none"
            >
              <ChevronLeft className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Previous</span>
            </Button>

            {/* Page Numbers (desktop only) */}
            <div className="hidden md:flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onPageChange(pageNum)}
                    className="w-10"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            {/* Next Page */}
            <Button
              variant="outline"
              size="sm"
              onClick={onNextPage}
              disabled={!hasNextPage}
              className="flex-1 sm:flex-none"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4 sm:ml-2" />
            </Button>

            {/* Last Page (desktop only) */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(totalPages)}
              disabled={!hasNextPage}
              className="hidden sm:flex"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Mobile: Total Items Info */}
          <div className="text-sm text-muted-foreground sm:hidden order-3">
            Total: {totalItems}
          </div>
        </div>
      )}
    </div>
  );
}
