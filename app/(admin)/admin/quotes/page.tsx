'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showToast } from '@/components/ui/Toast';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  TrendingUp,
  BarChart3,
  Quote as QuoteIcon,
  Search,
  Filter,
  Download,
  Upload
} from 'lucide-react';
import type { QuoteCategory } from '@/lib/validations/quote';

// ============================================
// TYPES
// ============================================

interface Quote {
  id: string;
  enabled: boolean;
  category: QuoteCategory;
  weight: number;
  textEn: string;
  textBm: string;
  author: string;
  sourceType: string;
  displayCount: number;
  createdAt: string;
  updatedAt: string;
}

interface QuoteStats {
  total: number;
  enabled: number;
  disabled: number;
  byCategory: Record<QuoteCategory, number>;
  mostShown: Array<{ id: string; textEn: string; displayCount: number }>;
}

type SortField = 'id' | 'category' | 'weight' | 'displayCount' | 'author';

// ============================================
// MAIN COMPONENT
// ============================================

export default function AdminQuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [stats, setStats] = useState<QuoteStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<QuoteCategory | 'ALL'>('ALL');
  const [filterEnabled, setFilterEnabled] = useState<boolean | 'ALL'>('ALL');
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [showDeleteSelectedDialog, setShowDeleteSelectedDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showResetStatsDialog, setShowResetStatsDialog] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [selectedQuotes, setSelectedQuotes] = useState<string[]>([]);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    id: '',
    enabled: true,
    category: 'general' as QuoteCategory,
    weight: 5,
    textEn: '',
    textBm: '',
    author: '',
    sourceType: 'original',
  });

  useEffect(() => {
    fetchQuotes();
    fetchStats();
  }, []);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/quotes');
      const result = await response.json();

      if (result.success && result.data?.quotes) {
        setQuotes(result.data.quotes);
      }
    } catch (error) {
      console.error('Error fetching quotes:', error);
      showToast('Failed to load quotes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/quotes?stats=true');
      const result = await response.json();

      if (result.success && result.data) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedQuotes = quotes
    .filter(quote => {
      const matchesSearch = 
        quote.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.textEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.textBm.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.author.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = filterCategory === 'ALL' || quote.category === filterCategory;
      const matchesEnabled = filterEnabled === 'ALL' || quote.enabled === filterEnabled;

      return matchesSearch && matchesCategory && matchesEnabled;
    })
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to create quote');
      }

      showToast('Quote created successfully', 'success');
      setShowCreateModal(false);
      resetForm();
      fetchQuotes();
      fetchStats();
    } catch (error: any) {
      showToast(error.message || 'Failed to create quote', 'error');
    }
  };

  const handleEditQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuote) return;

    try {
      const response = await fetch(`/api/quotes/${selectedQuote.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to update quote');
      }

      showToast('Quote updated successfully', 'success');
      setShowEditModal(false);
      setSelectedQuote(null);
      fetchQuotes();
      fetchStats();
    } catch (error: any) {
      showToast(error.message || 'Failed to update quote', 'error');
    }
  };

  const handleDeleteQuote = async () => {
    if (!selectedQuote) return;

    try {
      const response = await fetch(`/api/quotes/${selectedQuote.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to delete quote');
      }

      showToast('Quote deleted successfully', 'success');
      setShowDeleteModal(false);
      setSelectedQuote(null);
      fetchQuotes();
      fetchStats();
    } catch (error: any) {
      showToast(error.message || 'Failed to delete quote', 'error');
    }
  };

  const handleDeleteAll = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/quotes', {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to delete quotes');
      }

      // Refresh data before closing dialog
      await fetchQuotes();
      await fetchStats();

      showToast(result.message || 'All quotes deleted successfully', 'success');
      setShowDeleteAllDialog(false);
    } catch (error: any) {
      showToast(error.message || 'Failed to delete quotes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedQuotes.length === 0) return;

    try {
      setLoading(true);
      let successCount = 0;
      let errorCount = 0;

      // Delete each selected quote
      for (const quoteId of selectedQuotes) {
        try {
          const response = await fetch(`/api/quotes/${quoteId}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch {
          errorCount++;
        }
      }

      // Refresh data before closing dialog
      await fetchQuotes();
      await fetchStats();

      if (errorCount === 0) {
        showToast(`Successfully deleted ${successCount} quote${successCount > 1 ? 's' : ''}`, 'success');
      } else {
        showToast(`Deleted ${successCount} quote${successCount > 1 ? 's' : ''}, ${errorCount} failed`, 'error');
      }

      setShowDeleteSelectedDialog(false);
      setSelectedQuotes([]);
    } catch (error: any) {
      showToast(error.message || 'Failed to delete quotes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedQuotes.length === filteredAndSortedQuotes.length) {
      setSelectedQuotes([]);
    } else {
      setSelectedQuotes(filteredAndSortedQuotes.map(q => q.id));
    }
  };

  const handleSelectQuote = (quoteId: string) => {
    setSelectedQuotes(prev => 
      prev.includes(quoteId) 
        ? prev.filter(id => id !== quoteId)
        : [...prev, quoteId]
    );
  };

  const handleDownloadTemplate = () => {
    const template = [
      {
        enabled: true,
        category: "discipline",
        weight: 8,
        textEn: "Your motivational quote in English",
        textBm: "Petikan motivasi anda dalam Bahasa Malaysia",
        author: "Author Name",
        sourceType: "original"
      },
      {
        enabled: true,
        category: "loss",
        weight: 7,
        textEn: "Another quote in English",
        textBm: "Satu lagi petikan dalam Bahasa Malaysia",
        author: "Another Author",
        sourceType: "book"
      }
    ];

    const dataStr = JSON.stringify(template, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'quotes-template.json';
    link.click();
    URL.revokeObjectURL(url);
    showToast('Template downloaded successfully', 'success');
  };

  const handleDownloadAllQuotes = () => {
    if (quotes.length === 0) {
      showToast('No quotes to download', 'error');
      return;
    }

    // Format quotes for export (remove ID, createdAt, updatedAt - IDs will be auto-generated on upload)
    const exportQuotes = quotes.map(q => ({
      enabled: q.enabled,
      category: q.category,
      weight: q.weight,
      textEn: q.textEn,
      textBm: q.textBm,
      author: q.author,
      sourceType: q.sourceType
    }));

    const dataStr = JSON.stringify(exportQuotes, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().toISOString().split('T')[0];
    link.download = `quotes-backup-${timestamp}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${quotes.length} quotes`, 'success');
  };

  const handleUploadJSON = async () => {
    if (!uploadFile) {
      showToast('Please select a JSON file', 'error');
      return;
    }

    try {
      setLoading(true);
      const fileContent = await uploadFile.text();
      const quotes = JSON.parse(fileContent);

      if (!Array.isArray(quotes)) {
        throw new Error('JSON file must contain an array of quotes');
      }

      const response = await fetch('/api/quotes/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quotes }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to upload quotes');
      }

      // Refresh data before closing dialog
      await fetchQuotes();
      await fetchStats();

      showToast(result.message || 'Quotes uploaded successfully', 'success');
      setShowUploadDialog(false);
      setUploadFile(null);
    } catch (error: any) {
      showToast(error.message || 'Failed to upload quotes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEnabled = async (quote: Quote) => {
    try {
      const response = await fetch(`/api/quotes/${quote.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !quote.enabled }),
      });

      if (!response.ok) throw new Error('Failed to toggle quote');

      showToast(`Quote ${!quote.enabled ? 'enabled' : 'disabled'}`, 'success');
      fetchQuotes();
      fetchStats();
    } catch (error) {
      showToast('Failed to update quote', 'error');
    }
  };

  const handleResetStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/quotes/reset-stats', {
        method: 'POST',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to reset statistics');
      }

      showToast('Quote statistics have been reset', 'success');
      await fetchQuotes();
      await fetchStats();
      setShowResetStatsDialog(false);
    } catch (error: any) {
      showToast(error.message || 'Failed to reset statistics', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (quote: Quote) => {
    setSelectedQuote(quote);
    setFormData({
      id: quote.id,
      enabled: quote.enabled,
      category: quote.category,
      weight: quote.weight,
      textEn: quote.textEn,
      textBm: quote.textBm,
      author: quote.author,
      sourceType: quote.sourceType,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (quote: Quote) => {
    setSelectedQuote(quote);
    setShowDeleteModal(true);
  };

  const resetForm = () => {
    setFormData({
      id: '',
      enabled: true,
      category: 'general',
      weight: 5,
      textEn: '',
      textBm: '',
      author: '',
      sourceType: 'original',
    });
  };

  const categories: QuoteCategory[] = [
    'discipline', 'loss', 'win', 'patience', 'confidence', 
    'overtrading', 'risk', 'mental', 'general'
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quote Management</h1>
        <p className="text-gray-600">Manage motivational trading quotes across 9 categories: discipline, loss, win, patience, confidence, overtrading, risk, mental, general</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Quotes</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <QuoteIcon className="w-8 h-8 text-purple-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Enabled</p>
                <p className="text-2xl font-bold text-green-600">{stats.enabled}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Disabled</p>
                <p className="text-2xl font-bold text-gray-400">{stats.disabled}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-gray-400" />
            </div>
          </Card>
          <Card className="p-4">
            <button
              onClick={() => setShowStatsModal(true)}
              className="w-full text-left hover:bg-gray-50 rounded transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">View Stats</p>
                  <p className="text-sm font-medium text-purple-600">Click to view</p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-600" />
              </div>
            </button>
          </Card>
        </div>
      )}

      {/* Actions Bar */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex-1 w-full md:max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder="Search quotes (ID, text, author)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => setShowCreateModal(true)} className="bg-purple-600 hover:bg-purple-700">
              <Plus size={16} className="mr-2" />
              Add Quote
            </Button>
            <Button onClick={handleDownloadTemplate} variant="outline">
              <Download size={16} className="mr-2" />
              Download Template
            </Button>
            <Button onClick={handleDownloadAllQuotes} variant="outline" className="border-green-300 text-green-700 hover:bg-green-50">
              <Download size={16} className="mr-2" />
              Download All Quotes
            </Button>
            <Button onClick={() => setShowUploadDialog(true)} variant="outline">
              <Upload size={16} className="mr-2" />
              Upload JSON
            </Button>
            <Button onClick={() => setShowDeleteAllDialog(true)} variant="outline" className="text-red-600 hover:bg-red-50 border-red-300">
              <Trash2 size={16} className="mr-2" />
              Delete All
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-600" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as QuoteCategory | 'ALL')}
              className="px-3 py-2 border rounded-md text-sm"
              title="Filter by category (9 total categories)"
            >
              <option value="ALL">All Categories (9)</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={String(filterEnabled)}
              onChange={(e) => setFilterEnabled(e.target.value === 'ALL' ? 'ALL' : e.target.value === 'true')}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="ALL">All Status</option>
              <option value="true">Enabled Only</option>
              <option value="false">Disabled Only</option>
            </select>
          </div>
          <div className="text-sm text-gray-600 flex items-center">
            Showing {filteredAndSortedQuotes.length} of {quotes.length} quotes
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedQuotes.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md flex items-center justify-between">
            <span className="text-sm text-blue-800 font-medium">
              {selectedQuotes.length} quote{selectedQuotes.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <Button 
                onClick={() => setSelectedQuotes([])}
                variant="outline"
                size="sm"
              >
                Clear Selection
              </Button>
              <Button 
                onClick={() => setShowDeleteSelectedDialog(true)}
                variant="outline"
                size="sm"
                className="text-red-600 hover:bg-red-50 border-red-300"
              >
                <Trash2 size={16} className="mr-2" />
                Delete Selected
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Quotes Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-600">Loading quotes...</div>
        ) : filteredAndSortedQuotes.length === 0 ? (
          <div className="p-8 text-center text-gray-600">No quotes found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-center p-4 font-semibold text-sm text-gray-700 w-12">
                    <input
                      type="checkbox"
                      checked={selectedQuotes.length === filteredAndSortedQuotes.length && filteredAndSortedQuotes.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 cursor-pointer"
                      title="Select all"
                    />
                  </th>
                  <th className="text-left p-4 font-semibold text-sm text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('id')}>
                    ID {sortField === 'id' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left p-4 font-semibold text-sm text-gray-700">Quote (EN)</th>
                  <th className="text-left p-4 font-semibold text-sm text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('category')}>
                    Category {sortField === 'category' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left p-4 font-semibold text-sm text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('author')}>
                    Author {sortField === 'author' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-center p-4 font-semibold text-sm text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('weight')}>
                    Weight {sortField === 'weight' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-center p-4 font-semibold text-sm text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('displayCount')}>
                    Shown {sortField === 'displayCount' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-center p-4 font-semibold text-sm text-gray-700">Status</th>
                  <th className="text-center p-4 font-semibold text-sm text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedQuotes.map((quote) => (
                  <tr key={quote.id} className="border-b hover:bg-gray-50">
                    <td className="text-center p-4">
                      <input
                        type="checkbox"
                        checked={selectedQuotes.includes(quote.id)}
                        onChange={() => handleSelectQuote(quote.id)}
                        className="w-4 h-4 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="p-4 font-mono text-sm">{quote.id}</td>
                    <td className="p-4 max-w-md">
                      <p className="text-sm line-clamp-2">{quote.textEn}</p>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                        {quote.category}
                      </span>
                    </td>
                    <td className="p-4 text-sm">{quote.author}</td>
                    <td className="text-center p-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        quote.weight >= 8 ? 'bg-green-100 text-green-800' :
                        quote.weight >= 5 ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {quote.weight}
                      </span>
                    </td>
                    <td className="text-center p-4 text-sm">{quote.displayCount}</td>
                    <td className="text-center p-4">
                      <Switch
                        checked={quote.enabled}
                        onCheckedChange={() => handleToggleEnabled(quote)}
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2 justify-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditModal(quote)}
                        >
                          <Edit2 size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDeleteModal(quote)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleCreateQuote} className="p-6">
              <h2 className="text-2xl font-bold mb-4">Create New Quote</h2>
              
              <div className="space-y-4">
                <div>
                  <Label>Quote ID (format: q-XXX)</Label>
                  <Input
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    placeholder="q-001"
                    required
                    pattern="q-\d{3}"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Category <span className="text-gray-500 text-xs">(9 categories)</span></Label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as QuoteCategory })}
                      className="w-full px-3 py-2 border rounded-md"
                      title="Choose from 9 quote categories"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Weight (1-10)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label>Quote Text (English)</Label>
                  <textarea
                    value={formData.textEn}
                    onChange={(e) => setFormData({ ...formData, textEn: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <Label>Quote Text (Bahasa Melayu)</Label>
                  <textarea
                    value={formData.textBm}
                    onChange={(e) => setFormData({ ...formData, textBm: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <Label>Author</Label>
                  <Input
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label>Source Type</Label>
                  <select
                    value={formData.sourceType}
                    onChange={(e) => setFormData({ ...formData, sourceType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="original">Original</option>
                    <option value="publicFigure">Public Figure</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                  />
                  <Label>Enabled</Label>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                  Create Quote
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedQuote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleEditQuote} className="p-6">
              <h2 className="text-2xl font-bold mb-4">Edit Quote: {selectedQuote.id}</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Category <span className="text-gray-500 text-xs">(9 categories)</span></Label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as QuoteCategory })}
                      className="w-full px-3 py-2 border rounded-md"
                      title="Choose from 9 quote categories"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Weight (1-10)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label>Quote Text (English)</Label>
                  <textarea
                    value={formData.textEn}
                    onChange={(e) => setFormData({ ...formData, textEn: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <Label>Quote Text (Bahasa Melayu)</Label>
                  <textarea
                    value={formData.textBm}
                    onChange={(e) => setFormData({ ...formData, textBm: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <Label>Author</Label>
                  <Input
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label>Source Type</Label>
                  <select
                    value={formData.sourceType}
                    onChange={(e) => setFormData({ ...formData, sourceType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="original">Original</option>
                    <option value="publicFigure">Public Figure</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                  />
                  <Label>Enabled</Label>
                </div>

                <div className="text-sm text-gray-600">
                  <p>Display Count: {selectedQuote.displayCount}</p>
                  <p>Last Updated: {new Date(selectedQuote.updatedAt).toLocaleString()}</p>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                  Update Quote
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedQuote(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedQuote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-2xl font-bold mb-4 text-red-600">Delete Quote</h2>
            <p className="mb-4 text-gray-700">
              Are you sure you want to delete quote <strong>{selectedQuote.id}</strong>?
            </p>
            <p className="mb-4 text-sm text-gray-600 italic">"{selectedQuote.textEn}"</p>
            <p className="mb-6 text-sm text-gray-600">This action cannot be undone.</p>
            <div className="flex gap-2">
              <Button
                onClick={handleDeleteQuote}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedQuote(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Stats Modal */}
      {showStatsModal && stats && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-2xl font-bold mb-4">Quote Statistics</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Quotes by Category</h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(stats.byCategory).map(([category, count]) => (
                    <div key={category} className="flex justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">{category}</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Most Shown Quotes (Top 10)</h3>
                <div className="space-y-2">
                  {stats.mostShown.map((quote, index) => (
                    <div key={quote.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div className="flex-1">
                        <span className="text-xs font-mono text-gray-600">{quote.id}</span>
                        <p className="text-sm line-clamp-1">{quote.textEn}</p>
                      </div>
                      <span className="ml-4 px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm font-semibold">
                        {quote.displayCount}×
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowResetStatsDialog(true)}
                className="flex-1 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
              >
                Reset Stats
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowStatsModal(false)}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Delete All Confirmation Dialog */}
      <AlertDialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Quotes?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all quotes from the database. This action cannot be undone.
              You can re-upload quotes later using the "Upload JSON" feature.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAll} className="bg-red-600 hover:bg-red-700">
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upload JSON Dialog */}
      <AlertDialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Upload Quotes from JSON</AlertDialogTitle>
            <AlertDialogDescription>
              Upload a JSON file containing an array of quotes. Use the "Download Template" button to get a sample format.
              Existing quotes with matching IDs will be updated, new quotes will be added.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <Label htmlFor="json-upload" className="mb-2 block">
              Select JSON File
            </Label>
            <Input
              id="json-upload"
              type="file"
              accept=".json"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              className="cursor-pointer"
            />
            {uploadFile && (
              <p className="text-sm text-gray-600 mt-2">
                Selected: {uploadFile.name}
              </p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUploadFile(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleUploadJSON} 
              className="bg-purple-600 hover:bg-purple-700"
              disabled={!uploadFile}
            >
              Upload
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Selected Confirmation Dialog */}
      <AlertDialog open={showDeleteSelectedDialog} onOpenChange={setShowDeleteSelectedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Quotes?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedQuotes.length} selected quote{selectedQuotes.length > 1 ? 's' : ''}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSelected} className="bg-red-600 hover:bg-red-700">
              Delete {selectedQuotes.length} Quote{selectedQuotes.length > 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Stats Confirmation Dialog */}
      <AlertDialog open={showResetStatsDialog} onOpenChange={setShowResetStatsDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Quote Statistics?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reset all quote display counts to 0? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetStats} className="bg-orange-600 hover:bg-orange-700">
              Reset Stats
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
