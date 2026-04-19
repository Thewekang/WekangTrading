'use client';

import { useState } from 'react';

interface Setting {
  key: string;
  value: string;
  description: string | null;
}

interface AdminSettingsEditorProps {
  settings: Setting[];
}

export function AdminSettingsEditor({ settings: initialSettings }: AdminSettingsEditorProps) {
  const [settings, setSettings] = useState<Setting[]>(initialSettings);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleEdit = (key: string, value: string) => {
    setEditing((prev) => ({ ...prev, [key]: value }));
    setSaved((prev) => ({ ...prev, [key]: false }));
  };

  const handleSave = async (setting: Setting) => {
    const newValue = editing[setting.key] ?? setting.value;
    setSaving((prev) => ({ ...prev, [setting.key]: true }));
    setErrors((prev) => ({ ...prev, [setting.key]: '' }));
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: setting.key, value: newValue, description: setting.description ?? undefined }),
      });
      const json = await res.json();
      if (!json.success) {
        setErrors((prev) => ({ ...prev, [setting.key]: json.error?.message ?? 'Failed to save' }));
        return;
      }
      setSettings((prev) => prev.map((s) => s.key === setting.key ? { ...s, value: newValue } : s));
      setSaved((prev) => ({ ...prev, [setting.key]: true }));
    } catch {
      setErrors((prev) => ({ ...prev, [setting.key]: 'Network error' }));
    } finally {
      setSaving((prev) => ({ ...prev, [setting.key]: false }));
    }
  };

  return (
    <div className="space-y-3">
      {settings.map((setting) => {
        const isDirty = editing[setting.key] !== undefined && editing[setting.key] !== setting.value;
        return (
          <div key={setting.key} className="border rounded-md p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-mono font-medium text-gray-800">{setting.key}</p>
                {setting.description && <p className="text-xs text-gray-500 mt-0.5">{setting.description}</p>}
              </div>
              {saved[setting.key] && <span className="text-xs text-green-600 shrink-0">Saved ✓</span>}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                defaultValue={setting.value}
                onChange={(e) => handleEdit(setting.key, e.target.value)}
                className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => handleSave(setting)}
                disabled={!isDirty || saving[setting.key]}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded text-sm transition-colors shrink-0"
              >
                {saving[setting.key] ? '…' : 'Save'}
              </button>
            </div>
            {errors[setting.key] && <p className="text-red-500 text-xs">{errors[setting.key]}</p>}
          </div>
        );
      })}
    </div>
  );
}
