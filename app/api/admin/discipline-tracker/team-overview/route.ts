/**
 * Admin Discipline Tracker Team Overview API
 * GET /api/admin/discipline-tracker/team-overview
 * Returns all users' discipline tracker data for specified date range
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireAdmin } from '@/lib/utils/apiErrors';
import { db } from '@/lib/db';
import { users, disciplineTrackerSettings, disciplineTrackerRows } from '@/lib/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { evaluateDayRow } from '@/lib/services/disciplineTrackerRulesEngine';
import type { DisciplineTrackerRow, DisciplineTrackerSettings } from '@/lib/db/schema';

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const session = await auth();
    const adminError = requireAdmin(session);
    if (adminError) return adminError;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const daysParam = searchParams.get('days') || '14';
    const days = parseInt(daysParam, 10);
    const tradingAccountId = searchParams.get('tradingAccountId') || undefined;

    if (isNaN(days) || days < 1 || days > 90) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Days must be between 1 and 90' } },
        { status: 400 }
      );
    }

    // Calculate date range (last N days including today)
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    // Fetch all users (exclude admin role)
    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .where(eq(users.role, 'USER'))
      .orderBy(users.name);

    // Fetch all discipline tracker data for date range
    const allUserData = await Promise.all(
      allUsers.map(async (user) => {
        // Fetch user settings
        const settingsResult = await db
          .select()
          .from(disciplineTrackerSettings)
          .where(eq(disciplineTrackerSettings.userId, user.id))
          .limit(1);

        // Use default settings if none exist
        const settings: DisciplineTrackerSettings = settingsResult.length > 0
          ? settingsResult[0]
          : {
              id: '',
              userId: user.id,
              tradingAccountId: null,
              maxTradesPerDay: 2,
              slValue: -80,
              beValue: 0,
              tp1Value: 80,
              tp2Value: 160,
              tp3Mode: 'manual' as const,
              tp3FixedValue: 240,
              winRateFormula: 'excludeBE' as const,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

        // Fetch rows in date range
        const rowConditions: any[] = [
          eq(disciplineTrackerRows.userId, user.id),
          gte(disciplineTrackerRows.tradeDate, startDate),
          lte(disciplineTrackerRows.tradeDate, endDate),
        ];
        if (tradingAccountId) rowConditions.push(eq(disciplineTrackerRows.tradingAccountId, tradingAccountId));

        const rows = await db
          .select()
          .from(disciplineTrackerRows)
          .where(and(...rowConditions))
          .orderBy(desc(disciplineTrackerRows.tradeDate));

        // Evaluate each row
        const evaluatedRows = rows.map((row) => {
          const evaluation = evaluateDayRow(row, settings);
          return {
            ...row,
            evaluation,
          };
        });

        return {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
          settings,
          rows: evaluatedRows,
        };
      })
    );

    // Generate all dates in range for timeline
    const timeline: Date[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      timeline.push(date);
    }

    return NextResponse.json({
      success: true,
      data: {
        timeline,
        users: allUserData,
        startDate,
        endDate,
        days,
      },
    });
  } catch (error) {
    console.error('[GET /api/admin/discipline-tracker/team-overview]', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch team overview' } },
      { status: 500 }
    );
  }
}
