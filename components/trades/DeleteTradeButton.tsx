"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { showToast } from '@/components/ui/Toast';
import { Trash2 } from 'lucide-react';

interface DeleteTradeButtonProps {
  tradeId: string;
}

export function DeleteTradeButton({ tradeId }: DeleteTradeButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/trades/individual/${tradeId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to delete trade');
      }

      showToast('Trade deleted successfully', 'success');
      
      // Redirect to trades list
      router.push('/trades');
      router.refresh();
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to delete trade';
      if (errorMessage.includes('24 hours')) {
        showToast('Trades can only be deleted within 24 hours of creation', 'error');
      } else {
        showToast(errorMessage, 'error');
      }
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  if (!showConfirm) {
    return (
      <Button 
        variant="destructive" 
        className="w-full"
        onClick={() => setShowConfirm(true)}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Delete Trade
      </Button>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2 w-full">
      <Button 
        variant="destructive" 
        className="flex-1"
        onClick={handleDelete}
        disabled={isDeleting}
      >
        {isDeleting ? 'Deleting...' : '✓ Confirm Delete'}
      </Button>
      <Button 
        variant="outline" 
        className="flex-1"
        onClick={() => setShowConfirm(false)}
        disabled={isDeleting}
      >
        Cancel
      </Button>
    </div>
  );
}
