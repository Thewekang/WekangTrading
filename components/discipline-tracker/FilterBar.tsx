'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Calendar } from 'lucide-react';

interface FilterBarProps {
  onFilterChange: (filters: {
    month?: string;
    search?: string;
    sortBy?: string;
  }) => void;
}

export function FilterBar({ onFilterChange }: FilterBarProps) {
  const [search, setSearch] = useState('');
  const [month, setMonth] = useState<string>('');
  const [sortBy, setSortBy] = useState('date-desc');

  const handleSearchChange = (value: string) => {
    setSearch(value);
    onFilterChange({ month, search: value, sortBy });
  };

  const handleMonthChange = (value: string) => {
    setMonth(value);
    onFilterChange({ month: value || undefined, search, sortBy });
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
    onFilterChange({ month, search, sortBy: value });
  };

  const handleQuickFilter = (type: 'this-month' | 'last-month' | 'all-time') => {
    const now = new Date();
    let newMonth = '';

    if (type === 'this-month') {
      newMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    } else if (type === 'last-month') {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      newMonth = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
    }

    setMonth(newMonth);
    onFilterChange({ month: newMonth || undefined, search, sortBy });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      {/* Quick Filters */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickFilter('this-month')}
        >
          <Calendar className="h-4 w-4 mr-2" />
          This Month
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickFilter('last-month')}
        >
          Last Month
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickFilter('all-time')}
        >
          All Time
        </Button>
      </div>

      {/* Month Input */}
      <div className="flex-1 min-w-[200px]">
        <Input
          type="month"
          value={month}
          onChange={(e) => handleMonthChange(e.target.value)}
          placeholder="Select month"
        />
      </div>

      {/* Search */}
      <div className="flex-1 min-w-[200px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search notes..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Sort */}
      <Select value={sortBy} onValueChange={handleSortChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="date-desc">Date (Newest)</SelectItem>
          <SelectItem value="date-asc">Date (Oldest)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
