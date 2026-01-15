/**
 * Badge Component - Display achievement badge with locked/unlocked states
 */

import { Badge as BadgeType } from '@/lib/db/schema';
import { BADGE_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface BadgeProps {
  badge: BadgeType;
  earned?: boolean;
  earnedAt?: string;
  progress?: number; // 0-100 for locked badges
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  onClick?: () => void;
}

export function BadgeCard({ 
  badge, 
  earned = false, 
  earnedAt,
  progress = 0,
  size = 'md',
  showProgress = true,
  onClick 
}: BadgeProps) {
  const tierColors = earned ? BADGE_COLORS[badge.tier as keyof typeof BADGE_COLORS] : BADGE_COLORS.LOCKED;
  
  const sizeClasses = {
    sm: 'w-20 h-24 text-xs',
    md: 'w-28 h-32 text-sm',
    lg: 'w-36 h-40 text-base',
  };
  
  const iconSizes = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-5xl',
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center justify-between p-3 rounded-lg border-2 transition-all',
        tierColors.bg,
        tierColors.border,
        'glow' in tierColors && tierColors.glow,
        sizeClasses[size],
        onClick && 'cursor-pointer hover:scale-105 hover:shadow-lg',
        !earned && 'opacity' in tierColors && tierColors.opacity
      )}
    >
      {/* Badge Icon */}
      <div className={cn('flex items-center justify-center', iconSizes[size])}>
        <span className="filter" style={{ filter: !earned ? 'grayscale(100%)' : 'none' }}>
          {badge.icon}
        </span>
      </div>
      
      {/* Badge Name */}
      <div className={cn('text-center font-semibold', tierColors.text)}>
        {badge.name}
      </div>
      
      {/* Badge Tier */}
      <div className={cn('text-xs uppercase font-medium', tierColors.text, 'opacity-70')}>
        {badge.tier}
      </div>
      
      {/* Progress Bar (for locked badges) */}
      {!earned && showProgress && progress > 0 && (
        <div className="absolute bottom-1 left-2 right-2">
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className={cn('h-1.5 rounded-full transition-all', tierColors.border.replace('border', 'bg'))}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <div className="text-xs text-center mt-0.5 text-gray-600">
            {Math.round(progress)}%
          </div>
        </div>
      )}
      
      {/* Earned indicator */}
      {earned && (
        <div className="absolute top-1 right-1">
          <span className="text-green-600 text-lg">✓</span>
        </div>
      )}
      
      {/* Lock icon for locked badges */}
      {!earned && progress < 100 && (
        <div className="absolute top-1 right-1">
          <span className="text-gray-400 text-sm">🔒</span>
        </div>
      )}
      
      {/* Points */}
      <div className={cn(
        'absolute top-1 left-1 text-xs font-bold px-1.5 py-0.5 rounded',
        earned ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-500'
      )}>
        {badge.points}
      </div>
    </div>
  );
}

/**
 * Badge Detail Tooltip/Modal Content
 */
interface BadgeDetailProps {
  badge: BadgeType;
  earned?: boolean;
  earnedAt?: string;
  progress?: number;
  current?: number;
  target?: number;
}

export function BadgeDetail({ badge, earned, earnedAt, progress, current, target }: BadgeDetailProps) {
  const tierColors = earned ? BADGE_COLORS[badge.tier as keyof typeof BADGE_COLORS] : BADGE_COLORS.LOCKED;
  
  return (
    <div className="space-y-4">
      {/* Badge Icon Large */}
      <div className="flex justify-center">
        <div
          className={cn(
            'flex items-center justify-center w-24 h-24 rounded-full text-6xl',
            tierColors.bg,
            tierColors.border,
            'border-4',
            !earned && 'opacity-50 grayscale'
          )}
        >
          {badge.icon}
        </div>
      </div>
      
      {/* Badge Info */}
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold">{badge.name}</h3>
        <p className={cn('text-sm uppercase font-semibold', tierColors.text)}>
          {badge.tier} • {badge.category}
        </p>
        <p className="text-gray-600">{badge.description}</p>
      </div>
      
      {/* Status */}
      <div className="border-t pt-4">
        {earned ? (
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center gap-2 text-green-600">
              <span className="text-2xl">✓</span>
              <span className="font-semibold">Unlocked</span>
            </div>
            {earnedAt && (
              <p className="text-sm text-gray-500">
                Earned on {new Date(earnedAt).toLocaleDateString()}
              </p>
            )}
            <p className="text-lg font-bold text-yellow-600">
              +{badge.points} points
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-gray-500">
              <span className="text-2xl">🔒</span>
              <span className="font-semibold">Locked</span>
            </div>
            
            {progress !== undefined && progress > 0 && (
              <>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span className="font-semibold">{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={cn('h-3 rounded-full transition-all', tierColors.border.replace('border', 'bg'))}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>
                
                {current !== undefined && target !== undefined && (
                  <p className="text-sm text-center text-gray-600">
                    {current} / {target}
                  </p>
                )}
              </>
            )}
            
            <p className="text-sm text-center text-gray-500">
              Earn <span className="font-bold text-yellow-600">{badge.points} points</span> when unlocked
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
