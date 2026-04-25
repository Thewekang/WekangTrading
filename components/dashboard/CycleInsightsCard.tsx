'use client';

import type { CycleStatus } from '@/lib/services/accountRulesService';
import { Lightbulb, Target, TrendingUp, AlertTriangle, PartyPopper, Info, ShieldCheck } from 'lucide-react';

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
// Insight model
// ─────────────────────────────────────────────────────────────────────────────

type InsightType = 'warning' | 'tip' | 'info' | 'success';

interface Insight {
  type: InsightType;
  icon: React.ReactNode;
  title: string;
  /** The single most actionable number/range shown prominently */
  keyFigure?: { label: string; value: string };
  lines: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Insight computation (pure math — no API)
// ─────────────────────────────────────────────────────────────────────────────

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
    const requiredTotal = bestDayCyclePnl / targetRatio;
    const additionalNeeded = Math.max(0, requiredTotal - currentCyclePnl);
    // Max earn on ONE day without failing: X/(T+X) ≤ target → X ≤ target/(1−target) × T
    const maxSafeNewBestDay = (targetRatio / (1 - targetRatio)) * currentCyclePnl;

    if (consistencyStatus === 'FAIL') {
      // Single-session fix
      if (additionalNeeded > 0 && maxSafeNewBestDay >= additionalNeeded) {
        insights.push({
          type: 'warning',
          icon: <AlertTriangle className="h-4 w-4" />,
          title: 'Fix Consistency — Today',
          keyFigure: {
            label: 'Safe earn range',
            value: `${additionalNeeded.toFixed(2)} – ${maxSafeNewBestDay.toFixed(2)} ${currency}`,
          },
          lines: [
            `Earning within this range today resolves the ${consistencyTargetPct}% rule in one session, without creating a new peak day.`,
          ],
        });
      }

      // Multi-day fix
      if (additionalNeeded > 0) {
        const cappedDaily = Math.min(avgDailyPnl ?? bestDayCyclePnl, bestDayCyclePnl);
        const daysToFix = cappedDaily > 0 ? Math.ceil(additionalNeeded / cappedDaily) : null;
        insights.push({
          type: 'tip',
          icon: <TrendingUp className="h-4 w-4" />,
          title: 'Fix Consistency — Multi-Day',
          keyFigure: daysToFix
            ? { label: 'Est. days needed', value: `≈${daysToFix} day${daysToFix !== 1 ? 's' : ''}` }
            : undefined,
          lines: [
            `Need ${fmtUsdAbs(additionalNeeded, currency)} more in cycle P&L. Spread it evenly across sessions.`,
            `Keep each day under ${fmtUsdAbs(bestDayCyclePnl, currency)} (your current best day) so no new peak is created.`,
          ],
        });
      }
    } else if (consistencyStatus === 'PASS' && maxSafeNewBestDay > 0) {
      // Daily cap to stay compliant
      insights.push({
        type: 'info',
        icon: <ShieldCheck className="h-4 w-4" />,
        title: 'Daily Cap — Stay Consistent',
        keyFigure: {
          label: 'Max safe day',
          value: fmtUsdAbs(maxSafeNewBestDay, currency),
        },
        lines: [
          `Earning more than this in a single session would break the ${consistencyTargetPct}% rule.`,
          `Current best day: ${fmtUsdAbs(bestDayCyclePnl, currency)}.`,
        ],
      });
    }
  }

  // ── Suggested minimum target when no explicit target is set ──
  if ((!cycleTargetProfitUsd || cycleTargetProfitUsd <= 0) && consistencyTargetPct != null && consistencyTargetPct > 0 && bestDayCyclePnl > 0) {
    const targetRatio = consistencyTargetPct / 100;
    const minTargetRequired = bestDayCyclePnl / targetRatio;
    const stillNeeded = Math.max(0, minTargetRequired - currentCyclePnl);
    const pctOfMin =
      currentCyclePnl > 0 ? Math.min(100, (currentCyclePnl / minTargetRequired) * 100) : 0;

    const sugLines: string[] = [
      `Your best day is ${fmtUsdAbs(bestDayCyclePnl, currency)}. With the ${consistencyTargetPct}% rule, cycle total must reach at least ${fmtUsdAbs(minTargetRequired, currency)}.`,
    ];
    if (stillNeeded > 0) {
      sugLines.push(
        `You are ${fmtUsdAbs(stillNeeded, currency)} away from this minimum (${pctOfMin.toFixed(0)}% there).`,
      );
      if (avgDailyPnl && avgDailyPnl > 0) {
        const daysToMin = Math.ceil(stillNeeded / avgDailyPnl);
        sugLines.push(
          `At your current pace (${fmtUsdAbs(avgDailyPnl, currency)}/day) you'd hit it in ≈${daysToMin} day${daysToMin !== 1 ? 's' : ''}.`,
        );
      }
    } else {
      sugLines.push(`You have already surpassed this minimum — consistency rule is satisfied.`);
    }
    sugLines.push('Consider setting this as your profit target in account rules.');

    insights.push({
      type: stillNeeded <= 0 ? 'success' : 'info',
      icon:
        stillNeeded <= 0 ? (
          <ShieldCheck className="h-4 w-4" />
        ) : (
          <Target className="h-4 w-4" />
        ),
      title: 'Suggested Profit Target',
      keyFigure: {
        label: 'Min target for consistency',
        value: fmtUsdAbs(minTargetRequired, currency),
      },
      lines: sugLines,
    });
  }

  // ── Target profit insights ──
  if (cycleTargetProfitUsd && cycleTargetProfitUsd > 0) {
    const remaining = cycleTargetProfitUsd - currentCyclePnl;

    if (remaining <= 0) {
      insights.push({
        type: 'success',
        icon: <PartyPopper className="h-4 w-4" />,
        title: '🎉 Profit Target Reached!',
        keyFigure: { label: 'Cycle earned', value: fmtUsd(currentCyclePnl, currency) },
        lines: [
          `You've hit the ${fmtUsdAbs(cycleTargetProfitUsd, currency)} goal. Consider recording a withdrawal to start a fresh cycle.`,
        ],
      });
    } else {
      const daysToTarget =
        avgDailyPnl && avgDailyPnl > 0 ? Math.ceil(remaining / avgDailyPnl) : null;
      const lines: string[] = [];

      if (avgDailyPnl && avgDailyPnl > 0) {
        lines.push(`Averaging ${fmtUsdAbs(avgDailyPnl, currency)}/day this cycle.`);
        if (dailyDrawdownLimitUsd && avgDailyPnl > dailyDrawdownLimitUsd) {
          lines.push(
            `Your daily DD limit (${fmtUsdAbs(dailyDrawdownLimitUsd, currency)}) is tight vs your pace — trade carefully.`,
          );
        }
      } else {
        lines.push('Build consistent cycle profit to project your target pace.');
      }

      if (consistencyTargetPct != null && consistencyStatus === 'FAIL') {
        lines.push(`Prioritise fixing the consistency rule — rushing with one big day will deepen the violation.`);
      }

      insights.push({
        type: 'info',
        icon: <Target className="h-4 w-4" />,
        title: 'Days to Profit Target',
        keyFigure: daysToTarget
          ? { label: 'Est. days remaining', value: `≈${daysToTarget} day${daysToTarget !== 1 ? 's' : ''}` }
          : { label: 'Still needed', value: fmtUsdAbs(remaining, currency) },
        lines,
      });
    }
  }

  return insights;
}

// ─────────────────────────────────────────────────────────────────────────────
// Style maps
// ─────────────────────────────────────────────────────────────────────────────

const TYPE_STYLES: Record<InsightType, {
  border: string;
  headerBg: string;
  iconColor: string;
  titleColor: string;
  bodyBg: string;
  bodyText: string;
  figureText: string;
  figureBg: string;
}> = {
  warning: {
    border: 'border-l-4 border-l-red-500',
    headerBg: 'bg-red-50',
    iconColor: 'text-red-500',
    titleColor: 'text-red-800',
    bodyBg: 'bg-white',
    bodyText: 'text-gray-600',
    figureText: 'text-red-700',
    figureBg: 'bg-red-50',
  },
  tip: {
    border: 'border-l-4 border-l-amber-500',
    headerBg: 'bg-amber-50',
    iconColor: 'text-amber-500',
    titleColor: 'text-amber-800',
    bodyBg: 'bg-white',
    bodyText: 'text-gray-600',
    figureText: 'text-amber-700',
    figureBg: 'bg-amber-50',
  },
  info: {
    border: 'border-l-4 border-l-blue-500',
    headerBg: 'bg-blue-50',
    iconColor: 'text-blue-500',
    titleColor: 'text-blue-800',
    bodyBg: 'bg-white',
    bodyText: 'text-gray-600',
    figureText: 'text-blue-700',
    figureBg: 'bg-blue-50',
  },
  success: {
    border: 'border-l-4 border-l-green-500',
    headerBg: 'bg-green-50',
    iconColor: 'text-green-500',
    titleColor: 'text-green-800',
    bodyBg: 'bg-white',
    bodyText: 'text-gray-600',
    figureText: 'text-green-700',
    figureBg: 'bg-green-50',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function InsightCard({ insight }: { insight: Insight }) {
  const s = TYPE_STYLES[insight.type];
  return (
    <div className={`rounded-lg border border-gray-200 overflow-hidden shadow-sm ${insight.type === 'warning' ? 'ring-1 ring-red-200' : ''}`}>
      {/* Header strip */}
      <div className={`flex items-center gap-2 px-4 py-2.5 ${s.headerBg} ${s.border}`}>
        <span className={s.iconColor}>{insight.icon}</span>
        <span className={`text-xs font-bold tracking-wide ${s.titleColor}`}>{insight.title}</span>
      </div>

      {/* Body */}
      <div className={`px-4 py-3 space-y-2.5 ${s.bodyBg}`}>
        {/* Key figure */}
        {insight.keyFigure && (
          <div className={`inline-flex items-baseline gap-2 rounded-md px-3 py-1.5 ${s.figureBg}`}>
            <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
              {insight.keyFigure.label}
            </span>
            <span className={`text-base font-bold ${s.figureText}`}>
              {insight.keyFigure.value}
            </span>
          </div>
        )}

        {/* Explanation lines */}
        <ul className="space-y-1">
          {insight.lines.map((line, j) => (
            <li key={j} className={`flex items-start gap-1.5 text-xs leading-relaxed ${s.bodyText}`}>
              <span className="mt-0.5 shrink-0 text-gray-300">•</span>
              {line}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main card
// ─────────────────────────────────────────────────────────────────────────────

export function CycleInsightsCard({
  status,
  currency = 'USD',
  cycleStartFallback,
  onRecordWithdrawal,
}: CycleInsightsCardProps) {
  const insights = computeInsights(status, currency, cycleStartFallback);

  const hasTarget = status.cycleTargetProfitUsd != null && status.cycleTargetProfitUsd > 0;
  const progress = Math.min(status.cycleProgressPct ?? 0, 100);
  const isReached = status.targetReached;
  const remaining = hasTarget ? Math.max(0, status.cycleTargetProfitUsd! - status.currentCyclePnl) : null;

  if (insights.length === 0 && !hasTarget) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Card header */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-white">
        <div className="p-1.5 bg-amber-100 rounded-lg">
          <Lightbulb className="h-4 w-4 text-amber-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">Cycle Insights</h3>
          <p className="text-xs text-gray-400">Smart guidance based on your current cycle data</p>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* ── Progress section ── */}
        {hasTarget && (
          <div className={`rounded-lg p-4 space-y-3 ${isReached ? 'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200' : 'bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isReached
                  ? <PartyPopper className="h-4 w-4 text-green-600" />
                  : <Target className="h-4 w-4 text-blue-600" />}
                <span className="text-sm font-semibold text-gray-800">Cycle Profit Target</span>
              </div>
              <span className={`text-lg font-bold ${isReached ? 'text-green-700' : 'text-blue-700'}`}>
                {progress.toFixed(1)}%
              </span>
            </div>

            {/* Progress bar with gradient fill */}
            <div className="relative">
              <div className="w-full h-3 bg-white/70 rounded-full overflow-hidden shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${isReached
                    ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                    : 'bg-gradient-to-r from-blue-400 to-indigo-500'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Earned</p>
                <p className={`text-sm font-bold ${status.currentCyclePnl >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                  {fmtUsd(status.currentCyclePnl, currency)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Remaining</p>
                <p className="text-sm font-bold text-gray-700">
                  {remaining != null ? fmtUsdAbs(remaining, currency) : '—'}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Target</p>
                <p className="text-sm font-bold text-gray-700">
                  {fmtUsdAbs(status.cycleTargetProfitUsd!, currency)}
                </p>
              </div>
            </div>

            {isReached && onRecordWithdrawal && (
              <button
                onClick={onRecordWithdrawal}
                className="w-full text-center text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 transition-colors rounded-md py-1.5"
              >
                Record withdrawal to start new cycle →
              </button>
            )}
          </div>
        )}

        {/* ── Insight cards ── */}
        {insights.length > 0 && (
          <div className="space-y-3">
            {insights.map((insight, i) => (
              <InsightCard key={i} insight={insight} />
            ))}
          </div>
        )}

        {insights.length === 0 && hasTarget && (
          <p className="text-xs text-gray-400 text-center py-2">
            Trade a few sessions to unlock personalised insights.
          </p>
        )}
      </div>
    </div>
  );
}
