/**
 * Badge Celebration Animation - Shows confetti and badge unlock animation
 */

'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/lib/db/schema';
import { BADGE_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { X, Trophy, Sparkles } from 'lucide-react';

interface BadgeCelebrationProps {
  badges: Badge[];
  isOpen: boolean;
  onClose: () => void;
}

export function BadgeCelebration({ badges, isOpen, onClose }: BadgeCelebrationProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [currentBadgeIndex, setCurrentBadgeIndex] = useState(0);

  useEffect(() => {
    if (isOpen && badges.length > 0) {
      setShowConfetti(true);
      setCurrentBadgeIndex(0);
    }
  }, [isOpen, badges]);

  if (!isOpen || badges.length === 0) return null;

  const currentBadge = badges[currentBadgeIndex];
  const tierColors = BADGE_COLORS[currentBadge.tier as keyof typeof BADGE_COLORS];

  const handleNext = () => {
    if (currentBadgeIndex < badges.length - 1) {
      setCurrentBadgeIndex(currentBadgeIndex + 1);
    } else {
      onClose();
    }
  };

  const handleDotClick = (index: number) => {
    setCurrentBadgeIndex(index);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      {/* Confetti particles */}
      {showConfetti && <ConfettiEffect />}
      
      {/* Badge unlock modal */}
      <div className="relative w-full max-w-md mx-4 animate-in zoom-in-95 duration-500">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Card */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl p-8 text-center">
          {/* Trophy icon */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Trophy className="w-16 h-16 text-yellow-500 animate-bounce" />
              <Sparkles className="w-6 h-6 text-yellow-400 absolute -top-2 -right-2 animate-pulse" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            🎉 Achievement Unlocked!
          </h2>
          
          {/* Badge count indicator */}
          {badges.length > 1 && (
            <p className="text-sm text-gray-600 mb-4">
              {currentBadgeIndex + 1} of {badges.length} badges
            </p>
          )}

          {/* Badge display */}
          <div className="my-8 animate-in zoom-in duration-700">
            {/* Badge icon with glow effect */}
            <div className="relative inline-block">
              <div className={cn(
                'absolute inset-0 blur-2xl opacity-50 rounded-full',
                tierColors.bg
              )} />
              <div className="relative text-8xl drop-shadow-2xl">
                {currentBadge.icon}
              </div>
            </div>

            {/* Badge name */}
            <h3 className="text-2xl font-bold text-gray-900 mt-6 mb-2">
              {currentBadge.name}
            </h3>

            {/* Tier badge */}
            <span className={cn(
              'inline-block px-4 py-1 rounded-full text-sm font-bold mb-3',
              tierColors.bg,
              tierColors.text
            )}>
              {currentBadge.tier}
            </span>

            {/* Description */}
            <p className="text-gray-600 max-w-sm mx-auto mb-4">
              {currentBadge.description}
            </p>

            {/* Points */}
            <div className="inline-flex items-center gap-2 bg-yellow-50 text-yellow-700 px-4 py-2 rounded-full font-bold">
              <Sparkles className="w-4 h-4" />
              <span>+{currentBadge.points} Points</span>
            </div>
          </div>

          {/* Progress dots for multiple badges */}
          {badges.length > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {badges.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleDotClick(index)}
                  className={cn(
                    'h-2 rounded-full transition-all hover:bg-yellow-400',
                    index === currentBadgeIndex
                      ? 'bg-yellow-500 w-8'
                      : 'bg-gray-300 w-2'
                  )}
                  aria-label={`View badge ${index + 1}`}
                />
              ))}
            </div>
          )}

          {/* Close button */}
          <button
            onClick={handleNext}
            className="mt-6 w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold py-3 px-6 rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all transform hover:scale-105 shadow-lg"
          >
            {badges.length > 1 && currentBadgeIndex < badges.length - 1
              ? 'Next Badge'
              : 'Awesome!'}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Confetti particles animation
 */
function ConfettiEffect() {
  const colors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-orange-500',
  ];

  // Generate 50 confetti particles
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    color: colors[Math.floor(Math.random() * colors.length)],
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 3}s`,
    duration: `${3 + Math.random() * 2}s`,
    size: Math.random() > 0.5 ? 'w-2 h-2' : 'w-3 h-3',
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={cn(
            'absolute rounded-full',
            particle.color,
            particle.size
          )}
          style={{
            left: particle.left,
            top: '-20px',
            animation: `confetti-fall ${particle.duration} ${particle.delay} ease-out forwards`,
          }}
        />
      ))}

      <style jsx>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
