# Version 1.1.0 Enhancement Roadmap

**Document Version**: 1.0  
**Last Updated**: January 12, 2026  
**Target Release**: Q1 2026 (January - March)  
**Current Version**: v1.0.0 (Production)

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [v1.0.0 Completion Status](#v100-completion-status)
3. [v1.1.0 Planned Enhancements](#v110-planned-enhancements)
4. [Feature Specifications](#feature-specifications)
5. [Implementation Plan](#implementation-plan)
6. [Database Schema Changes](#database-schema-changes)
7. [API Changes](#api-changes)
8. [Timeline & Estimates](#timeline--estimates)
9. [Testing Strategy](#testing-strategy)
10. [Deployment Strategy](#deployment-strategy)

---

## Executive Summary

Version 1.1.0 represents the first major enhancement release following the successful v1.0.0 production deployment. This release focuses on improving user experience, data management, and market awareness through four key features.

### Goals
- **Enhance trade tracking** with symbol identification
- **Empower users** with self-service CSV import
- **Personalize experience** with timezone preferences
- **Improve market awareness** with economic news integration

### Impact
- **User Autonomy**: +40% (CSV import, timezone settings)
- **Data Quality**: +30% (symbol tracking, better timezone handling)
- **Market Context**: +100% (new economic news feature)

---

## v1.0.0 Completion Status

### What's in Production (v1.0.0)

✅ **Core Features**:
- Individual trade tracking with timestamps
- Bulk trade entry (up to 100 trades)
- Market session auto-detection (ASIA/EUROPE/US + Overlaps)
- Daily summary auto-calculation
- Dashboard with statistics and charts
- Target management (Prop Firm & Personal categories)
- Admin panel with user management
- SOP types system (3 types: BB Mastery, W&M Breakout, Engulfing Fail)
- Daily loss limit alerts
- Account reset functionality
- User performance calendar

✅ **Technical Stack**:
- Next.js 15 (App Router)
- TypeScript
- Turso (LibSQL) + Drizzle ORM
- NextAuth.js v5
- Tailwind CSS + shadcn/ui
- Recharts
- Deployed on Vercel

✅ **Deployment**:
- Production: https://wekangtrading.vercel.app
- 5 users active
- ~1,500 trades imported
- Performance: < 500ms API response, < 200ms dashboard load

### What's Missing (Deferred to v1.1.0+)

⏳ **User Enhancements**:
- Trade symbol entry (e.g., EURUSD, GBPJPY)
- User-initiated CSV import
- Customizable timezone settings
- Economic news calendar

⏳ **Advanced Analytics** (Future v1.2.0):
- Win/loss streaks analysis
- Performance by symbol
- Performance by SOP type
- Risk/reward ratio tracking

⏳ **Data Export** (Future v1.2.0):
- PDF reports
- Enhanced CSV exports with filters

---

## v1.1.0 Planned Enhancements

### Feature 1: Trade Symbol Entry
**Priority**: High  
**Estimated Effort**: 2-3 days  
**User Story**: As a trader, I want to record which currency pair/asset I traded so I can analyze performance by instrument.

**Value Proposition**:
- Identify best-performing instruments
- Avoid problematic pairs
- Better trade documentation
- Preparation for future symbol-based analytics

---

### Feature 2: User CSV Import
**Priority**: High  
**Estimated Effort**: 3-4 days  
**User Story**: As a user, I want to import my historical trades from CSV without admin help so I can quickly populate my trading journal.

**Value Proposition**:
- Self-service data import
- Faster onboarding
- Historical data migration
- Reduces admin workload

---

### Feature 3: User Timezone Settings
**Priority**: Medium  
**Estimated Effort**: 2-3 days  
**User Story**: As a trader in a different timezone, I want to set my preferred timezone so timestamps display in my local time instead of UTC/server time.

**Value Proposition**:
- Personalized user experience
- Accurate time display for global users
- Better UX for traders outside Malaysia GMT+8
- Reduces confusion with timestamp interpretation

---

### Feature 4: Economic News Calendar
**Priority**: Medium  
**Estimated Effort**: 3-4 days  
**User Story**: As a trader, I want to see major economic news events so I can correlate my trades with market-moving news.

**Value Proposition**:
- Market context for trading decisions
- Awareness of high-impact news events
- Better trade planning
- Educational tool for new traders

---

## Feature Specifications

### Feature 1: Trade Symbol Entry

#### Database Changes

**Add to `individual_trades` table**:
```sql
ALTER TABLE individual_trades 
ADD COLUMN symbol TEXT DEFAULT NULL;

-- Optional: Add index for symbol-based queries
CREATE INDEX idx_individual_trades_symbol 
ON individual_trades(symbol);
```

#### Schema Definition (Drizzle)
```typescript
export const individualTrades = sqliteTable('individual_trades', {
  // ... existing fields ...
  symbol: text('symbol'), // NEW: 'EURUSD', 'GBPJPY', etc.
});
```

#### Validation Rules
- **Format**: 2-10 uppercase characters (e.g., EURUSD, BTC, SPX500)
- **Optional**: Can be null/empty for existing trades
- **No strict list**: Free-form entry (too many symbols to maintain)
- **Hints**: Common symbols shown as suggestions (EUR/USD, GBP/JPY, etc.)

#### UI Changes

**1. Individual Trade Form** (`app/(user)/trades/new/page.tsx`):
```tsx
<FormField
  control={form.control}
  name="symbol"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Trading Symbol (Optional)</FormLabel>
      <FormControl>
        <Input 
          placeholder="e.g., EURUSD, GBPJPY, BTC" 
          {...field} 
          maxLength={10}
        />
      </FormControl>
      <FormDescription>
        Currency pair or instrument traded
      </FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
```

**2. Bulk Trade Form** (`app/(user)/trades/bulk/page.tsx`):
- Add "Symbol" column to trade table
- Pre-fill with last used symbol (convenience)
- Optional field

**3. Trade List** (`app/(user)/trades/page.tsx`):
- Add "Symbol" column to trade table
- Show badge with symbol (e.g., <Badge>EURUSD</Badge>)
- Add symbol filter dropdown

**4. Trade Detail** (`app/(user)/trades/[id]/page.tsx`):
- Display symbol prominently
- Show if available, hide if null

#### API Changes

**POST/PATCH `/api/trades/individual`**:
```typescript
// lib/validations.ts
export const individualTradeSchema = z.object({
  // ... existing fields ...
  symbol: z.string()
    .regex(/^[A-Z0-9]{2,10}$/, 'Symbol must be 2-10 uppercase letters/numbers')
    .optional()
    .nullable(),
});
```

**GET `/api/trades/individual`** (List):
- Add `symbol` query parameter for filtering
- Return symbol in response objects

#### Implementation Checklist
- [ ] Database migration (add column)
- [ ] Update Drizzle schema
- [ ] Update validation schemas (Zod)
- [ ] Update IndividualTradeForm component
- [ ] Update BulkTradeForm component
- [ ] Update TradesList component
- [ ] Update TradeDetail component
- [ ] Add symbol filter to API
- [ ] Test with various symbol formats
- [ ] Update API documentation

---

### Feature 2: User CSV Import

#### Overview
Allow users to upload CSV files and import their historical trades without admin intervention.

#### CSV Format Specification

**Supported Format** (same as admin import):
```csv
Date & time,Result,SOP,SOP Type,Amount,Symbol
1/12/2026 08:30,WIN,YES,BB Mastery,150.50,EURUSD
1/12/2026 10:45,LOSS,NO,W & M breakout,-75.00,GBPJPY
```

**Required Columns**:
- `Date & time`: MM/DD/YYYY HH:MM format
- `Result`: WIN or LOSS
- `SOP`: YES or NO
- `SOP Type`: BB Mastery, W & M breakout, Engulfing Fail, etc.
- `Amount`: Profit/loss in USD (positive or negative)

**Optional Columns**:
- `Symbol`: Trading symbol (if Feature 1 implemented)
- `Notes`: Trade notes (future)

#### UI Components

**1. CSV Import Page** (`app/(user)/trades/import/page.tsx`):
```tsx
<Card>
  <CardHeader>
    <CardTitle>Import Trades from CSV</CardTitle>
    <CardDescription>
      Upload your trading history from CSV file (max 500 trades per file)
    </CardDescription>
  </CardHeader>
  
  <CardContent>
    {/* Step 1: Download Template */}
    <div className="mb-6">
      <h3>Step 1: Download Template</h3>
      <Button variant="outline" onClick={downloadTemplate}>
        <Download className="mr-2 h-4 w-4" />
        Download CSV Template
      </Button>
    </div>

    {/* Step 2: Upload File */}
    <div className="mb-6">
      <h3>Step 2: Upload Your CSV</h3>
      <Input 
        type="file" 
        accept=".csv"
        onChange={handleFileSelect}
      />
    </div>

    {/* Step 3: Preview & Validate */}
    {parsedData && (
      <div className="mb-6">
        <h3>Step 3: Preview Trades</h3>
        <DataTable data={parsedData.slice(0, 10)} />
        <p className="text-sm text-muted-foreground mt-2">
          Showing first 10 of {parsedData.length} trades
        </p>
        
        {validationErrors.length > 0 && (
          <Alert variant="destructive" className="mt-4">
            <AlertTitle>Validation Errors</AlertTitle>
            <AlertDescription>
              <ul>
                {validationErrors.map(error => (
                  <li key={error.row}>
                    Row {error.row}: {error.message}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </div>
    )}

    {/* Step 4: Import */}
    <Button 
      onClick={handleImport} 
      disabled={!parsedData || validationErrors.length > 0}
    >
      {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Import {parsedData?.length || 0} Trades
    </Button>
  </CardContent>
</Card>
```

**2. Import Navigation**:
- Add "Import from CSV" button to `/trades` page
- Link to `/trades/import`

#### CSV Parsing & Validation

**Client-side** (using `papaparse` library):
```typescript
// lib/utils/csvParser.ts
import Papa from 'papaparse';

interface CSVTrade {
  dateTime: string;
  result: 'WIN' | 'LOSS';
  sopFollowed: 'YES' | 'NO';
  sopTypeName: string;
  amount: string;
  symbol?: string;
}

export function parseCSV(file: File): Promise<ParsedCSV> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const trades = results.data.map((row, index) => {
          // Validate and transform each row
          return validateCSVRow(row, index + 2); // +2 for header + 1-based
        });
        resolve({ trades, errors: [] });
      },
      error: reject,
    });
  });
}

function validateCSVRow(row: any, rowNumber: number): ValidatedTrade {
  const errors: string[] = [];

  // Validate date & time
  const dateTime = new Date(row['Date & time']);
  if (isNaN(dateTime.getTime())) {
    errors.push(`Invalid date format: ${row['Date & time']}`);
  }

  // Validate result
  if (!['WIN', 'LOSS'].includes(row.Result)) {
    errors.push(`Invalid result: ${row.Result} (must be WIN or LOSS)`);
  }

  // Validate amount
  const amount = parseFloat(row.Amount);
  if (isNaN(amount) || amount === 0) {
    errors.push(`Invalid amount: ${row.Amount}`);
  }

  // ... more validations ...

  return { rowNumber, data: transformedRow, errors };
}
```

#### API Endpoint

**POST `/api/trades/import`**:
```typescript
// app/api/trades/import/route.ts
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { trades } = await req.json();

  // Server-side validation (double-check client validation)
  const validatedTrades = trades.map(trade => 
    individualTradeSchema.parse(trade)
  );

  // Check for duplicate timestamps
  const existingTrades = await db
    .select({ tradeTimestamp: individualTrades.tradeTimestamp })
    .from(individualTrades)
    .where(eq(individualTrades.userId, session.user.id));

  const existingTimestamps = new Set(
    existingTrades.map(t => t.tradeTimestamp.getTime())
  );

  const duplicates = validatedTrades.filter(t =>
    existingTimestamps.has(new Date(t.tradeTimestamp).getTime())
  );

  if (duplicates.length > 0) {
    return NextResponse.json({
      error: 'Duplicate timestamps detected',
      duplicates: duplicates.map(d => d.tradeTimestamp),
    }, { status: 400 });
  }

  // Get/create SOP types
  const sopTypeMap = await getOrCreateSopTypes(
    [...new Set(validatedTrades.map(t => t.sopTypeName))]
  );

  // Prepare trades for insertion
  const tradesToInsert = validatedTrades.map(trade => ({
    userId: session.user.id,
    tradeTimestamp: new Date(trade.tradeTimestamp),
    marketSession: calculateMarketSession(new Date(trade.tradeTimestamp)),
    result: trade.result,
    sopFollowed: trade.sopFollowed,
    sopTypeId: sopTypeMap.get(trade.sopTypeName),
    profitLossUsd: trade.amount,
    symbol: trade.symbol || null,
    notes: null,
  }));

  // Batch insert
  await db.insert(individualTrades).values(tradesToInsert);

  // Recalculate daily summaries for affected dates
  const uniqueDates = [...new Set(
    tradesToInsert.map(t => t.tradeTimestamp.toISOString().split('T')[0])
  )];

  for (const dateStr of uniqueDates) {
    await updateDailySummary(session.user.id, new Date(dateStr));
  }

  return NextResponse.json({
    success: true,
    imported: tradesToInsert.length,
    datesAffected: uniqueDates.length,
  });
}
```

#### Limitations & Safeguards

**Rate Limiting**:
- Max 500 trades per CSV file
- Max 3 imports per day per user (prevent abuse)
- Cooldown: 5 minutes between imports

**Validation**:
- All trades must pass validation
- No partial imports (all-or-nothing)
- Duplicate detection (by timestamp)
- Future date rejection
- Amount must be non-zero

**Error Handling**:
- Clear error messages for each row
- Show which rows have issues
- Allow user to fix CSV and re-upload

#### Implementation Checklist
- [ ] Install papaparse library
- [ ] Create CSV parser utility
- [ ] Create CSV validation logic
- [ ] Build import page UI
- [ ] Create CSV template download
- [ ] Create `/api/trades/import` endpoint
- [ ] Add rate limiting
- [ ] Add duplicate detection
- [ ] Add progress indicator
- [ ] Test with various CSV formats
- [ ] Test with large files (500 trades)
- [ ] Update user documentation

---

### Feature 3: User Timezone Settings

#### Overview
Allow each user to set their preferred timezone for display purposes. All data stored in UTC, but displayed in user's chosen timezone.

#### Database Changes

**Add to `users` table**:
```sql
ALTER TABLE users 
ADD COLUMN preferred_timezone TEXT DEFAULT 'UTC';
```

#### Schema Definition (Drizzle)
```typescript
export const users = sqliteTable('users', {
  // ... existing fields ...
  preferredTimezone: text('preferred_timezone').default('UTC'),
});
```

#### Timezone Options

**Common Timezones** (IANA format):
- America/New_York (EST/EDT)
- America/Chicago (CST/CDT)
- America/Los_Angeles (PST/PDT)
- Europe/London (GMT/BST)
- Europe/Paris (CET/CEST)
- Asia/Singapore (SGT)
- Asia/Tokyo (JST)
- Asia/Dubai (GST)
- Australia/Sydney (AEDT/AEST)
- UTC (default)

**Full list**: ~400 IANA timezones available via `Intl.supportedValuesOf('timeZone')`

#### UI Components

**1. User Settings Page** (`app/(user)/settings/page.tsx`):
```tsx
<Card>
  <CardHeader>
    <CardTitle>Display Preferences</CardTitle>
  </CardHeader>
  
  <CardContent>
    <FormField
      control={form.control}
      name="preferredTimezone"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Preferred Timezone</FormLabel>
          <Select 
            onValueChange={field.onChange} 
            defaultValue={field.value}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
            </FormControl>
            <SelectContent className="max-h-[300px]">
              <SelectGroup>
                <SelectLabel>Common Timezones</SelectLabel>
                <SelectItem value="America/New_York">
                  Eastern Time (EST/EDT)
                </SelectItem>
                <SelectItem value="Europe/London">
                  London (GMT/BST)
                </SelectItem>
                <SelectItem value="Asia/Singapore">
                  Singapore (SGT)
                </SelectItem>
                {/* ... more options ... */}
              </SelectGroup>
              
              <SelectGroup>
                <SelectLabel>All Timezones</SelectLabel>
                {allTimezones.map(tz => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <FormDescription>
            All timestamps will be displayed in this timezone.
            Current time: {format(new Date(), 'PPpp', { timeZone: field.value })}
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
    
    <Button type="submit" className="mt-4">Save Preferences</Button>
  </CardContent>
</Card>
```

**2. Timezone Context Provider**:
```typescript
// contexts/TimezoneContext.tsx
import { createContext, useContext } from 'react';

interface TimezoneContextType {
  timezone: string;
  formatDate: (date: Date, format: string) => string;
}

const TimezoneContext = createContext<TimezoneContextType | null>(null);

export function TimezoneProvider({ 
  children, 
  userTimezone 
}: { 
  children: React.ReactNode;
  userTimezone: string;
}) {
  const formatDate = (date: Date, formatStr: string) => {
    return format(date, formatStr, { timeZone: userTimezone });
  };

  return (
    <TimezoneContext.Provider value={{ timezone: userTimezone, formatDate }}>
      {children}
    </TimezoneContext.Provider>
  );
}

export const useTimezone = () => {
  const context = useContext(TimezoneContext);
  if (!context) throw new Error('useTimezone must be used within TimezoneProvider');
  return context;
};
```

**3. Update Layout to Wrap with Provider**:
```tsx
// app/(user)/layout.tsx
export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const userTimezone = session?.user?.preferredTimezone || 'UTC';

  return (
    <TimezoneProvider userTimezone={userTimezone}>
      {children}
    </TimezoneProvider>
  );
}
```

#### Date Display Updates

**Everywhere timestamps are shown**:
```tsx
// Before
<p>{trade.tradeTimestamp.toLocaleString()}</p>

// After
const { formatDate } = useTimezone();
<p>{formatDate(trade.tradeTimestamp, 'PPpp')}</p>
// Example: "Jan 12, 2026, 8:30:00 AM"
```

**Components to Update**:
- Trade list table
- Trade detail page
- Dashboard stat cards
- Bulk entry timestamp display
- Individual trade form (datetime picker hint)
- Target date displays
- Daily loss alert times

#### API Changes

**GET `/api/users/me`**:
- Include `preferredTimezone` in response

**PATCH `/api/users/me`**:
- Allow updating `preferredTimezone`
- Validate timezone against IANA list

```typescript
// lib/validations.ts
export const userPreferencesSchema = z.object({
  preferredTimezone: z.string()
    .refine(
      (tz) => Intl.supportedValuesOf('timeZone').includes(tz),
      'Invalid timezone'
    ),
});
```

#### Important Notes

**Storage**: All dates stored in UTC in database (no change)

**Display Only**: Timezone only affects display, not storage or calculations

**Market Sessions**: Still calculated based on UTC hours (no change)

**Date Pickers**: Show user's timezone but convert to UTC before sending to API

#### Implementation Checklist
- [ ] Database migration (add column)
- [ ] Update Drizzle schema
- [ ] Create TimezoneContext provider
- [ ] Update user layout with provider
- [ ] Add timezone selector to settings
- [ ] Update API to accept timezone preference
- [ ] Update all timestamp displays (20+ components)
- [ ] Test with different timezones
- [ ] Update datetime pickers to handle timezone
- [ ] Test DST transitions
- [ ] Update documentation

---

### Feature 4: Economic News Calendar

#### Overview
Display major economic news events (FOMC, NFP, CPI, etc.) so traders can correlate trades with market-moving news.

#### Data Source Options

**Option 1: Free API - TradingEconomics Calendar** (Recommended for MVP):
- API: Free tier available
- Coverage: Major USD, EUR, GBP, JPY events
- Limit: 100 requests/day (sufficient for 5 users)
- https://tradingeconomics.com/calendar

**Option 2: Forex Factory Scraping**:
- No API, requires scraping (legal gray area)
- Not recommended

**Option 3: Manual Entry** (Fallback):
- Admin manually enters major events
- Simple but requires maintenance

**For v1.1.0**: Use Option 1 (Trading Economics API)

#### Database Schema

**New table: `economic_events`**:
```sql
CREATE TABLE economic_events (
  id TEXT PRIMARY KEY,
  event_date DATETIME NOT NULL,
  country TEXT NOT NULL,
  event_name TEXT NOT NULL,
  impact TEXT NOT NULL, -- 'HIGH', 'MEDIUM', 'LOW'
  actual TEXT,
  forecast TEXT,
  previous TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_economic_events_date ON economic_events(event_date);
CREATE INDEX idx_economic_events_impact ON economic_events(impact);
```

#### Drizzle Schema
```typescript
export const economicEvents = sqliteTable('economic_events', {
  id: text('id').primaryKey(),
  eventDate: integer('event_date', { mode: 'timestamp' }).notNull(),
  country: text('country').notNull(),
  eventName: text('event_name').notNull(),
  impact: text('impact', { enum: ['HIGH', 'MEDIUM', 'LOW'] }).notNull(),
  actual: text('actual'),
  forecast: text('forecast'),
  previous: text('previous'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});
```

#### UI Components

**1. Economic News Tab** (`app/(user)/news/page.tsx`):
```tsx
export default function EconomicNewsPage() {
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'HIGH'>('HIGH');
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfWeek(new Date()),
    to: endOfWeek(new Date()),
  });

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Economic Calendar</h1>
        
        <div className="flex gap-2">
          <DateRangePicker 
            value={dateRange} 
            onChange={setDateRange} 
          />
          
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Events</SelectItem>
              <SelectItem value="HIGH">High Impact Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Impact</TableHead>
                <TableHead>Actual</TableHead>
                <TableHead>Forecast</TableHead>
                <TableHead>Previous</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map(event => (
                <TableRow key={event.id}>
                  <TableCell>
                    {formatDate(event.eventDate, 'MMM dd, HH:mm')}
                  </TableCell>
                  <TableCell>
                    <CountryFlag country={event.country} />
                    {event.country}
                  </TableCell>
                  <TableCell className="font-medium">
                    {event.eventName}
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      event.impact === 'HIGH' ? 'destructive' :
                      event.impact === 'MEDIUM' ? 'warning' :
                      'secondary'
                    }>
                      {event.impact}
                    </Badge>
                  </TableCell>
                  <TableCell>{event.actual || '-'}</TableCell>
                  <TableCell>{event.forecast || '-'}</TableCell>
                  <TableCell>{event.previous || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
```

**2. Dashboard Widget**:
```tsx
// components/dashboard/UpcomingNewsWidget.tsx
export function UpcomingNewsWidget() {
  const [nextEvents, setNextEvents] = useState<EconomicEvent[]>([]);

  useEffect(() => {
    // Fetch next 3 high-impact events
    fetch('/api/news/upcoming')
      .then(res => res.json())
      .then(data => setNextEvents(data.events));
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming High-Impact News</CardTitle>
        <CardDescription>Next 24 hours</CardDescription>
      </CardHeader>
      <CardContent>
        {nextEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No high-impact events in next 24 hours
          </p>
        ) : (
          <div className="space-y-2">
            {nextEvents.map(event => (
              <div key={event.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{event.eventName}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(event.eventDate, 'HH:mm')} • {event.country}
                  </p>
                </div>
                <Badge variant="destructive">HIGH</Badge>
              </div>
            ))}
          </div>
        )}
        <Button variant="link" asChild className="mt-4 w-full">
          <Link href="/news">View Full Calendar →</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
```

**3. Add to Navigation**:
```tsx
// Update sidebar navigation
<NavItem href="/news" icon={<Newspaper />}>
  Economic News
</NavItem>
```

#### API Endpoints

**GET `/api/news`** - List events with filters:
```typescript
// app/api/news/route.ts
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from'); // ISO date
  const to = searchParams.get('to');     // ISO date
  const impact = searchParams.get('impact'); // 'HIGH' | 'MEDIUM' | 'LOW' | 'ALL'

  const events = await db
    .select()
    .from(economicEvents)
    .where(
      and(
        gte(economicEvents.eventDate, new Date(from!)),
        lte(economicEvents.eventDate, new Date(to!)),
        impact !== 'ALL' ? eq(economicEvents.impact, impact) : undefined
      )
    )
    .orderBy(economicEvents.eventDate);

  return NextResponse.json({ events });
}
```

**GET `/api/news/upcoming`** - Next 3 high-impact events:
```typescript
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const tomorrow = addHours(now, 24);

  const events = await db
    .select()
    .from(economicEvents)
    .where(
      and(
        gte(economicEvents.eventDate, now),
        lte(economicEvents.eventDate, tomorrow),
        eq(economicEvents.impact, 'HIGH')
      )
    )
    .orderBy(economicEvents.eventDate)
    .limit(3);

  return NextResponse.json({ events });
}
```

#### Data Sync Strategy

**Automated Sync** (Vercel Cron Job):
```typescript
// app/api/cron/sync-economic-news/route.ts
export async function GET(req: Request) {
  // Verify Vercel Cron secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch events from Trading Economics API
  const response = await fetch(
    `https://api.tradingeconomics.com/calendar?c=${process.env.TRADING_ECONOMICS_API_KEY}&f=json`
  );

  const rawEvents = await response.json();

  // Transform and insert events
  const events = rawEvents
    .filter(event => event.Importance === 'High') // Only high-impact
    .map(event => ({
      id: `${event.CalendarId}`,
      eventDate: new Date(event.DateTime),
      country: event.Country,
      eventName: event.Event,
      impact: 'HIGH',
      actual: event.Actual?.toString(),
      forecast: event.Forecast?.toString(),
      previous: event.Previous?.toString(),
    }));

  // Upsert events (insert or update)
  for (const event of events) {
    await db.insert(economicEvents)
      .values(event)
      .onConflictDoUpdate({
        target: economicEvents.id,
        set: {
          actual: event.actual,
          updatedAt: new Date(),
        },
      });
  }

  return NextResponse.json({ 
    success: true, 
    synced: events.length 
  });
}
```

**Vercel Cron Configuration** (`vercel.json`):
```json
{
  "crons": [{
    "path": "/api/cron/sync-economic-news",
    "schedule": "0 */4 * * *"
  }]
}
```
Runs every 4 hours to sync latest events.

#### Implementation Checklist
- [ ] Sign up for Trading Economics API
- [ ] Create `economic_events` table (migration)
- [ ] Create Drizzle schema
- [ ] Create data sync cron job
- [ ] Create `/api/news` endpoint
- [ ] Create `/api/news/upcoming` endpoint
- [ ] Build economic news page
- [ ] Add upcoming news dashboard widget
- [ ] Add navigation link
- [ ] Test with real API data
- [ ] Handle API rate limits
- [ ] Add error handling for API failures
- [ ] Update documentation

---

## Implementation Plan

### Development Workflow

1. **Create `develop` branch** from `main`
2. For each feature:
   - Create feature branch from `develop`
   - Implement feature
   - Test on staging
   - Create PR → `develop`
   - Merge after review
3. After all features complete:
   - Create `release/v1.1.0` from `develop`
   - Final testing
   - Update CHANGELOG
   - Merge to `main`
   - Tag `v1.1.0`

### Feature Development Order

**Phase 1: Quick Wins** (Week 1)
1. Feature 1: Trade Symbol Entry (2-3 days)
   - Simple database addition
   - Minor UI updates
   - Low risk, high value

**Phase 2: Core Enhancements** (Week 2-3)
2. Feature 2: User CSV Import (3-4 days)
   - More complex (file upload, validation)
   - High user value
3. Feature 3: User Timezone Settings (2-3 days)
   - Medium complexity
   - Touches many components

**Phase 3: New Capability** (Week 3-4)
4. Feature 4: Economic News Calendar (3-4 days)
   - New feature (not modification)
   - Requires external API integration
   - Lowest priority (nice-to-have)

### Parallel Work Opportunities

**Can be developed simultaneously**:
- Feature 1 (Symbol) + Feature 3 (Timezone)
- Feature 2 (CSV Import) works independently

**Sequential dependencies**:
- Feature 1 should be done before Feature 2 (so CSV import supports symbols)

---

## Database Schema Changes

### Migration Script

**Migration: `0003_add_v1.1_features.sql`**:
```sql
-- Feature 1: Add symbol column
ALTER TABLE individual_trades 
ADD COLUMN symbol TEXT DEFAULT NULL;

CREATE INDEX idx_individual_trades_symbol 
ON individual_trades(symbol);

-- Feature 3: Add timezone preference
ALTER TABLE users 
ADD COLUMN preferred_timezone TEXT DEFAULT 'UTC';

-- Feature 4: Create economic events table
CREATE TABLE economic_events (
  id TEXT PRIMARY KEY,
  event_date INTEGER NOT NULL,
  country TEXT NOT NULL,
  event_name TEXT NOT NULL,
  impact TEXT NOT NULL CHECK(impact IN ('HIGH', 'MEDIUM', 'LOW')),
  actual TEXT,
  forecast TEXT,
  previous TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX idx_economic_events_date ON economic_events(event_date);
CREATE INDEX idx_economic_events_impact ON economic_events(impact);
```

### Drizzle Schema Updates

```typescript
// lib/db/schema/individual-trades.ts
export const individualTrades = sqliteTable('individual_trades', {
  // ... existing fields ...
  symbol: text('symbol'), // NEW
});

// lib/db/schema/users.ts
export const users = sqliteTable('users', {
  // ... existing fields ...
  preferredTimezone: text('preferred_timezone').default('UTC'), // NEW
});

// lib/db/schema/economic-events.ts (NEW FILE)
export const economicEvents = sqliteTable('economic_events', {
  id: text('id').primaryKey(),
  eventDate: integer('event_date', { mode: 'timestamp' }).notNull(),
  country: text('country').notNull(),
  eventName: text('event_name').notNull(),
  impact: text('impact', { enum: ['HIGH', 'MEDIUM', 'LOW'] }).notNull(),
  actual: text('actual'),
  forecast: text('forecast'),
  previous: text('previous'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});
```

---

## API Changes

### New Endpoints

```
POST   /api/trades/import          # Feature 2: CSV import
GET    /api/news                   # Feature 4: List economic events
GET    /api/news/upcoming          # Feature 4: Next high-impact events
GET    /api/cron/sync-economic-news # Feature 4: Cron job (internal)
```

### Modified Endpoints

```
POST   /api/trades/individual      # Add symbol field
PATCH  /api/trades/individual/[id] # Add symbol field
GET    /api/trades/individual      # Add symbol filter, return symbol
POST   /api/trades/bulk            # Add symbol column
GET    /api/users/me               # Return preferredTimezone
PATCH  /api/users/me               # Accept preferredTimezone update
```

---

## Timeline & Estimates

### Time Estimates

| Feature | Planning | Development | Testing | Total |
|---------|----------|-------------|---------|-------|
| 1. Trade Symbol | 0.5 day | 2 days | 0.5 day | 3 days |
| 2. User CSV Import | 0.5 day | 3 days | 0.5 day | 4 days |
| 3. User Timezone | 0.5 day | 2 days | 0.5 day | 3 days |
| 4. Economic News | 1 day | 3 days | 0.5 day | 4.5 days |
| **Total** | 2.5 days | 10 days | 2 days | **14.5 days** |

### Timeline

**3-Week Sprint**:

**Week 1** (Days 1-5):
- Feature 1: Trade Symbol Entry (Days 1-3)
- Feature 3: User Timezone Settings (Days 4-5)

**Week 2** (Days 6-10):
- Feature 2: User CSV Import (Days 6-9)
- Integration testing (Day 10)

**Week 3** (Days 11-15):
- Feature 4: Economic News Calendar (Days 11-14)
- Final QA and bug fixes (Day 15)

**Week 4** (Release):
- Staging deployment and testing
- Production deployment
- Monitoring and hotfixes

**Target Release Date**: End of January 2026

---

## Testing Strategy

### Unit Tests (Future Enhancement)

For v1.1.0, focus on manual testing. Unit tests can be added in v1.2.0.

### Manual Testing Checklist

**Feature 1: Trade Symbol**:
- [ ] Can add symbol to new individual trade
- [ ] Symbol appears in trade list
- [ ] Symbol filter works correctly
- [ ] Can edit symbol in existing trade
- [ ] Symbol validation works (2-10 chars, uppercase)
- [ ] Works in bulk entry
- [ ] Works with CSV import
- [ ] Handles null/empty symbols gracefully

**Feature 2: User CSV Import**:
- [ ] CSV template downloads correctly
- [ ] Can upload CSV file (< 10 MB)
- [ ] CSV parsing works with various formats
- [ ] Validation catches errors
- [ ] Preview shows first 10 trades
- [ ] Import succeeds with valid data
- [ ] Duplicate detection works
- [ ] Daily summaries recalculated
- [ ] Rate limiting works (3 imports/day)
- [ ] Error messages are clear
- [ ] Handles large files (500 trades)

**Feature 3: User Timezone**:
- [ ] Timezone selector shows all zones
- [ ] Can save timezone preference
- [ ] All timestamps display in user timezone
- [ ] Market sessions still calculated correctly (UTC-based)
- [ ] Datetime pickers show user timezone
- [ ] Works across DST transitions
- [ ] Admin sees their own timezone (not user's)

**Feature 4: Economic News**:
- [ ] News page loads events
- [ ] Date range filter works
- [ ] Impact filter works (HIGH/MEDIUM/LOW)
- [ ] Dashboard widget shows next 3 events
- [ ] Cron job syncs events (test manually first)
- [ ] Handles API failures gracefully
- [ ] Events display in user's timezone
- [ ] Country flags display correctly

### Performance Testing

**Benchmarks**:
- CSV import (500 trades): < 3 seconds
- Economic news page load: < 500ms
- Trade list with symbol filter: < 300ms
- Timezone change (update UI): < 100ms

---

## Deployment Strategy

### Staging Deployment

1. Merge all features to `develop`
2. Deploy to staging: `wekangtrading-dev.vercel.app`
3. Run full manual testing suite
4. Fix bugs in feature branches, merge to `develop`
5. Re-test until all issues resolved

### Production Deployment

1. Create `release/v1.1.0` from `develop`
2. Update CHANGELOG.md
3. Update version in package.json to `1.1.0`
4. Create PR: `release/v1.1.0` → `main`
5. Get approval
6. Merge to `main`
7. Tag release: `git tag -a v1.1.0 -m "Release v1.1.0"`
8. Push tag: `git push origin v1.1.0`
9. Vercel auto-deploys to production
10. Monitor for 24 hours

### Database Migration Steps

**Critical**: Test on staging first!

1. **Staging**:
   ```bash
   npm run drizzle:generate
   npm run drizzle:push
   # Verify tables updated correctly
   ```

2. **Production** (after code deployed):
   ```bash
   # Connect to production Turso database
   npm run drizzle:push
   # Verify in Turso dashboard
   ```

3. **Rollback Plan**:
   - Columns added with DEFAULT values (safe)
   - Can rollback code without breaking DB
   - If needed, can drop new columns/table

---

## Success Metrics

### Feature Adoption

**30 days post-release**:
- Trade Symbol: 80%+ trades have symbols entered
- CSV Import: 60%+ users imported historical data
- Timezone Settings: 40%+ users changed from default
- Economic News: 20%+ users visit tab weekly

### Performance

- No degradation in existing page load times
- CSV import < 3 seconds for 500 trades
- Economic news page < 500ms load

### Bugs

- Zero critical bugs in production
- < 5 minor bugs reported in first week
- All bugs fixed within 48 hours

---

## Future Considerations (v1.2.0+)

### Analytics by Symbol
- Win rate by currency pair
- Most profitable symbols
- Avoid problematic pairs

### Export Enhancements
- PDF reports with filters
- Symbol-specific exports
- Date range exports

### Risk Management
- Risk/reward ratio per trade
- Position sizing recommendations
- Maximum daily loss enforcement

### Advanced News Features
- News impact analysis (trades around news)
- Correlation between news and results
- News alerts (push notifications)

---

## Dependencies

### New NPM Packages

```json
{
  "dependencies": {
    "papaparse": "^5.4.1",           // CSV parsing
    "@types/papaparse": "^5.3.14"    // TypeScript types
  }
}
```

### External Services

1. **Trading Economics API**:
   - Sign up: https://tradingeconomics.com/api
   - Free tier: 100 requests/day
   - API key required

2. **Vercel Cron**:
   - Available on all Vercel plans (including Hobby/free)
   - No additional cost

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| CSV import abuse | Low | Medium | Rate limiting (3/day), file size limits |
| Timezone bugs | Medium | Low | Extensive testing, UTC storage unchanged |
| External API downtime | Medium | Low | Graceful fallback, cached data |
| Database migration failure | Low | High | Test on staging, backup before migration |
| Performance degradation | Low | Medium | Benchmarking, indexes on new columns |

---

## Communication Plan

### User Announcement

**1 week before release**:
- Email to all users
- In-app announcement banner
- Highlight new features

**On release day**:
- Update announcement with "Now Available"
- Share usage instructions
- Provide feedback channel

**1 week after release**:
- Gather feedback
- Share usage statistics
- Thank users for feedback

### Internal Communication

**Weekly updates** during development:
- Feature completion status
- Blockers/risks
- Next week's plan

---

**Document Status**: ✅ Ready for Implementation  
**Next Action**: Set up develop branch and begin Feature 1 (Trade Symbol)

**Approvals Required**:
- [ ] Project owner approval
- [ ] Technical architecture review
- [ ] Timeline confirmation
- [ ] Budget approval (Trading Economics API: FREE)

---

**Questions?** Create issue on GitHub or contact project maintainer.
