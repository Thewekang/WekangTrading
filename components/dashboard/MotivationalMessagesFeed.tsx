/**
 * Motivational Messages Feed - Display recent achievement notifications and encouragement
 */

'use client';

import { useEffect, useState } from 'react';
import { MotivationalMessage } from '@/lib/db/schema';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface MessageFeedProps {
  limit?: number;
}

export function MotivationalMessagesFeed({ limit = 5 }: MessageFeedProps) {
  const [messages, setMessages] = useState<MotivationalMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
  }, [limit]);

  async function fetchMessages() {
    try {
      const response = await fetch(`/api/messages?limit=${limit}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setMessages(data.data.data || []);
          setUnreadCount(data.data.unreadCount || 0);
        } else {
          setMessages([]);
          setUnreadCount(0);
        }
      } else {
        setMessages([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      setMessages([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(messageId: string) {
    try {
      await fetch(`/api/messages/${messageId}/read`, { method: 'PATCH' });
      setMessages((prevMessages) => 
        prevMessages.map(m => 
          m.id === messageId ? { ...m, isRead: true } : m
        )
      );
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">💬 Recent Updates</h2>
        <div className="animate-pulse text-gray-400">Loading messages...</div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">💬 Recent Updates</h2>
        <div className="text-center py-6 text-gray-500">
          <p className="text-3xl mb-2">📭</p>
          <p className="text-sm">No messages yet</p>
          <p className="text-xs mt-1">Start trading to receive updates!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">💬 Recent Updates</h2>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {unreadCount} new
            </span>
          )}
          <Link
            href="/dashboard/notifications"
            className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
          >
            View All →
          </Link>
        </div>
      </div>
      
      {/* Messages List */}
      <div className="space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'p-3 rounded-lg border cursor-pointer transition-colors',
              message.isRead 
                ? 'bg-gray-50 border-gray-200' 
                : 'bg-blue-50 border-blue-200'
            )}
            onClick={() => !message.isRead && markAsRead(message.id)}
          >
            {/* Message Header */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="font-semibold text-gray-900 text-sm">
                {message.title}
              </div>
              {!message.isRead && (
                <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1"></span>
              )}
            </div>
            
            {/* Message Content */}
            <p className="text-sm text-gray-700 mb-2">
              {message.message}
            </p>
            
            {/* Message Footer */}
            <div className="flex items-center justify-between">
              <span className={cn(
                'text-xs px-2 py-0.5 rounded',
                getMessageTypeColor(message.messageType)
              )}>
                {formatMessageType(message.messageType)}
              </span>
              <span className="text-xs text-gray-500">
                {formatRelativeTime(message.createdAt)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getMessageTypeColor(type: string): string {
  switch (type) {
    case 'ACHIEVEMENT':
      return 'bg-yellow-100 text-yellow-700';
    case 'STREAK':
      return 'bg-orange-100 text-orange-700';
    case 'MILESTONE':
      return 'bg-purple-100 text-purple-700';
    case 'ENCOURAGEMENT':
      return 'bg-green-100 text-green-700';
    case 'PERFORMANCE':
      return 'bg-blue-100 text-blue-700';
    case 'CELEBRATION':
      return 'bg-pink-100 text-pink-700';
    case 'REMINDER':
      return 'bg-gray-100 text-gray-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

function formatMessageType(type: string): string {
  return type.toLowerCase().replace('_', ' ');
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}
