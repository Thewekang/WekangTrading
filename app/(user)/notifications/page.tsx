'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Check, CheckCheck, Trophy, TrendingUp, Award, Heart, Calendar, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  metadata: any;
  isRead: boolean;
  createdAt: string;
}

const messageTypeConfig = {
  ACHIEVEMENT: { icon: Trophy, color: 'text-yellow-600 bg-yellow-50', label: 'Achievement' },
  STREAK: { icon: TrendingUp, color: 'text-orange-600 bg-orange-50', label: 'Streak' },
  MILESTONE: { icon: Award, color: 'text-purple-600 bg-purple-50', label: 'Milestone' },
  ENCOURAGEMENT: { icon: Heart, color: 'text-green-600 bg-green-50', label: 'Encouragement' },
  PERFORMANCE: { icon: TrendingUp, color: 'text-blue-600 bg-blue-50', label: 'Performance' },
  CELEBRATION: { icon: Award, color: 'text-pink-600 bg-pink-50', label: 'Celebration' },
  REMINDER: { icon: Calendar, color: 'text-gray-600 bg-gray-50', label: 'Reminder' },
};

export default function NotificationsPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchMessages();
  }, [filter]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const url = filter === 'UNREAD' 
        ? '/api/messages?unreadOnly=true&limit=100'
        : '/api/messages?limit=100';
      
      const response = await fetch(url);
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
  };

  const markAsRead = async (messageId: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/read`, {
        method: 'PATCH',
      });
      
      if (response.ok) {
        setMessages((prevMessages) => 
          prevMessages?.map(msg => 
            msg.id === messageId ? { ...msg, isRead: true } : msg
          ) || []
        );
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadMessages = messages?.filter(msg => !msg.isRead) || [];
      
      await Promise.all(
        unreadMessages.map(msg =>
          fetch(`/api/messages/${msg.id}/read`, { method: 'PATCH' })
        )
      );
      
      setMessages((prevMessages) => 
        prevMessages?.map(msg => ({ ...msg, isRead: true })) || []
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading notifications...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
        </div>
        
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead} variant="outline" size="sm">
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={filter === 'ALL' ? 'default' : 'outline'}
          onClick={() => setFilter('ALL')}
          size="sm"
        >
          All
        </Button>
        <Button
          variant={filter === 'UNREAD' ? 'default' : 'outline'}
          onClick={() => setFilter('UNREAD')}
          size="sm"
        >
          Unread {unreadCount > 0 && `(${unreadCount})`}
        </Button>
      </div>

      {/* Messages List */}
      <div className="space-y-3">
        {!messages || messages.length === 0 ? (
          <Card className="p-12 text-center">
            <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No notifications</h3>
            <p className="text-muted-foreground mb-4">
              {filter === 'UNREAD' 
                ? "You're all caught up! No unread notifications."
                : "You don't have any notifications yet."}
            </p>
            <Link href="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
          </Card>
        ) : (
          messages.map((msg) => {
            const config = messageTypeConfig[msg.type as keyof typeof messageTypeConfig] || messageTypeConfig.REMINDER;
            const Icon = config.icon;
            
            return (
              <Card
                key={msg.id}
                className={cn(
                  'p-4 transition-all hover:shadow-md',
                  !msg.isRead && 'bg-blue-50/30 border-l-4 border-l-blue-500'
                )}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={cn('p-2 rounded-full', config.color)}>
                    <Icon className="h-5 w-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-sm">{msg.title}</h3>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {getRelativeTime(msg.createdAt)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">{msg.message}</p>
                    
                    {/* Badge Details */}
                    {msg.type === 'ACHIEVEMENT' && msg.metadata?.badgeName && (
                      <Link href="/dashboard/achievements">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-md text-xs font-medium hover:bg-yellow-200 transition-colors">
                          <span>{msg.metadata.badgeIcon}</span>
                          <span>{msg.metadata.badgeName}</span>
                          <span className="font-bold">+{msg.metadata.badgePoints} pts</span>
                        </div>
                      </Link>
                    )}
                    
                    {/* Streak Details */}
                    {msg.type === 'STREAK' && msg.metadata?.streakType && (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-800 rounded-md text-xs font-medium">
                        <TrendingUp className="h-3 w-3" />
                        <span>{msg.metadata.currentValue || msg.metadata.streakCount} day streak</span>
                      </div>
                    )}
                  </div>

                  {/* Mark as Read Button */}
                  {!msg.isRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead(msg.id)}
                      className="shrink-0"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Back to Dashboard */}
      {messages.length > 0 && (
        <div className="mt-8 text-center">
          <Link href="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
