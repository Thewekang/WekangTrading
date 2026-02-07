'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showToast } from '@/components/ui/Toast';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  RefreshCw, 
  TrendingUp,
  BarChart3,
  Quote as QuoteIcon,
  Search,
  Filter
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
  sourceUrl: string | null;
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
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    id: '',
    enabled: true,
    category: 'GENERAL' as QuoteCategory,
    weight: 5,
    textEn: '',
    textBm: '',
    author: '',
    sourceType: 'ORIGINAL',
    sourceUrl: '',
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

  const handleReseedQuotes = async () => {
    if (!confirm('Re-seed quotes from JSON file? This will update existing quotes and add new ones.')) {
      return;
    }

    try {
      const response = await fetch('/api/quotes/seed', {
        method: 'POST',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to seed quotes');
      }

      showToast(result.message || 'Quotes re-seeded successfully', 'success');
      fetchQuotes();
      fetchStats();
    } catch (error: any) {
      showToast(error.message || 'Failed to seed quotes', 'error');
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
      sourceUrl: quote.sourceUrl || '',
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
      category: 'GENERAL',
      weight: 5,
      textEn: '',
      textBm: '',
      author: '',
      sourceType: 'ORIGINAL',
      sourceUrl: '',
    });
  };

  const categories: QuoteCategory[] = [
    'DISCIPLINE', 'LOSS', 'WIN', 'PATIENCE', 'CONFIDENCE', 
    'OVERTRADING', 'RISK', 'MENTAL', 'GENERAL'
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quote Management</h1>
        <p className="text-gray-600">Manage motivational trading quotes</p>
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
            <Button onClick={handleReseedQuotes} variant="outline">
              <RefreshCw size={16} className="mr-2" />
              Re-seed from JSON
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
            >
              <option value="ALL">All Categories</option>
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
                    <Label>Category</Label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as QuoteCategory })}
                      className="w-full px-3 py-2 border rounded-md"
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Source Type</Label>
                    <select
                      value={formData.sourceType}
                      onChange={(e) => setFormData({ ...formData, sourceType: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="ORIGINAL">Original</option>
                      <option value="BOOK">Book</option>
                      <option value="ARTICLE">Article</option>
                      <option value="INTERVIEW">Interview</option>
                    </select>
                  </div>
                  <div>
                    <Label>Source URL (optional)</Label>
                    <Input
                      type="url"
                      value={formData.sourceUrl}
                      onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                    />
                  </div>
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
                    <Label>Category</Label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as QuoteCategory })}
                      className="w-full px-3 py-2 border rounded-md"
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Source Type</Label>
                    <select
                      value={formData.sourceType}
                      onChange={(e) => setFormData({ ...formData, sourceType: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="ORIGINAL">Original</option>
                      <option value="BOOK">Book</option>
                      <option value="ARTICLE">Article</option>
                      <option value="INTERVIEW">Interview</option>
                    </select>
                  </div>
                  <div>
                    <Label>Source URL (optional)</Label>
                    <Input
                      type="url"
                      value={formData.sourceUrl}
                      onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                    />
                  </div>
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

            <div className="mt-6">
              <Button
                variant="outline"
                onClick={() => setShowStatsModal(false)}
                className="w-full"
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
