'use client';

/**
 * Bulk Trade Entry Form
 * Table-like interface for entering multiple trades at once
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BadgeCelebration } from '@/components/animations/BadgeCelebration';
import type { Badge } from '@/lib/db/schema';

interface SopType {
  id: string;
  name: string;
}

interface BulkTradeRow {
  id: string;
  time: string;
  result: 'WIN' | 'LOSS' | '';
  sopFollowed: boolean | null;
  sopTypeId: string;
  symbol: string;
  amount: string;
  notes: string;
}

export function BulkTradeEntryForm() {
  const router = useRouter();
  const [tradeDate, setTradeDate] = useState('');
  const [sopTypes, setSopTypes] = useState<SopType[]>([]);
  const [loadingSopTypes, setLoadingSopTypes] = useState(true);
  const [rows, setRows] = useState<BulkTradeRow[]>([
    { id: '1', time: '', result: '', sopFollowed: null, sopTypeId: '', symbol: '', amount: '', notes: '' },
    { id: '2', time: '', result: '', sopFollowed: null, sopTypeId: '', symbol: '', amount: '', notes: '' },
    { id: '3', time: '', result: '', sopFollowed: null, sopTypeId: '', symbol: '', amount: '', notes: '' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [earnedBadges, setEarnedBadges] = useState<Badge[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);

  // Fetch SOP types
  useEffect(() => {
    const fetchSopTypes = async () => {
      try {
        const response = await fetch('/api/sop-types');
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setSopTypes(result.data);
          }
        }
      } catch (error) {
        console.error('Failed to load SOP types:', error);
      } finally {
        setLoadingSopTypes(false);
      }
    };
    fetchSopTypes();
  }, []);

  // Add new row
  const handleAddRow = () => {
    if (rows.length >= 100) {
      setErrorMessage('Maximum 100 trades per bulk entry');
      return;
    }
    const newId = (Math.max(...rows.map(r => parseInt(r.id))) + 1).toString();
    setRows([...rows, { id: newId, time: '', result: '', sopFollowed: null, sopTypeId: '', symbol: '', amount: '', notes: '' }]);
  };

  // Remove row
  const handleRemoveRow = (id: string) => {
    if (rows.length === 1) {
      setErrorMessage('Must have at least one trade row');
      return;
    }
    setRows(rows.filter(r => r.id !== id));
  };

  // Update row field
  const handleUpdateRow = (id: string, field: keyof BulkTradeRow, value: any) => {
    setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
    setErrorMessage('');
  };

  // Validate and submit
  const handleSubmit = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    // Validate trade date
    if (!tradeDate) {
      setErrorMessage('Please select a trade date');
      return;
    }

    // Filter out empty rows (rows with no time entered)
    const filledRows = rows.filter(r => r.time.trim() !== '');

    if (filledRows.length === 0) {
      setErrorMessage('Please enter at least one trade');
      return;
    }

    // Validate each filled row
    const errors: string[] = [];
    const trades = filledRows.map((row, index) => {
      const rowNum = index + 1;

      if (!row.result) {
        errors.push(`Row ${rowNum}: Result is required`);
      }
      if (row.sopFollowed === null) {
        errors.push(`Row ${rowNum}: SOP selection is required`);
      }
      if (!row.amount || parseFloat(row.amount) === 0) {
        errors.push(`Row ${rowNum}: Amount must be non-zero`);
      }

      // Combine date and time
      const tradeTimestamp = new Date(`${tradeDate}T${row.time}`);

      // Calculate profit/loss based on result
      let profitLoss = parseFloat(row.amount);
      if (row.result === 'LOSS' && profitLoss > 0) {
        profitLoss = -profitLoss;
      }
      if (row.result === 'WIN' && profitLoss < 0) {
        profitLoss = Math.abs(profitLoss);
      }

      return {
        tradeTimestamp: tradeTimestamp.toISOString(),
        result: row.result,
        sopFollowed: row.sopFollowed,
        sopTypeId: row.sopTypeId || null,
        symbol: row.symbol || undefined,
        profitLossUsd: profitLoss,
        notes: row.notes || undefined,
      };
    });

    if (errors.length > 0) {
      setErrorMessage(errors.join('; '));
      return;
    }

    // Submit to API
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/trades/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tradeDate: tradeDate,
          trades 
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setErrorMessage(result.error?.message || 'Failed to create trades');
        return;
      }
      
      // Check if badges were earned
      if (result.badges && result.badges.length > 0) {
        setEarnedBadges(result.badges);
        setShowCelebration(true);
      }

      setSuccessMessage(`✅ ${filledRows.length} trades recorded successfully!`);
      
      // Reset form after 2 seconds
      setTimeout(() => {
        router.push('/trades');
      }, 2000);
    } catch (error) {
      setErrorMessage('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Trade Date Selection */}
      <div className="bg-white rounded-lg shadow-md p-6 border">
        <Label htmlFor="tradeDate">Trade Date *</Label>
        <Input
          id="tradeDate"
          type="date"
          value={tradeDate}
          onChange={(e) => setTradeDate(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          className="mt-1 w-full sm:w-64"
        />
        <p className="mt-1 text-xs text-gray-500">All trades must be on the same date</p>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {errorMessage}
        </div>
      )}

      {/* Trades Table */}
      <div className="bg-white rounded-lg shadow-md border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12">#</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time *</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Result *</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">SOP *</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">SOP Type</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount (USD) *</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase w-16">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rows.map((row, index) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3 text-sm text-gray-500">{index + 1}</td>
                  <td className="px-3 py-3">
                    <input
                      type="time"
                      value={row.time}
                      onChange={(e) => handleUpdateRow(row.id, 'time', e.target.value)}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <select
                      value={row.result}
                      onChange={(e) => handleUpdateRow(row.id, 'result', e.target.value)}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Select</option>
                      <option value="WIN">✅ WIN</option>
                      <option value="LOSS">❌ LOSS</option>
                    </select>
                  </td>
                  <td className="px-3 py-3">
                    <select
                      value={row.sopFollowed === null ? '' : row.sopFollowed.toString()}
                      onChange={(e) => handleUpdateRow(row.id, 'sopFollowed', e.target.value === 'true')}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Select</option>
                      <option value="true">✓ Yes</option>
                      <option value="false">✗ No</option>
                    </select>
                  </td>
                  <td className="px-3 py-3">
                    <select
                      value={row.sopTypeId}
                      onChange={(e) => handleUpdateRow(row.id, 'sopTypeId', e.target.value)}
                      disabled={loadingSopTypes}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Others</option>
                      {sopTypes.map((sopType) => (
                        <option key={sopType.id} value={sopType.id}>
                          {sopType.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-3">
                    <input
                      type="text"
                      value={row.symbol}
                      onChange={(e) => handleUpdateRow(row.id, 'symbol', e.target.value.toUpperCase())}
                      placeholder="e.g. EURUSD"
                      maxLength={10}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm uppercase focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={row.amount}
                      onChange={(e) => handleUpdateRow(row.id, 'amount', e.target.value)}
                      placeholder="50.00"
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <input
                      type="text"
                      value={row.notes}
                      onChange={(e) => handleUpdateRow(row.id, 'notes', e.target.value)}
                      placeholder="Optional notes..."
                      maxLength={500}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-3 py-3 text-center">
                    <button
                      onClick={() => handleRemoveRow(row.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                      disabled={rows.length === 1}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Row Button */}
        <div className="p-4 border-t bg-gray-50">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddRow}
            disabled={rows.length >= 100}
          >
            ➕ Add Row
          </Button>
          <span className="ml-3 text-xs text-gray-500">
            {rows.length} / 100 rows
          </span>
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !tradeDate}
          size="lg"
          className="min-h-[44px]"
        >
          {isSubmitting ? 'Submitting...' : `💾 Save ${rows.filter(r => r.time).length} Trades`}
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => router.push('/trades')}
          disabled={isSubmitting}
          className="min-h-[44px]"
        >
          Cancel
        </Button>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Tips for Bulk Entry</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Leave time field empty for rows you don't want to submit</li>
          <li>• Amount is always entered as positive (auto-calculated based on WIN/LOSS)</li>
          <li>• All trades will have market session auto-calculated from timestamp</li>
          <li>• Maximum 100 trades per bulk entry</li>
          <li>• Use Tab key to navigate between fields quickly</li>
        </ul>
      </div>
      
      {/* Badge Celebration Animation */}
      <BadgeCelebration 
        badges={earnedBadges}
        isOpen={showCelebration}
        onClose={() => {
          setShowCelebration(false);
          setEarnedBadges([]);
        }}
      />
    </div>
  );
}
