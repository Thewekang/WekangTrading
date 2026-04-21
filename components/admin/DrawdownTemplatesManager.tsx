'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  accountType: string | null;
  dailyDrawdownPct: number | null;
  totalDrawdownPct: number | null;
  consistencyTargetPct: number | null;
  targetGainPct: number | null;
  dailyResetTimezone: string | null;
  isDefault: boolean | null;
}

const ACCOUNT_TYPES = ['', 'PROP_FIRM', 'FUTURES', 'CFD', 'FOREX', 'SHARE', 'DEMO'] as const;
const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  '': 'All types',
  PROP_FIRM: 'Prop Firm', FUTURES: 'Futures', CFD: 'CFD', FOREX: 'Forex', SHARE: 'Share', DEMO: 'Demo',
};

const BROKER_TIMEZONES = [
  { value: '', label: '— None —' },
  { value: 'UTC', label: 'UTC' },
  { value: 'America/Chicago', label: 'CT — America/Chicago (Tradovate/Apex)' },
  { value: 'America/New_York', label: 'ET — America/New_York' },
  { value: 'America/Los_Angeles', label: 'PT — America/Los_Angeles' },
  { value: 'Europe/London', label: 'GMT/BST — Europe/London' },
  { value: 'Europe/Prague', label: 'CET — Europe/Prague (FTMO)' },
  { value: 'Asia/Kuala_Lumpur', label: 'MYT — Asia/Kuala_Lumpur' },
  { value: 'Asia/Singapore', label: 'SGT — Asia/Singapore' },
  { value: 'Asia/Tokyo', label: 'JST — Asia/Tokyo' },
  { value: 'Australia/Sydney', label: 'AEST — Australia/Sydney' },
];

// ------------------------------------------------
// Empty form state
// ------------------------------------------------
const emptyForm = () => ({
  name: '',
  accountType: '' as string,
  dailyDrawdownPct: '',
  totalDrawdownPct: '',
  consistencyTargetPct: '',
  targetGainPct: '',
  dailyResetTimezone: '',
  isDefault: false,
});

// ------------------------------------------------
// Template Row (inline edit)
// ------------------------------------------------
function TemplateRow({ template, onDeleted }: { template: Template; onDeleted: (id: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: template.name,
    accountType: template.accountType ?? '',
    dailyDrawdownPct: template.dailyDrawdownPct?.toString() ?? '',
    totalDrawdownPct: template.totalDrawdownPct?.toString() ?? '',
    consistencyTargetPct: template.consistencyTargetPct?.toString() ?? '',
    targetGainPct: template.targetGainPct?.toString() ?? '',
    dailyResetTimezone: template.dailyResetTimezone ?? '',
    isDefault: template.isDefault ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/drawdown-templates/${template.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        accountType: form.accountType || null,
        dailyDrawdownPct: form.dailyDrawdownPct ? parseFloat(form.dailyDrawdownPct) : null,
        totalDrawdownPct: form.totalDrawdownPct ? parseFloat(form.totalDrawdownPct) : null,
        consistencyTargetPct: form.consistencyTargetPct ? parseFloat(form.consistencyTargetPct) : null,
        targetGainPct: form.targetGainPct ? parseFloat(form.targetGainPct) : null,
        dailyResetTimezone: form.dailyResetTimezone || null,
        isDefault: form.isDefault,
      }),
    });
    const json = await res.json();
    setSaving(false);
    if (!json.success) { setError(json.error?.message ?? 'Failed'); return; }
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Delete template "${template.name}"?`)) return;
    const res = await fetch(`/api/admin/drawdown-templates/${template.id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) onDeleted(template.id);
  };

  if (!editing) {
    return (
      <tr className="border-b hover:bg-gray-50">
        <td className="py-3 px-4 text-sm font-medium">{template.name}</td>
        <td className="py-3 px-4 text-sm text-gray-500">{ACCOUNT_TYPE_LABELS[template.accountType ?? ''] ?? template.accountType ?? '—'}</td>
        <td className="py-3 px-4 text-sm text-center">{template.dailyDrawdownPct ?? '—'}</td>
        <td className="py-3 px-4 text-sm text-center">{template.totalDrawdownPct ?? '—'}</td>
        <td className="py-3 px-4 text-sm text-center">{template.consistencyTargetPct ?? '—'}</td>
        <td className="py-3 px-4 text-sm text-center">{template.targetGainPct ?? '—'}</td>
        <td className="py-3 px-4 text-sm text-center">{template.dailyResetTimezone ?? '—'}</td>
        <td className="py-3 px-4 text-sm text-center">{template.isDefault ? '✓' : ''}</td>
        <td className="py-3 px-4">
          <div className="flex items-center gap-2 justify-end">
            <button onClick={() => setEditing(true)} className="text-blue-600 hover:text-blue-800"><Pencil className="h-4 w-4" /></button>
            <button onClick={handleDelete} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b bg-blue-50">
      <td className="py-2 px-4"><input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="w-full border rounded px-2 py-1 text-sm" /></td>
      <td className="py-2 px-4">
        <select value={form.accountType} onChange={(e) => setForm((p) => ({ ...p, accountType: e.target.value }))} className="w-full border rounded px-2 py-1 text-sm">
          {ACCOUNT_TYPES.map((t) => <option key={t} value={t}>{ACCOUNT_TYPE_LABELS[t]}</option>)}
        </select>
      </td>
      {(['dailyDrawdownPct', 'totalDrawdownPct', 'consistencyTargetPct', 'targetGainPct'] as const).map((field) => (
        <td key={field} className="py-2 px-4"><input type="number" step="0.1" value={form[field]} onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))} className="w-full border rounded px-2 py-1 text-sm text-center" placeholder="—" /></td>
      ))}
      <td className="py-2 px-4">
        <select value={form.dailyResetTimezone} onChange={(e) => setForm((p) => ({ ...p, dailyResetTimezone: e.target.value }))} className="w-full border rounded px-2 py-1 text-sm">
          {BROKER_TIMEZONES.map((tz) => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
        </select>
      </td>
      <td className="py-2 px-4 text-center"><input type="checkbox" checked={form.isDefault} onChange={(e) => setForm((p) => ({ ...p, isDefault: e.target.checked }))} /></td>
      <td className="py-2 px-4">
        <div className="flex items-center gap-2 justify-end">
          {error && <span className="text-red-500 text-xs">{error}</span>}
          <button onClick={handleSave} disabled={saving} className="text-green-600 hover:text-green-800"><Check className="h-4 w-4" /></button>
          <button onClick={() => setEditing(false)} className="text-gray-500 hover:text-gray-700"><X className="h-4 w-4" /></button>
        </div>
      </td>
    </tr>
  );
}

// ------------------------------------------------
// Add form
// ------------------------------------------------
function AddTemplateRow({ onAdded }: { onAdded: (t: Template) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch('/api/admin/drawdown-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        accountType: form.accountType || null,
        dailyDrawdownPct: form.dailyDrawdownPct ? parseFloat(form.dailyDrawdownPct) : null,
        totalDrawdownPct: form.totalDrawdownPct ? parseFloat(form.totalDrawdownPct) : null,
        consistencyTargetPct: form.consistencyTargetPct ? parseFloat(form.consistencyTargetPct) : null,
        targetGainPct: form.targetGainPct ? parseFloat(form.targetGainPct) : null,
        dailyResetTimezone: form.dailyResetTimezone || null,
        isDefault: form.isDefault,
      }),
    });
    const json = await res.json();
    setSaving(false);
    if (!json.success) { setError(json.error?.message ?? 'Failed'); return; }
    onAdded(json.data);
    setForm(emptyForm());
    setOpen(false);
  };

  if (!open) {
    return (
      <div className="mt-4">
        <button onClick={() => setOpen(true)} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium">
          <Plus className="h-4 w-4" /> Add Template
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 border rounded-lg p-4 bg-blue-50 space-y-3">
      <h3 className="text-sm font-semibold">New Template</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="col-span-2 sm:col-span-1">
          <label className="block text-xs text-gray-600 mb-1">Name *</label>
          <input required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm" placeholder="e.g. FTMO Standard" />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Account Type</label>
          <select value={form.accountType} onChange={(e) => setForm((p) => ({ ...p, accountType: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm">
            {ACCOUNT_TYPES.map((t) => <option key={t} value={t}>{ACCOUNT_TYPE_LABELS[t]}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Daily DD %</label>
          <input type="number" step="0.1" value={form.dailyDrawdownPct} onChange={(e) => setForm((p) => ({ ...p, dailyDrawdownPct: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm" placeholder="e.g. 5" />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Total DD %</label>
          <input type="number" step="0.1" value={form.totalDrawdownPct} onChange={(e) => setForm((p) => ({ ...p, totalDrawdownPct: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm" placeholder="e.g. 10" />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Consistency %</label>
          <input type="number" step="1" value={form.consistencyTargetPct} onChange={(e) => setForm((p) => ({ ...p, consistencyTargetPct: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm" placeholder="e.g. 30" />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Target Gain %</label>
          <input type="number" step="0.1" value={form.targetGainPct} onChange={(e) => setForm((p) => ({ ...p, targetGainPct: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm" placeholder="e.g. 10" />
        </div>
        <div className="col-span-2 sm:col-span-3">
          <label className="block text-xs text-gray-600 mb-1">Daily Reset Timezone</label>
          <select value={form.dailyResetTimezone} onChange={(e) => setForm((p) => ({ ...p, dailyResetTimezone: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm">
            {BROKER_TIMEZONES.map((tz) => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="isDefault" checked={form.isDefault} onChange={(e) => setForm((p) => ({ ...p, isDefault: e.target.checked }))} />
          <label htmlFor="isDefault" className="text-xs text-gray-600">Default template</label>
        </div>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded px-4 py-1.5 text-sm">{saving ? 'Saving…' : 'Add'}</button>
        <button type="button" onClick={() => setOpen(false)} className="border rounded px-4 py-1.5 text-sm text-gray-600">Cancel</button>
      </div>
    </form>
  );
}

// ------------------------------------------------
// Main Manager
// ------------------------------------------------
interface DrawdownTemplatesManagerProps {
  initialTemplates: Template[];
}

export function DrawdownTemplatesManager({ initialTemplates }: DrawdownTemplatesManagerProps) {
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);

  const handleAdded = (t: Template) => setTemplates((prev) => [...prev, t]);
  const handleDeleted = (id: string) => setTemplates((prev) => prev.filter((t) => t.id !== id));

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Name</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Type</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase text-center">Daily DD%</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase text-center">Total DD%</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase text-center">Consistency%</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase text-center">Target%</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase text-center">Reset TZ</th>
              <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase text-center">Default</th>
              <th className="py-3 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {templates.length === 0 ? (
              <tr><td colSpan={9} className="py-8 text-center text-gray-400 text-sm">No templates yet</td></tr>
            ) : (
              templates.map((t) => <TemplateRow key={t.id} template={t} onDeleted={handleDeleted} />)
            )}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t">
        <AddTemplateRow onAdded={handleAdded} />
      </div>
    </div>
  );
}
