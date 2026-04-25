'use client';

import type { CycleStatus } from '@/lib/services/accountRulesService';
import { Lightbulb, Target, TrendingUp, AlertTriangle, CheckCircle, PartyPopper, Info } from 'lucide-react';

interface CycleInsightsCardProps {
  status: CycleStatus;
  currency?: string;
  /** Fallback start date (account.createdAt) when no withdrawal exists */
  cycleStartFallback?: Date;
  onRecordWithdrawal?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function fmtUsd(val: number, currency: string) {
  return `${val >= 0 ? '+' : ''}${val.toFixed(2)} ${currency}`;
}

function fmtUsdAbs(val: number, currency: string) {
  return `${val.toFixed(2)} ${currency}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Insight computation (pure math — no API)
// ─────────────────────────────────────────────────────────────────────────────

interface Insight {
  type: 'warning' | 'tip' | 'info' | 'success';
  icon: React.ReactNode;
  title: string;
  lines: string[];
}

function computeInsights(
  status: CycleStatus,
  currency: string,
  cycleStartFallback?: Date,
): Insight[] {
  const {
    currentCyclePnl,
    bestDayCyclePnl,
    consistencyTargetPct,
    consistencyStatus,
    cycleTargetProfitUsd,
    cycleStartDate,
    dailyDrawdownLimitUsd,
  } = status;

  const insights: Insight[] = [];

  // ── Average daily P&L from cycle start ──
  const now = new Date();
  const startDate = cycleStartDate ?? cycleStartFallback ?? null;
  const rawDays = startDate
    ? Math.round((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const daysInCycle = rawDays != null ? Math.max(1, rawDays) : null;
  const avgDailyPnl = daysInCycle && currentCyclePnl > 0 ? currentCyclePnl / daysInCycle : null;

  // ── Consistency insights ──
  if (consistencyTargetPct != null && consistencyTargetPct > 0 && currentCyclePnl > 0) {
    const targetRatio = consistencyTargetPct / 100;

    // Minimum cycle total required for consistency to pass (given current bestDay)
    const requiredTotal = bestDayCyclePnl / targetRatio;
    const additionalNeeded = Math.max(0, requiredTotal - currentCyclePnl);

    // Maximum you can earn on ONE day and still pass consistency (that day becomes new best day)
    // Derivation: X / (T + X) ≤ target → X ≤ target / (1−target) × T
    const maxSafeNewBestDay =
      currentCyclePnl > 0 ? (targetRatio / (1 - targetRatio)) * currentCyclePnl : 0;

    if (consistencyStatus === 'FAIL') {
      // ── One-session fix ──
      // Earn between additionalNeeded (keep old best) and maxSafeNewBestDay (new best, still passes)
      if (additionalNeeded > 0 && maxSafeNewBestDay >= additionalNeeded) {
        const lo = additionalNeeded;
        const hi = maxSafeNewBestDay;
        insights.push({
          type: 'warning',
          icon: <AlertTriangle className="h-4 w-4" />,
          title: 'Fix Consistency — Single Session',
          lines: [
            `Earn between ${fmtUsdAbs(lo, currency)} and ${fmtUsdAbs(hi, currency)} today to resolve the violation in one session.`,
            `This grows your cycle total past the ${consistencyTargetPct}% rule without creating a new worst day.`,
          ],
        });
      }

      // ── Multi-day fix ──
      if (additionalNeeded > 0) {
        const cappedDailyForFix = Math.min(avgDailyPnl ?? bestDayCyclePnl, bestDayCyclePnl);
        const daysToFix =
          cappedDailyForFix > 0 ? Math.ceil(additionalNeeded / cappedDailyForFix) : null;
        const lines: string[] = [
          `You need ${fmtUsdAbs(additionalNeeded, currency)} more cycle profit to pass the ${consistencyTargetPct}% consistency rule.`,
        ];
        if (daysToFix) {
          lines.push(
            `At your current pace, that takes ≈${daysToFix} trading day${daysToFix !== 1 ? 's' : ''} — spread gains evenly to avoid creating a new bigger best day.`,
          );
        }
        lines.push(
          `Keep each day under ${fmtUsdAbs(bestDayCyclePnl, currency)} (your current best day) while the total grows.`,
        );
        insights.push({
          type: 'tip',
          icon: <TrendingUp className="h-4 w-4" />,
          title: 'Fix Consistency — Multi-Day Path',
          lines,
        });
      }
    } else if (consistencyStatus === 'PASS' && maxSafeNewBestDay > 0) {
      // ── Daily cap to stay compliant ──
      insights.push({
        type: 'info',
        icon: <Info className="h-4 w-4" />,
        title: `Daily Cap to Stay Consistent`,
        lines: [
          `Keep each trading day under ${fmtUsdAbs(maxSafeNewBestDay, currency)} to maintain the ${consistencyTargetPct}% rule.`,
          `Your current best day is ${fmtUsdAbs(bestDayCyclePnl, currency)}.`,
        ],
      });
    }
  }

  // ── Target profit insights ──
  if (cycleTargetProfitUsd && cycleTargetProfitUsd > 0) {
    const remaining = cycleTargetProfitUsd - currentCyclePnl;

    if (remaining <= 0) {
      insights.push({
        type: 'success',
        icon: <PartyPopper className="h-4 w-4" />,
        title: 'Profit Target Reached!',
        lines: [
          `You've hit your ${fmtUsdAbs(cycleTargetProfitUsd, currency)} cycle target. Consider recording a withdrawal to start a fresh cycle.`,
        ],
      });
    } else {
      const lines: string[] = [
        `${fmtUsdAbs(remaining, currency)} remaining to reach your ${fmtUsdAbs(cycleTargetProfitUsd, currency)} target.`,
      ];

      if (avgDailyPnl && avgDailyPnl > 0) {
        const daysToTarget = Math.ceil(remaining / avgDailyPnl);
        lines.push(
          `At your cycle average of ${fmtUsdAbs(avgDailyPnl, currency)}/day, you should hit it in ≈${daysToTarget} more trading day${daysToTarget !== 1 ? 's' : ''}.`,
        );

        // Warn if daily DD cap is less than needed avg daily to hit target
        if (dailyDrawdownLimitUsd && avgDailyPnl > dailyDrawdownLimitUsd) {
          lines.push(
            `⚠️ Your daily drawdown limit (${fmtUsdAbs(dailyDrawdownLimitUsd, currency)}) is smaller than your average daily P&L pace — stay disciplined.`,
          );
        }
      } else if (currentCyclePnl <= 0) {
        lines.push(`Start building cycle profit to track your pace toward this goal.`);
      }

      // Cross-check: if consistency is failing AND target not reached, show priority note
      if (
        consistencyTargetPct != null &&
        consistencyStatus === 'FAIL' &&
        remaining > 0
      ) {
        lines.push(
          `Fix the consistency rule first — a large single-day profit to "rush" the target will deepen the violation.`,
        );
      }

      insights.push({
        type: 'info',
        icon: <Target className="h-4 w-4" />,
        title: 'Days to Profit Target',
        lines,
      });
    }
  }

  return insights;
}

// ─────────────────────────────────────────────────────────────────────────────
// Insight pill styles
// ─────────────────────────────────────────────────────────────────────────────

const INSIGHT_STYLES = {
  warning: {
    bg: 'bg-red-50 border-red-200',
    icon: 'text-red-500',
    title: 'text-red-800',
    text: 'text-red-700',
  },
  tip: {
    bg: 'bg-amber-50 border-amber-200',
    icon: 'text-amber-500',
    title: 'text-amber-800',
    text: 'text-amber-700',
  },
  info: {
    bg: 'bg-blue-50 border-blue-200',
    icon: 'text-blue-500',
    title: 'text-blue-800',
    text: 'text-blue-700',
  },
  success: {
    bg: 'bg-green-50 border-green-200',
    icon: 'text-green-500',
    title: 'text-green-800',
    text: 'text-green-700',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function CycleInsightsCard({
  status,
  currency = 'USD',
  cycleStartFallback,
  onRecordWithdrawal,
}: CycleInsightsCardProps) {
  const insights = computeInsights(status, currency, cycleStartFallback);

  // Compute progress bar values (same as old CycleProfitTargetCard)
  const hasTarget = status.cycleTargetProfitUsd != null && status.cycleTargetProfitUsd > 0;
  const progress = Math.min(status.cycleProgressPct ?? 0, 100);
  const isReached = status.targetReached;

  // If no consistency rule AND no target AND no insights → nothing to show
  if (insights.length === 0 && !hasTarget) return null;

  return (
    <div className="rounded-lg border bg-white p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-amber-500 shrink-0" />
        <h3 className="font-semibold text-gray-900">Cycle Insights</h3>
      </div>

      {/* Progress bar (if target set) */}
      {hasTarget && (
        <div className={`rounded-md border p-3 space-y-2 ${isReached ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">Cycle Profit Target</span>
            <span className={`font-semibold ${isReached ? 'text-green-700' : 'text-blue-700'}`}>
              {progress.toFixed(1)}%
            </span>
          </div>
          <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${isReached ? 'bg-green-500' : 'bg-blue-500'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>{fmtUsd(status.currentCyclePnl, currency)} earned</span>
            <span>Target: {fmtUsdAbs(status.cycleTargetProfitUsd!, currency)}</span>
          </div>
          {isReached && onRecordWithdrawal && (
            <button
              onClick={onRecordWithdrawal}
              className="text-green-700 underline underline-offset-2 hover:text-green-900 text-xs"
            >
              Record withdrawal →
            </button>
          )}
        </div>
      )}

      {/* Insight cards */}
      {insights.length > 0 && (
        <div className="space-y-3">
          {insights.map((insight, i) => {
            const s = INSIGHT_STYLES[insight.type];
            return (
              <div key={i} className={`rounded-md border p-3 ${s.bg}`}>
                <div className={`flex items-start gap-2 ${s.icon} mb-1`}>
                  {insight.icon}
                  <span className={`text-xs font-semibold ${s.title}`}>{insight.title}</span>
                </div>
                <ul className="space-y-0.5 pl-6">
                  {insight.lines.map((line, j) => (
                    <li key={j} className={`text-xs ${s.text}`}>
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      {/* No insights yet */}
      {insights.length === 0 && hasTarget && (
        <p className="text-xs text-gray-400 text-center">
          Trade a few sessions to generate personalized insights.
        </p>
      )}
    </div>
  );
}
