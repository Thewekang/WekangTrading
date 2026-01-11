/**
 * Export Service
 * Handle data export in various formats (CSV, PDF)
 */

import { db } from '@/lib/db';
import { individualTrades } from '@/lib/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import type { IndividualTrade } from '@/lib/db/schema/trades';

export interface ExportFilters {
  userId: string;
  startDate?: Date;
  endDate?: Date;
  result?: 'WIN' | 'LOSS';
  marketSession?: 'ASIA' | 'EUROPE' | 'US' | 'OVERLAP';
  sopFollowed?: boolean;
  minProfitLoss?: number;
  maxProfitLoss?: number;
}

/**
 * Get trades for export with filters
 */
export async function getTradesForExport(filters: ExportFilters): Promise<IndividualTrade[]> {
  const {
    userId,
    startDate,
    endDate,
    result,
    marketSession,
    sopFollowed,
    minProfitLoss,
    maxProfitLoss,
  } = filters;

  const conditions = [eq(individualTrades.userId, userId)];

  if (startDate) {
    conditions.push(gte(individualTrades.tradeTimestamp, Math.floor(startDate.getTime() / 1000)));
  }
  if (endDate) {
    conditions.push(lte(individualTrades.tradeTimestamp, Math.floor(endDate.getTime() / 1000)));
  }
  if (result) conditions.push(eq(individualTrades.result, result));
  if (marketSession) conditions.push(eq(individualTrades.marketSession, marketSession));
  if (sopFollowed !== undefined) conditions.push(eq(individualTrades.sopFollowed, sopFollowed));
  if (minProfitLoss !== undefined) conditions.push(gte(individualTrades.profitLossUsd, minProfitLoss));
  if (maxProfitLoss !== undefined) conditions.push(lte(individualTrades.profitLossUsd, maxProfitLoss));

  const trades = await db
    .select()
    .from(individualTrades)
    .where(and(...conditions))
    .orderBy(desc(individualTrades.tradeTimestamp));

  return trades;
}

/**
 * Generate CSV content from trades
 */
export function generateCSV(trades: IndividualTrade[]): string {
  // CSV Headers
  const headers = [
    'Trade ID',
    'Date & Time',
    'Market Session',
    'Result',
    'SOP Followed',
    'Profit/Loss (USD)',
    'Notes'
  ];

  // CSV Rows
  const rows = trades.map(trade => [
    trade.id,
    new Date(trade.tradeTimestamp * 1000).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }),
    trade.marketSession,
    trade.result,
    trade.sopFollowed ? 'Yes' : 'No',
    trade.profitLossUsd.toFixed(2),
    trade.notes ? `"${trade.notes.replace(/"/g, '""')}"` : ''
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  return csvContent;
}

/**
 * Generate summary statistics for export
 */
export function generateSummaryStats(trades: IndividualTrade[]) {
  const totalTrades = trades.length;
  const totalWins = trades.filter(t => t.result === 'WIN').length;
  const totalLosses = trades.filter(t => t.result === 'LOSS').length;
  const totalSopFollowed = trades.filter(t => t.sopFollowed).length;
  const netProfitLoss = trades.reduce((sum, t) => sum + t.profitLossUsd, 0);
  
  const winRate = totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0;
  const sopRate = totalTrades > 0 ? (totalSopFollowed / totalTrades) * 100 : 0;
  const avgProfitLoss = totalTrades > 0 ? netProfitLoss / totalTrades : 0;
  
  // Session breakdown
  const sessionStats = {
    ASIA: trades.filter(t => t.marketSession === 'ASIA').length,
    EUROPE: trades.filter(t => t.marketSession === 'EUROPE').length,
    US: trades.filter(t => t.marketSession === 'US').length,
    OVERLAP: trades.filter(t => t.marketSession === 'OVERLAP').length,
  };

  return {
    totalTrades,
    totalWins,
    totalLosses,
    totalSopFollowed,
    netProfitLoss,
    winRate,
    sopRate,
    avgProfitLoss,
    sessionStats,
  };
}

/**
 * Generate PDF-ready HTML content
 */
export function generatePDFHTML(
  trades: IndividualTrade[],
  userName: string,
  filters: {
    startDate?: string;
    endDate?: string;
    result?: string;
    marketSession?: string;
  }
): string {
  const stats = generateSummaryStats(trades);
  
  const filterDescription = [];
  if (filters.startDate) filterDescription.push(`From: ${new Date(filters.startDate).toLocaleDateString()}`);
  if (filters.endDate) filterDescription.push(`To: ${new Date(filters.endDate).toLocaleDateString()}`);
  if (filters.result) filterDescription.push(`Result: ${filters.result}`);
  if (filters.marketSession) filterDescription.push(`Session: ${filters.marketSession}`);
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Trading Performance Report</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
      color: #333;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
    }
    .header h1 {
      margin: 0;
      color: #2563eb;
      font-size: 28px;
    }
    .header .subtitle {
      color: #666;
      font-size: 14px;
      margin-top: 5px;
    }
    .info-section {
      margin-bottom: 30px;
    }
    .info-section h2 {
      color: #2563eb;
      font-size: 18px;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 10px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 30px;
    }
    .stat-card {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      text-align: center;
    }
    .stat-card .label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .stat-card .value {
      font-size: 24px;
      font-weight: bold;
      color: #111;
    }
    .stat-card .value.positive { color: #16a34a; }
    .stat-card .value.negative { color: #dc2626; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
      font-size: 12px;
    }
    th {
      background-color: #2563eb;
      color: white;
      padding: 12px 8px;
      text-align: left;
      font-weight: 600;
    }
    td {
      padding: 10px 8px;
      border-bottom: 1px solid #e5e7eb;
    }
    tr:nth-child(even) {
      background-color: #f9fafb;
    }
    .badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
    }
    .badge.win { background: #dcfce7; color: #16a34a; }
    .badge.loss { background: #fee2e2; color: #dc2626; }
    .badge.sop-yes { background: #dbeafe; color: #2563eb; }
    .badge.sop-no { background: #f3f4f6; color: #6b7280; }
    .footer {
      margin-top: 40px;
      text-align: center;
      color: #666;
      font-size: 12px;
      border-top: 1px solid #e5e7eb;
      padding-top: 20px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🏍️💰 WekangTrading Journal</h1>
    <div class="subtitle">Trading Performance Report</div>
    <div class="subtitle">Generated on ${new Date().toLocaleString()}</div>
  </div>

  <div class="info-section">
    <h2>📋 Report Information</h2>
    <p><strong>Trader:</strong> ${userName}</p>
    <p><strong>Period:</strong> ${filterDescription.length > 0 ? filterDescription.join(' | ') : 'All Trades'}</p>
    <p><strong>Total Trades:</strong> ${stats.totalTrades}</p>
  </div>

  <div class="info-section">
    <h2>📊 Performance Summary</h2>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="label">Win Rate</div>
        <div class="value">${stats.winRate.toFixed(1)}%</div>
      </div>
      <div class="stat-card">
        <div class="label">SOP Rate</div>
        <div class="value">${stats.sopRate.toFixed(1)}%</div>
      </div>
      <div class="stat-card">
        <div class="label">Net P/L</div>
        <div class="value ${stats.netProfitLoss >= 0 ? 'positive' : 'negative'}">
          ${stats.netProfitLoss >= 0 ? '+' : ''}$${stats.netProfitLoss.toFixed(2)}
        </div>
      </div>
      <div class="stat-card">
        <div class="label">Avg P/L</div>
        <div class="value ${stats.avgProfitLoss >= 0 ? 'positive' : 'negative'}">
          ${stats.avgProfitLoss >= 0 ? '+' : ''}$${stats.avgProfitLoss.toFixed(2)}
        </div>
      </div>
    </div>
  </div>

  <div class="info-section">
    <h2>🌍 Session Breakdown</h2>
    <table style="width: 50%;">
      <tr>
        <th>Session</th>
        <th>Trades</th>
        <th>Percentage</th>
      </tr>
      <tr>
        <td>🌏 Asia</td>
        <td>${stats.sessionStats.ASIA}</td>
        <td>${((stats.sessionStats.ASIA / stats.totalTrades) * 100).toFixed(1)}%</td>
      </tr>
      <tr>
        <td>🇪🇺 Europe</td>
        <td>${stats.sessionStats.EUROPE}</td>
        <td>${((stats.sessionStats.EUROPE / stats.totalTrades) * 100).toFixed(1)}%</td>
      </tr>
      <tr>
        <td>🇺🇸 US</td>
        <td>${stats.sessionStats.US}</td>
        <td>${((stats.sessionStats.US / stats.totalTrades) * 100).toFixed(1)}%</td>
      </tr>
      <tr>
        <td>🔄 Overlap</td>
        <td>${stats.sessionStats.OVERLAP}</td>
        <td>${((stats.sessionStats.OVERLAP / stats.totalTrades) * 100).toFixed(1)}%</td>
      </tr>
    </table>
  </div>

  <div class="info-section">
    <h2>💼 Trade Details</h2>
    <table>
      <thead>
        <tr>
          <th>Date & Time</th>
          <th>Session</th>
          <th>Result</th>
          <th>SOP</th>
          <th>P/L (USD)</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>
        ${trades.map(trade => `
          <tr>
            <td>${new Date(trade.tradeTimestamp).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</td>
            <td>${trade.marketSession}</td>
            <td><span class="badge ${trade.result === 'WIN' ? 'win' : 'loss'}">${trade.result}</span></td>
            <td><span class="badge ${trade.sopFollowed ? 'sop-yes' : 'sop-no'}">${trade.sopFollowed ? 'Yes' : 'No'}</span></td>
            <td style="color: ${trade.profitLossUsd >= 0 ? '#16a34a' : '#dc2626'}; font-weight: 600;">
              ${trade.profitLossUsd >= 0 ? '+' : ''}$${trade.profitLossUsd.toFixed(2)}
            </td>
            <td>${trade.notes || '-'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="footer">
    <p>This report was generated by WekangTrading Journal</p>
    <p>For internal use only. Keep your trading data confidential.</p>
  </div>
</body>
</html>
  `;

  return html;
}
