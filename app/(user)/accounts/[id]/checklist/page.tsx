import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ClipboardCheck } from 'lucide-react';
import { getAccount, getAccountRules } from '@/lib/services/tradingAccountService';
import {
  getOrCreateChecklist,
  getTodayHighImpactNews,
} from '@/lib/services/checklistService';
import { getLocalDateStr } from '@/lib/utils/dateUtils';
import { calculateMarketSession } from '@/lib/utils/marketSessions';
import { TradingDayChecklist } from '@/components/checklist/TradingDayChecklist';
import { CandleCloseHUD } from '@/components/checklist/CandleCloseHUD';
import type { ItemStates } from '@/lib/validations';
import type { TradingDayChecklist as TradingDayChecklistRow } from '@/lib/db/schema/checklist';

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ date?: string }> };

export default async function ChecklistPage({ params, searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const { id } = await params;
  const { date: dateParam } = await searchParams;

  const account = await getAccount(id, session.user.id).catch(() => null);
  if (!account) notFound();

  // Resolve account timezone
  const rules = await getAccountRules(id).catch(() => null);
  const timezone = rules?.dailyResetTimezone ?? 'UTC';

  // Determine trade date
  const now = new Date();
  const todayStr = getLocalDateStr(now, timezone);
  const tradeDate = dateParam ?? todayStr;
  const isToday = tradeDate === todayStr;

  // SSR data fetch
  const checklist = await getOrCreateChecklist(id, session.user.id, tradeDate).catch(() => null);
  if (!checklist) notFound();

  const newsEvents = await getTodayHighImpactNews(tradeDate).catch(() => []);
  const currentSession = isToday ? calculateMarketSession(now) : null;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6">
      {/* Back link */}
      <Link
        href={`/accounts/${id}`}
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {account.name}
      </Link>

      {/* Page heading */}
      <div className="mb-6 flex items-center gap-2">
        <ClipboardCheck className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-xl font-bold text-foreground">Trading Day Checklist</h1>
          <p className="text-sm text-muted-foreground">{account.name}</p>
        </div>
      </div>

      {/* Main checklist */}
      <TradingDayChecklist
        accountId={id}
        initialChecklist={checklist as Omit<TradingDayChecklistRow, 'itemStates'> & { itemStates: ItemStates }}
        initialNewsEvents={newsEvents}
        initialSession={currentSession}
        tradeDate={tradeDate}
        isToday={isToday}
      />

      {/* Floating candle close HUD */}
      <CandleCloseHUD />
    </div>
  );
}
