'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCcw, Trash2, AlertTriangle } from 'lucide-react';

interface Props {
  accountId: string;
  accountName: string;
  isDefault: boolean;
  isOnlyAccount: boolean;
}

export function AccountActions({ accountId, accountName, isDefault, isOnlyAccount }: Props) {
  const router = useRouter();

  const [resetOpen, setResetOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [resetConfirm, setResetConfirm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const RESET_PHRASE = 'RESET';
  const DELETE_PHRASE = 'DELETE';

  async function handleReset() {
    if (resetConfirm !== RESET_PHRASE) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/trading-accounts/${accountId}/reset`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? 'Reset failed');
      setResetOpen(false);
      setResetConfirm('');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Reset failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (deleteConfirm !== DELETE_PHRASE) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/trading-accounts/${accountId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? 'Delete failed');
      setDeleteOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
        <button
          onClick={() => { setError(null); setResetConfirm(''); setResetOpen(true); }}
          className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 px-2 py-1 rounded transition-colors"
          title="Reset account data"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>

        <button
          onClick={() => { setError(null); setDeleteConfirm(''); setDeleteOpen(true); }}
          disabled={isDefault || isOnlyAccount}
          className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title={
            isDefault ? 'Set another account as default before deleting' :
            isOnlyAccount ? 'Cannot delete your only account' :
            'Delete this account'
          }
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>
      </div>

      {/* Reset dialog */}
      {resetOpen && (
        <Dialog onClose={() => setResetOpen(false)}>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Reset account data</h3>
              <p className="text-sm text-gray-500">{accountName}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            This will permanently delete <strong>all trades, summaries, targets, badges, and discipline data</strong> for
            this account. The account and its rules are kept. <strong>This cannot be undone.</strong>
          </p>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type <span className="font-mono font-bold text-amber-700">{RESET_PHRASE}</span> to confirm
          </label>
          <input
            type="text"
            value={resetConfirm}
            onChange={(e) => setResetConfirm(e.target.value.toUpperCase())}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
            placeholder={RESET_PHRASE}
            autoFocus
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleReset}
              disabled={resetConfirm !== RESET_PHRASE || loading}
              className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
            >
              {loading ? 'Resetting…' : 'Reset account'}
            </button>
            <button
              onClick={() => setResetOpen(false)}
              disabled={loading}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              Cancel
            </button>
          </div>
        </Dialog>
      )}

      {/* Delete dialog */}
      {deleteOpen && (
        <Dialog onClose={() => setDeleteOpen(false)}>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Delete account</h3>
              <p className="text-sm text-gray-500">{accountName}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            This will <strong>permanently delete this account and all its data</strong> — trades, summaries, targets,
            rules, and more. <strong>This cannot be undone.</strong>
          </p>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type <span className="font-mono font-bold text-red-700">{DELETE_PHRASE}</span> to confirm
          </label>
          <input
            type="text"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value.toUpperCase())}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-400"
            placeholder={DELETE_PHRASE}
            autoFocus
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleDelete}
              disabled={deleteConfirm !== DELETE_PHRASE || loading}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
            >
              {loading ? 'Deleting…' : 'Delete account'}
            </button>
            <button
              onClick={() => setDeleteOpen(false)}
              disabled={loading}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              Cancel
            </button>
          </div>
        </Dialog>
      )}
    </>
  );
}

function Dialog({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        {children}
      </div>
    </div>
  );
}
