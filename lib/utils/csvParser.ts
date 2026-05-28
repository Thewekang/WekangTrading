/**
 * CSV Parser Utility
 * Parse and validate CSV files for trade import
 */

import Papa from 'papaparse';
import { datetimeLocalToUTC } from './timezones';

export interface CSVTradeRow {
  'Date & time': string;
  Type?: string; // 'Transaction' or 'Commission' — optional, defaults to 'Transaction' for backward compat
  Result?: string;
  SOP?: string;
  'SOP Type'?: string;
  Amount: string;
  Symbol?: string;
  Notes?: string;
}

export interface ParsedTrade {
  entryType: 'TRANSACTION' | 'COMMISSION';
  tradeTimestamp: string; // ISO string
  result?: 'WIN' | 'LOSS' | 'BE'; // undefined for COMMISSION entries
  sopFollowed?: boolean;   // undefined for COMMISSION entries
  sopTypeName?: string;    // undefined for COMMISSION entries
  profitLossUsd: number;   // For COMMISSION: always negative (stored cost); 0 allowed for BE
  symbol?: string;
  notes?: string;
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export interface ParseResult {
  trades: ParsedTrade[];
  errors: ValidationError[];
  rowCount: number;
}

type CSVDateOrder = 'DMY' | 'MDY';

/**
 * Parse CSV file and validate data
 * @param file CSV file to parse
 * @param timezone Timezone to interpret timestamps in (e.g., 'Asia/Kuala_Lumpur')
 */
export function parseCSVFile(file: File, timezone: string): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse<CSVTradeRow>(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: '', // auto-detect: handles both ',' and ';' delimiters
      complete: (results) => {
        const trades: ParsedTrade[] = [];
        const errors: ValidationError[] = [];
        const detectedDateOrder = detectCSVDateOrder(results.data);

        results.data.forEach((row, index) => {
          const rowNumber = index + 2; // +1 for header, +1 for 1-based indexing
          const validation = validateAndTransformRow(row, rowNumber, timezone, detectedDateOrder);

          if (validation.errors.length > 0) {
            errors.push(...validation.errors);
          } else if (validation.trade) {
            trades.push(validation.trade);
          }
        });

        resolve({
          trades,
          errors,
          rowCount: results.data.length,
        });
      },
      error: (error) => {
        reject(new Error(`CSV parsing failed: ${error.message}`));
      },
    });
  });
}

/**
 * Validate and transform a single CSV row
 * @param timezone Timezone to interpret timestamps in
 */
function validateAndTransformRow(
  row: CSVTradeRow,
  rowNumber: number,
  timezone: string,
  dateOrderHint: CSVDateOrder | null
): { trade: ParsedTrade | null; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  // Determine entry type (default to Transaction for backward compatibility)
  const rawType = row.Type?.trim();
  let entryType: 'TRANSACTION' | 'COMMISSION' = 'TRANSACTION';
  if (rawType) {
    const upperType = rawType.toUpperCase();
    if (upperType === 'COMMISSION') {
      entryType = 'COMMISSION';
    } else if (upperType !== 'TRANSACTION') {
      errors.push({
        row: rowNumber,
        field: 'Type',
        message: `Invalid type: "${rawType}". Must be Transaction or Commission`,
      });
    }
  }

  // Validate Date & time
  const dateTimeStr = row['Date & time']?.trim();
  if (!dateTimeStr) {
    errors.push({
      row: rowNumber,
      field: 'Date & time',
      message: 'Date & time is required',
    });
  }

  // Parse D/M/YYYY H:mm or M/D/YYYY H:mm and convert to datetime-local format.
  // If a non-ambiguous file-level pattern exists, prefer it for all rows.
  let tradeDate: Date | null = null;
  const parsedDate = parseCsvDateTime(dateTimeStr, timezone, dateOrderHint);
  if (parsedDate.ok) {
    tradeDate = parsedDate.date;
  } else {
    errors.push({
      row: rowNumber,
      field: 'Date & time',
      message: parsedDate.message,
    });
  }

  // Check if date is in future (using UTC)
  // Allow up to +1 day to accommodate timezone differences (e.g. UTC+8 users importing UTC timestamps
  // while their local date is already tomorrow relative to UTC)
  if (tradeDate) {
    const maxAllowedDate = new Date();
    maxAllowedDate.setDate(maxAllowedDate.getDate() + 1);
    maxAllowedDate.setHours(23, 59, 59, 999);
    if (tradeDate > maxAllowedDate) {
      errors.push({
        row: rowNumber,
        field: 'Date & time',
        message: 'Trade date cannot be in the future',
      });
    }
  }

  // Validate Result — only required for TRANSACTION entries
  const result = row.Result?.trim().toUpperCase();
  if (entryType === 'TRANSACTION') {
    if (!result) {
      errors.push({
        row: rowNumber,
        field: 'Result',
        message: 'Result is required for Transaction entries',
      });
    } else if (result !== 'WIN' && result !== 'LOSS' && result !== 'BE') {
      errors.push({
        row: rowNumber,
        field: 'Result',
        message: `Invalid result: "${result}". Must be WIN, LOSS, or BE`,
      });
    }
  }

  // Validate SOP — only required for TRANSACTION entries
  const sop = row.SOP?.trim().toUpperCase();
  if (entryType === 'TRANSACTION') {
    if (!sop) {
      errors.push({
        row: rowNumber,
        field: 'SOP',
        message: 'SOP is required for Transaction entries',
      });
    } else if (sop !== 'YES' && sop !== 'NO') {
      errors.push({
        row: rowNumber,
        field: 'SOP',
        message: `Invalid SOP: "${sop}". Must be YES or NO`,
      });
    }
  }

  // Validate SOP Type (optional, TRANSACTION only)
  const sopTypeName = entryType === 'TRANSACTION' ? (row['SOP Type']?.trim() || '') : '';

  // Validate Amount
  const amountStr = row.Amount?.trim();
  if (!amountStr) {
    errors.push({
      row: rowNumber,
      field: 'Amount',
      message: 'Amount is required',
    });
  }

  const amount = parseFloat(amountStr);
  if (isNaN(amount)) {
    errors.push({
      row: rowNumber,
      field: 'Amount',
      message: `Invalid amount: "${amountStr}". Must be a number`,
    });
  } else if (amount === 0 && result !== 'BE' && entryType !== 'COMMISSION') {
    errors.push({
      row: rowNumber,
      field: 'Amount',
      message: 'Amount cannot be zero (use BE result for break-even trades)',
    });
  } else if (entryType === 'COMMISSION' && amount > 0) {
    // Commission amounts in CSV must be negative values (e.g. -3.50)
    errors.push({
      row: rowNumber,
      field: 'Amount',
      message: 'Commission amount must be a negative number (e.g., -3.50)',
    });
  }

  // Validate Symbol (optional, from Feature 1)
  const symbol = row.Symbol?.trim().toUpperCase();
  if (symbol) {
    if (symbol.length < 2 || symbol.length > 10) {
      errors.push({
        row: rowNumber,
        field: 'Symbol',
        message: 'Symbol must be 2-10 characters',
      });
    }
    if (!/^[A-Z0-9]+$/.test(symbol)) {
      errors.push({
        row: rowNumber,
        field: 'Symbol',
        message: 'Symbol must contain only uppercase letters and numbers',
      });
    }
  }

  // Validate Notes (optional)
  const notes = row.Notes?.trim();
  if (notes && notes.length > 500) {
    errors.push({
      row: rowNumber,
      field: 'Notes',
      message: 'Notes cannot exceed 500 characters',
    });
  }

  // Ensure tradeDate was successfully parsed
  if (!tradeDate) {
    errors.push({
      row: rowNumber,
      field: 'Date & time',
      message: 'Failed to parse date',
    });
  }

  // If there are errors, return them
  if (errors.length > 0) {
    return { trade: null, errors };
  }

  // Transform to ParsedTrade (tradeDate is guaranteed to be non-null here)
  // For COMMISSION entries: user enters negative value directly (e.g. -3.50), use as-is
  const finalAmount = entryType === 'COMMISSION' ? -Math.abs(amount) : amount;

  if (entryType === 'COMMISSION') {
    const trade: ParsedTrade = {
      entryType: 'COMMISSION',
      tradeTimestamp: tradeDate!.toISOString(),
      profitLossUsd: finalAmount,
      symbol: symbol || undefined,
      notes: notes || undefined,
    };
    return { trade, errors: [] };
  }

  const trade: ParsedTrade = {
    entryType: 'TRANSACTION',
    tradeTimestamp: tradeDate!.toISOString(),
    result: result as 'WIN' | 'LOSS' | 'BE',
    sopFollowed: sop === 'YES',
    sopTypeName: sopTypeName || '',
    profitLossUsd: finalAmount,
    symbol: symbol || undefined,
    notes: notes || undefined,
  };

  return { trade, errors: [] };
}

/**
 * Generate CSV template file
 */
export function generateCSVTemplate(): string {
  const headers = ['Date & time', 'Type', 'Result', 'SOP', 'SOP Type', 'Amount', 'Symbol', 'Notes'];
  const exampleRow1 = ['1/12/2026 08:30', 'Transaction', 'WIN', 'YES', 'BB Mastery', '150.50', 'EURUSD', 'Good setup'];
  const exampleRow2 = ['1/12/2026 10:45', 'Transaction', 'LOSS', 'NO', 'W & M breakout', '-75.00', 'GBPJPY', 'Rushed entry'];
  const exampleRow3 = ['1/12/2026 14:20', 'Transaction', 'WIN', 'YES', 'Engulfing Fail', '200.00', 'MNQ', ''];
  const exampleRowBE = ['1/12/2026 12:00', 'Transaction', 'BE', 'YES', '', '0', 'XAUUSD', 'Break-even trade'];
  const exampleRow4 = ['1/12/2026 08:30', 'Commission', '', '', '', '-3.50', 'EURUSD', 'Broker commission'];

  const rows = [headers, exampleRow1, exampleRow2, exampleRow3, exampleRowBE, exampleRow4];
  return rows.map(row => row.join(',')).join('\n');
}

function detectCSVDateOrder(rows: CSVTradeRow[]): CSVDateOrder | null {
  for (const row of rows) {
    const value = row['Date & time']?.trim();
    if (!value) continue;

    const parts = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/);
    if (!parts) continue;

    const first = parseInt(parts[1], 10);
    const second = parseInt(parts[2], 10);

    if (first > 12 && second <= 12) {
      return 'DMY';
    }

    if (second > 12 && first <= 12) {
      return 'MDY';
    }
  }

  return null;
}

function parseCsvDateTime(
  value: string | undefined,
  timezone: string,
  dateOrderHint: CSVDateOrder | null
):
  | { ok: true; date: Date }
  | { ok: false; message: string } {
  const dateTimeStr = value?.trim();
  if (!dateTimeStr) {
    return { ok: false, message: 'Date & time is required' };
  }

  const parts = dateTimeStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/);
  if (!parts) {
    return {
      ok: false,
      message: `Invalid date format: "${dateTimeStr}". Expected: D/M/YYYY H:mm or M/D/YYYY H:mm`,
    };
  }

  const first = parseInt(parts[1], 10);
  const second = parseInt(parts[2], 10);
  const year = parseInt(parts[3], 10);
  const hour = parseInt(parts[4], 10);
  const minute = parseInt(parts[5], 10);

  const ordersToTry: CSVDateOrder[] = dateOrderHint
    ? [dateOrderHint, dateOrderHint === 'DMY' ? 'MDY' : 'DMY']
    : ['MDY', 'DMY'];

  for (const order of ordersToTry) {
    const month = order === 'DMY' ? second : first;
    const day = order === 'DMY' ? first : second;

    if (!isValidDateParts(year, month, day, hour, minute)) {
      continue;
    }

    const datetimeLocalStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

    try {
      const tradeDate = datetimeLocalToUTC(datetimeLocalStr, timezone);
      if (!isNaN(tradeDate.getTime())) {
        return { ok: true, date: tradeDate };
      }
    } catch {
      // Try next order
    }
  }

  return {
    ok: false,
    message: `Failed to parse date: "${dateTimeStr}"`,
  };
}

function isValidDateParts(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number
): boolean {
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (hour < 0 || hour > 23) return false;
  if (minute < 0 || minute > 59) return false;

  const maxDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day <= maxDay;
}

/**
 * Download CSV template
 */
export function downloadCSVTemplate(): void {
  const csv = generateCSVTemplate();
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', 'trades_import_template.csv');
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
