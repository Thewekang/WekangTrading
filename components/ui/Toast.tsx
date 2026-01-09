/**
 * Toast Notification Component
 * Simple toast notification system for success, error, and info messages
 */
'use client';

import { useEffect, useState } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, type, duration = 3000, onClose }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
  }[type];

  const icon = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
  }[type];

  return (
    <div
      className={`fixed top-4 right-4 z-[9999] flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white ${bgColor} transition-all duration-300 ${
        isExiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'
      }`}
      style={{ minWidth: '300px', maxWidth: '500px' }}
    >
      <span className="text-xl font-bold">{icon}</span>
      <p className="flex-1 text-sm">{message}</p>
      <button
        onClick={() => {
          setIsExiting(true);
          setTimeout(onClose, 300);
        }}
        className="text-white hover:text-gray-200 transition-colors"
      >
        ✕
      </button>
    </div>
  );
}

// Toast manager for multiple toasts
interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

let toastCounter = 0;
const toastListeners: Array<(toasts: ToastItem[]) => void> = [];
let toasts: ToastItem[] = [];

function notifyListeners() {
  toastListeners.forEach(listener => listener([...toasts]));
}

export function showToast(message: string, type: ToastType = 'info') {
  const id = `toast-${++toastCounter}`;
  toasts.push({ id, message, type });
  notifyListeners();
}

export function ToastContainer() {
  const [currentToasts, setCurrentToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const listener = (newToasts: ToastItem[]) => setCurrentToasts(newToasts);
    toastListeners.push(listener);
    return () => {
      const index = toastListeners.indexOf(listener);
      if (index > -1) toastListeners.splice(index, 1);
    };
  }, []);

  const removeToast = (id: string) => {
    toasts = toasts.filter(t => t.id !== id);
    notifyListeners();
  };

  return (
    <>
      {currentToasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </>
  );
}
