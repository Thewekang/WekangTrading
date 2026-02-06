'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Save, RotateCcw } from 'lucide-react';
import type { DisciplineTrackerSettings } from '@/lib/db/schema';
import { toast } from 'sonner';

interface SettingsPanelProps {
  settings: DisciplineTrackerSettings;
  onUpdate: (updates: Partial<DisciplineTrackerSettings>) => Promise<void>;
}

export function SettingsPanel({ settings, onUpdate }: SettingsPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    maxTradesPerDay: settings.maxTradesPerDay,
    slValue: settings.slValue,
    beValue: settings.beValue,
    tp1Value: settings.tp1Value,
    tp2Value: settings.tp2Value,
    tp3Mode: settings.tp3Mode,
    tp3FixedValue: settings.tp3FixedValue || 240,
    winRateFormula: settings.winRateFormula,
  });

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onUpdate(formData);
      setIsEditing(false);
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFormData({
      maxTradesPerDay: settings.maxTradesPerDay,
      slValue: settings.slValue,
      beValue: settings.beValue,
      tp1Value: settings.tp1Value,
      tp2Value: settings.tp2Value,
      tp3Mode: settings.tp3Mode,
      tp3FixedValue: settings.tp3FixedValue || 240,
      winRateFormula: settings.winRateFormula,
    });
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Plan Settings
            </CardTitle>
            <CardDescription>Configure your trading discipline rules and P&L values</CardDescription>
          </div>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
              Edit Settings
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleReset} variant="outline" size="sm" disabled={isSaving}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} size="sm" disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="maxTradesPerDay">Max Trades Per Day</Label>
            <Input
              id="maxTradesPerDay"
              type="number"
              min={1}
              max={10}
              value={formData.maxTradesPerDay}
              onChange={(e) => setFormData({ ...formData, maxTradesPerDay: parseInt(e.target.value) })}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slValue">SL P&L ($)</Label>
            <Input
              id="slValue"
              type="number"
              step="0.01"
              value={formData.slValue}
              onChange={(e) => setFormData({ ...formData, slValue: parseFloat(e.target.value) })}
              disabled={!isEditing}
              className="text-rose-600 font-medium"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="beValue">BE P&L ($)</Label>
            <Input
              id="beValue"
              type="number"
              step="0.01"
              value={formData.beValue}
              onChange={(e) => setFormData({ ...formData, beValue: parseFloat(e.target.value) })}
              disabled={!isEditing}
              className="text-amber-600 font-medium"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tp1Value">TP1 P&L ($)</Label>
            <Input
              id="tp1Value"
              type="number"
              step="0.01"
              value={formData.tp1Value}
              onChange={(e) => setFormData({ ...formData, tp1Value: parseFloat(e.target.value) })}
              disabled={!isEditing}
              className="text-lime-600 font-medium"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tp2Value">TP2 P&L ($)</Label>
            <Input
              id="tp2Value"
              type="number"
              step="0.01"
              value={formData.tp2Value}
              onChange={(e) => setFormData({ ...formData, tp2Value: parseFloat(e.target.value) })}
              disabled={!isEditing}
              className="text-green-600 font-medium"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tp3Mode">TP3 Mode</Label>
            <Select
              value={formData.tp3Mode}
              onValueChange={(value: 'manual' | 'fixed') => setFormData({ ...formData, tp3Mode: value })}
              disabled={!isEditing}
            >
              <SelectTrigger id="tp3Mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual (enter each time)</SelectItem>
                <SelectItem value="fixed">Fixed value</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.tp3Mode === 'fixed' && (
            <div className="space-y-2">
              <Label htmlFor="tp3FixedValue">TP3 Fixed Value ($)</Label>
              <Input
                id="tp3FixedValue"
                type="number"
                step="0.01"
                value={formData.tp3FixedValue}
                onChange={(e) => setFormData({ ...formData, tp3FixedValue: parseFloat(e.target.value) })}
                disabled={!isEditing}
                className="text-emerald-600 font-medium"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="winRateFormula">Win Rate Formula</Label>
            <Select
              value={formData.winRateFormula}
              onValueChange={(value: 'excludeBE' | 'includeBE') => setFormData({ ...formData, winRateFormula: value })}
              disabled={!isEditing}
            >
              <SelectTrigger id="winRateFormula">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excludeBE">Wins / (Wins + Losses)</SelectItem>
                <SelectItem value="includeBE">Wins / (Wins + Losses + BE)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> These settings apply to all your discipline tracker entries.
            Changes will affect how future rows are evaluated and displayed.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
