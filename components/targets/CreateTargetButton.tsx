/**
 * Create Target Button Component
 * Opens modal to create a new target
 */
'use client';

import { useState } from 'react';
import TargetModal from './TargetModal';

export default function CreateTargetButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        + Create Target
      </button>
      
      {isOpen && (
        <TargetModal onClose={() => setIsOpen(false)} />
      )}
    </>
  );
}
