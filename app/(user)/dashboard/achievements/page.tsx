'use client';

import { useState, useEffect } from 'react';
import { BadgeCard } from '@/components/badges/BadgeCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Search, Trophy, Award, TrendingUp, X } from 'lucide-react';
import type { Badge } from '@/lib/db/schema';
import { BADGE_COLORS } from '@/lib/constants';

interface BadgeWithProgress {
  badge: Badge;
  earned: boolean;
  earnedAt?: Date;
  progress: number;
  currentValue: number;
  targetValue: number;
}

interface BadgeStats {
  totalBadges: number;
  earnedBadges: number;
  totalPoints: number;
  completionRate: number;
  badgesByTier: {
    BRONZE: number;
    SILVER: number;
    GOLD: number;
    PLATINUM: number;
  };
  badgesByCategory: Record<string, { total: number; earned: number }>;
}

export default function AchievementsPage() {
  const [badges, setBadges] = useState<BadgeWithProgress[]>([]);
  const [stats, setStats] = useState<BadgeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'EARNED' | 'LOCKED'>('ALL');
  const [selectedBadge, setSelectedBadge] = useState<BadgeWithProgress | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    try {
      setLoading(true);
      const [earnedRes, progressRes] = await Promise.all([
        fetch('/api/badges/user'),
        fetch('/api/badges/progress'),
      ]);

      if (!earnedRes.ok || !progressRes.ok) {
        throw new Error('Failed to fetch badges');
      }

      const earnedData = await earnedRes.json();
      const progressData = await progressRes.json();

      // Combine earned and progress data
      const earnedMap = new Map<string, { earned: true; earnedAt: Date }>(
        earnedData.data.badges.map((item: any) => [
          item.badge.id,
          { earned: true, earnedAt: new Date(item.userBadge.earnedAt) },
        ])
      );

      const allBadges: BadgeWithProgress[] = progressData.data.map((item: any) => ({
        badge: item.badge,
        earned: earnedMap.has(item.badge.id),
        earnedAt: earnedMap.get(item.badge.id)?.earnedAt,
        progress: item.progress,
        currentValue: item.currentValue,
        targetValue: item.targetValue,
      }));

      // Sort: earned first (by date desc), then by progress desc
      allBadges.sort((a, b) => {
        if (a.earned && !b.earned) return -1;
        if (!a.earned && b.earned) return 1;
        if (a.earned && b.earned) {
          return (b.earnedAt?.getTime() || 0) - (a.earnedAt?.getTime() || 0);
        }
        return b.progress - a.progress;
      });

      setBadges(allBadges);

      // Calculate stats
      const earnedBadges = allBadges.filter((b) => b.earned);
      const totalPoints = earnedBadges.reduce((sum, b) => sum + b.badge.points, 0);
      
      const badgesByTier = {
        BRONZE: earnedBadges.filter((b) => b.badge.tier === 'BRONZE').length,
        SILVER: earnedBadges.filter((b) => b.badge.tier === 'SILVER').length,
        GOLD: earnedBadges.filter((b) => b.badge.tier === 'GOLD').length,
        PLATINUM: earnedBadges.filter((b) => b.badge.tier === 'PLATINUM').length,
      };

      const categories = Array.from(new Set(allBadges.map((b) => b.badge.category)));
      const badgesByCategory: Record<string, { total: number; earned: number }> = {};
      categories.forEach((cat) => {
        const total = allBadges.filter((b) => b.badge.category === cat).length;
        const earned = earnedBadges.filter((b) => b.badge.category === cat).length;
        badgesByCategory[cat] = { total, earned };
      });

      setStats({
        totalBadges: allBadges.length,
        earnedBadges: earnedBadges.length,
        totalPoints,
        completionRate: (earnedBadges.length / allBadges.length) * 100,
        badgesByTier,
        badgesByCategory,
      });
    } catch (error) {
      console.error('Failed to fetch badges:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter badges
  const filteredBadges = badges.filter((item) => {
    // Search filter
    if (searchQuery && !item.badge.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Category filter
    if (selectedCategory !== 'ALL' && item.badge.category !== selectedCategory) {
      return false;
    }

    // Tier filter
    if (selectedTier !== 'ALL' && item.badge.tier !== selectedTier) {
      return false;
    }

    // Status filter
    if (statusFilter === 'EARNED' && !item.earned) {
      return false;
    }
    if (statusFilter === 'LOCKED' && item.earned) {
      return false;
    }

    return true;
  });

  const categories = ['ALL', 'VOLUME', 'STREAK', 'PROFIT', 'CONSISTENCY', 'SOP', 'PERFORMANCE', 'SPECIAL'];
  const tiers = ['ALL', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];

  const handleBadgeClick = (badgeItem: BadgeWithProgress) => {
    setSelectedBadge(badgeItem);
    setShowDetailModal(true);
  };

  const formatRequirement = (badge: Badge) => {
    try {
      const req = typeof badge.requirement === 'string' 
        ? JSON.parse(badge.requirement) 
        : badge.requirement;
      
      const { type, value } = req;
      
      switch (type) {
        case 'TOTAL_TRADES':
          return `Complete ${value.toLocaleString()} trades`;
        case 'WIN_STREAK':
          return `Achieve ${value} consecutive winning days`;
        case 'LOG_STREAK':
          return `Log trades for ${value} consecutive days`;
        case 'SOP_STREAK':
          return `${value} consecutive SOP-compliant trades`;
        case 'SOP_RATE':
          return `Maintain ${value}% SOP compliance rate`;
        case 'WIN_RATE':
          return `Achieve ${value}% win rate`;
        case 'PROFIT_TOTAL':
          return `Earn $${value.toLocaleString()} total profit`;
        case 'SESSION_TRADES':
          return `Complete ${value} trades in ${req.session} session`;
        case 'PERFECT_MONTH':
          return 'Win every day in a calendar month';
        case 'COMEBACK':
          return 'Turn a losing day into a winning day';
        case 'MAX_TRADES_DAY':
          return `Complete ${value} trades in a single day`;
        case 'TOTAL_LOGGING_DAYS':
          return `Log trades on ${value} total days`;
        case 'TARGET_COMPLETED':
          return 'Complete a performance target';
        case 'EARLY_ADOPTER':
          return 'Join during beta period';
        default:
          return 'Complete special requirement';
      }
    } catch {
      return 'Special achievement';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading achievements...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Trophy className="h-8 w-8 text-yellow-500" />
        <div>
          <h1 className="text-3xl font-bold">Achievements</h1>
          <p className="text-muted-foreground">Track your trading milestones and earn badges</p>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <Award className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Badges Earned</p>
                <p className="text-2xl font-bold">
                  {stats.earnedBadges} / {stats.totalBadges}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Points</p>
                <p className="text-2xl font-bold">{stats.totalPoints.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Completion</p>
                <p className="text-2xl font-bold">{stats.completionRate.toFixed(1)}%</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">By Tier</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-orange-500" />
                  <span>Bronze: {stats.badgesByTier.BRONZE}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-gray-400" />
                  <span>Silver: {stats.badgesByTier.SILVER}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span>Gold: {stats.badgesByTier.GOLD}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-cyan-400" />
                  <span>Platinum: {stats.badgesByTier.PLATINUM}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search badges..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Status Tabs */}
          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="ALL">All Badges</TabsTrigger>
              <TabsTrigger value="EARNED">Earned ({stats?.earnedBadges || 0})</TabsTrigger>
              <TabsTrigger value="LOCKED">Locked ({(stats?.totalBadges || 0) - (stats?.earnedBadges || 0)})</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Category Filter */}
          <div>
            <p className="text-sm font-medium mb-2">Category</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                  {cat !== 'ALL' && stats?.badgesByCategory[cat] && (
                    <span className="ml-1 text-xs opacity-70">
                      ({stats.badgesByCategory[cat].earned}/{stats.badgesByCategory[cat].total})
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </div>

          {/* Tier Filter */}
          <div>
            <p className="text-sm font-medium mb-2">Tier</p>
            <div className="flex flex-wrap gap-2">
              {tiers.map((tier) => (
                <Button
                  key={tier}
                  variant={selectedTier === tier ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTier(tier)}
                >
                  {tier}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Badge Gallery */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {filteredBadges.length} Badge{filteredBadges.length !== 1 ? 's' : ''}
          </h2>
        </div>

        {filteredBadges.length === 0 ? (
          <Card className="p-12 text-center">
            <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No badges found</h3>
            <p className="text-muted-foreground">Try adjusting your filters</p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredBadges.map((item) => (
              <BadgeCard
                key={item.badge.id}
                badge={item.badge}
                earned={item.earned}
                earnedAt={item.earnedAt?.toISOString()}
                progress={item.progress}
                size="lg"
                onClick={() => handleBadgeClick(item)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Badge Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-md">
          {selectedBadge && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span className="text-4xl">{selectedBadge.badge.icon}</span>
                  <div>
                    <div>{selectedBadge.badge.name}</div>
                    <div className="text-sm font-normal text-muted-foreground">
                      {selectedBadge.badge.tier} • {selectedBadge.badge.points} points
                    </div>
                  </div>
                </DialogTitle>
                <DialogDescription>
                  {selectedBadge.badge.description}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {/* Status */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <span className="font-medium">Status</span>
                  <span className={selectedBadge.earned ? 'text-green-600 font-semibold' : 'text-gray-500'}>
                    {selectedBadge.earned ? '✓ Earned' : '🔒 Locked'}
                  </span>
                </div>

                {/* Earned Date */}
                {selectedBadge.earned && selectedBadge.earnedAt && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                    <span className="font-medium">Earned On</span>
                    <span className="text-sm">
                      {new Date(selectedBadge.earnedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                )}

                {/* Requirement */}
                <div className="p-3 rounded-lg bg-muted">
                  <div className="font-medium mb-2">Requirement</div>
                  <div className="text-sm text-muted-foreground">
                    {formatRequirement(selectedBadge.badge)}
                  </div>
                </div>

                {/* Progress */}
                {!selectedBadge.earned && (
                  <div className="p-3 rounded-lg bg-muted">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Progress</span>
                      <span className="text-sm font-semibold">
                        {Math.round(selectedBadge.progress)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-300 rounded-full h-2.5 mb-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2.5 rounded-full transition-all"
                        style={{ width: `${Math.min(selectedBadge.progress, 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {selectedBadge.currentValue.toLocaleString()} / {selectedBadge.targetValue.toLocaleString()}
                    </div>
                  </div>
                )}

                {/* Category */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <span className="font-medium">Category</span>
                  <span className="text-sm font-semibold">{selectedBadge.badge.category}</span>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Category Progress */}
      {stats && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Category Progress</h2>
          <div className="space-y-4">
            {Object.entries(stats.badgesByCategory).map(([category, data]) => {
              const progress = (data.earned / data.total) * 100;
              return (
                <div key={category}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{category}</span>
                    <span className="text-sm text-muted-foreground">
                      {data.earned} / {data.total}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
