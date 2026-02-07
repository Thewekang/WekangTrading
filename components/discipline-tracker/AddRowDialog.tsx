'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import type { DisciplineTrackerRowInput } from '@/lib/validations/disciplineTracker';
import { toast } from 'sonner';

interface AddRowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: DisciplineTrackerRowInput) => Promise<void>;
}

export function AddRowDialog({ open, onOpenChange, onSubmit }: AddRowDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<DisciplineTrackerRowInput>({
    tradeDate: new Date().toISOString().split('T')[0],
    notes: '',
    sessionWindow: 'non-prime',
    isAPlusDay: false,
    isRangeExpansionDay: false,
  });

  const resetForm = () => {
    setFormData({
      tradeDate: new Date().toISOString().split('T')[0],
      notes: '',
      sessionWindow: 'non-prime',
      isAPlusDay: false,
      isRangeExpansionDay: false,
    });
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await onSubmit(formData);
      // Only close and reset if successful (parent handles errors)
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Failed to add row:', error);
      // Error toast is handled by parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Trading Day</DialogTitle>
          <DialogDescription>
            Create a new entry to track your discipline for a specific day.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Date */}
          <div className="grid gap-2">
            <Label htmlFor="tradeDate">Date</Label>
            <Input
              id="tradeDate"
              type="date"
              value={formData.tradeDate}
              onChange={(e) => setFormData({ ...formData, tradeDate: e.target.value })}
            />
          </div>

          {/* Notes */}
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes / Tags</Label>
            <Textarea
              id="notes"
              placeholder="e.g., NFP day, Morning session..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>

          {/* Session Window */}
          <div className="grid gap-2">
            <Label htmlFor="sessionWindow">Session Window</Label>
            <Select
              value={formData.sessionWindow}
              onValueChange={(value: 'prime' | 'non-prime') =>
                setFormData({ ...formData, sessionWindow: value })
              }
            >
              <SelectTrigger id="sessionWindow">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prime">Prime (Best trading hours)</SelectItem>
                <SelectItem value="non-prime">Non-Prime</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Toggles */}
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="aplusConfirmed" className="cursor-pointer">
                A+ Setup Confirmed
              </Label>
              <Switch
                id="aplusConfirmed"
                checked={formData.isAPlusDay}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isAPlusDay: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="rangeExpansion" className="cursor-pointer">
                Range Expansion Confirmed
              </Label>
              <Switch
                id="rangeExpansion"
                checked={formData.isRangeExpansionDay}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isRangeExpansionDay: checked })
                }
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add Day'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
