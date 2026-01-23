/**
 * Notification Service - Handle badge unlock and streak notifications
 */

import { db } from '@/lib/db';
import { motivationalMessages, type Badge, type Streak } from '@/lib/db/schema';
import { MESSAGE_TYPES } from '@/lib/constants';

interface NotificationMessage {
  userId: string;
  title: string;
  message: string;
  type: typeof MESSAGE_TYPES[keyof typeof MESSAGE_TYPES];
  metadata?: Record<string, any>;
}

/**
 * Create a notification message in the database
 */
export async function createNotification({
  userId,
  title,
  message,
  type,
  metadata = {},
}: NotificationMessage) {
  try {
    const notification = await db
      .insert(motivationalMessages)
      .values({
        userId,
        title,
        message,
        messageType: type,
        metadata: JSON.stringify(metadata),
        isRead: false,
      })
      .returning()
      .get();

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    throw error;
  }
}

/**
 * Create badge unlock notification
 */
export async function notifyBadgeUnlock(userId: string, badge: Badge) {
  const messages = [
    `🎉 Congratulations! You've earned the ${badge.name} badge!`,
    `🏆 Achievement Unlocked: ${badge.name}!`,
    `⭐ New Badge Earned: ${badge.name}!`,
    `🎊 You just unlocked ${badge.name}!`,
  ];

  const randomMessage = messages[Math.floor(Math.random() * messages.length)];

  return createNotification({
    userId,
    title: 'New Achievement!',
    message: randomMessage,
    type: MESSAGE_TYPES.ACHIEVEMENT,
    metadata: {
      badgeId: badge.id,
      badgeName: badge.name,
      badgeIcon: badge.icon,
      badgeTier: badge.tier,
      badgePoints: badge.points,
    },
  });
}

/**
 * Create streak milestone notification
 */
export async function notifyStreakMilestone(
  userId: string,
  streakType: 'WIN_STREAK' | 'LOG_STREAK' | 'SOP_STREAK',
  currentValue: number
) {
  const streakLabels = {
    WIN_STREAK: 'Winning Days',
    LOG_STREAK: 'Daily Logging',
    SOP_STREAK: 'SOP Compliance',
  };

  const streakEmojis = {
    WIN_STREAK: '🔥',
    LOG_STREAK: '📝',
    SOP_STREAK: '✅',
  };

  const messages = {
    WIN_STREAK: [
      `${streakEmojis.WIN_STREAK} Amazing! ${currentValue}-day winning streak!`,
      `${streakEmojis.WIN_STREAK} You're on fire! ${currentValue} consecutive winning days!`,
      `${streakEmojis.WIN_STREAK} Incredible streak! ${currentValue} days of wins!`,
    ],
    LOG_STREAK: [
      `${streakEmojis.LOG_STREAK} Consistency is key! ${currentValue} days logged!`,
      `${streakEmojis.LOG_STREAK} Great discipline! ${currentValue}-day logging streak!`,
      `${streakEmojis.LOG_STREAK} Keep it up! ${currentValue} consecutive days logged!`,
    ],
    SOP_STREAK: [
      `${streakEmojis.SOP_STREAK} Perfect execution! ${currentValue} SOP-compliant trades!`,
      `${streakEmojis.SOP_STREAK} Following the plan! ${currentValue}-trade SOP streak!`,
      `${streakEmojis.SOP_STREAK} Disciplined trading! ${currentValue} SOP trades in a row!`,
    ],
  };

  const messageArray = messages[streakType];
  const randomMessage = messageArray[Math.floor(Math.random() * messageArray.length)];

  return createNotification({
    userId,
    title: `${streakLabels[streakType]} Milestone!`,
    message: randomMessage,
    type: MESSAGE_TYPES.STREAK,
    metadata: {
      streakType,
      currentValue,
    },
  });
}

/**
 * Create performance milestone notification
 */
export async function notifyPerformanceMilestone(
  userId: string,
  milestone: 'PROFIT_TARGET' | 'WIN_RATE' | 'TRADE_COUNT',
  value: number
) {
  const milestones = {
    PROFIT_TARGET: {
      title: 'Profit Milestone!',
      message: `💰 Congratulations! You've reached $${value.toLocaleString()} in total profit!`,
    },
    WIN_RATE: {
      title: 'Win Rate Achievement!',
      message: `📈 Excellent! You've achieved a ${value}% win rate!`,
    },
    TRADE_COUNT: {
      title: 'Trading Milestone!',
      message: `📊 Milestone reached! ${value.toLocaleString()} trades completed!`,
    },
  };

  const { title, message } = milestones[milestone];

  return createNotification({
    userId,
    title,
    message,
    type: MESSAGE_TYPES.MILESTONE,
    metadata: {
      milestone,
      value,
    },
  });
}

/**
 * Create encouragement notification (for users struggling)
 */
export async function notifyEncouragement(userId: string, context: string) {
  const encouragements = [
    "💪 Keep going! Every great trader faces setbacks. Learn and improve!",
    "🌟 Don't give up! Consistency and discipline lead to success!",
    "🎯 Focus on the process, not just results. You're building skills!",
    "💡 Every loss is a lesson. Review, adjust, and come back stronger!",
    "🚀 Remember why you started. Stay committed to your trading plan!",
  ];

  const randomMessage = encouragements[Math.floor(Math.random() * encouragements.length)];

  return createNotification({
    userId,
    title: 'Stay Strong!',
    message: randomMessage,
    type: MESSAGE_TYPES.ENCOURAGEMENT,
    metadata: {
      context,
    },
  });
}

/**
 * Create celebration notification (for major achievements)
 */
export async function notifyCelebration(userId: string, achievement: string) {
  return createNotification({
    userId,
    title: '🎉 Celebration Time!',
    message: `Incredible achievement! ${achievement}`,
    type: MESSAGE_TYPES.CELEBRATION,
    metadata: {
      achievement,
    },
  });
}

/**
 * Create reminder notification
 */
export async function notifyReminder(userId: string, reminderText: string) {
  return createNotification({
    userId,
    title: 'Reminder',
    message: reminderText,
    type: MESSAGE_TYPES.REMINDER,
    metadata: {},
  });
}
