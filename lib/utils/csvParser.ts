/**
 * CSV Parser Utility
 * Parse and validate CSV files for trade import
 */

import Papa from 'papaparse';

export interface CSVTradeRow {
  'Date & time': string;
  Result: string;
  SOP: string;
  'SOP Type': string;
  Amount: string;
  Symbol?: string;
  Notes?: string;
}

export interface ParsedTrade {
  tradeTimestamp: string; // ISO string
  result: 'WIN' | 'LOSS';
  sopFollowed: boolean;
  sopTypeName: string;
  profitLossUsd: number;
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

/**
 * Parse CSV file and validate data
 */
export function parseCSVFile(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse<CSVTradeRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const trades: ParsedTrade[] = [];
        const errors: ValidationError[] = [];

        results.data.forEach((row, index) => {
          const rowNumber = index + 2; // +1 for header, +1 for 1-based indexing
          const validation = validateAndTransformRow(row, rowNumber);

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
 */
function validateAndTransformRow(
  row: CSVTradeRow,
  rowNumber: number
): { trade: ParsedTrade | null; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  // Validate Date & time
  const dateTimeStr = row['Date & time']?.trim();
  if (!dateTimeStr) {
    errors.push({
      row: rowNumber,
      field: 'Date & time',
      message: 'Date & time is required',
    });
  }

  const tradeDate = new Date(dateTimeStr);
  if (isNaN(tradeDate.getTime())) {
    errors.push({
      row: rowNumber,
      field: 'Date & time',
      message: `Invalid date format: "${dateTimeStr}". Expected: MM/DD/YYYY HH:MM`,
    });
  }

  // Check if date is in future
  if (tradeDate > new Date()) {
    errors.push({
      row: rowNumber,
      field: 'Date & time',
      message: 'Trade date cannot be in the future',
    });
  }

  // Validate Result
  const result = row.Result?.trim().toUpperCase();
  if (!result) {
    errors.push({
      row: rowNumber,
      field: 'Result',
      message: 'Result is required',
    });
  } else if (result !== 'WIN' && result !== 'LOSS') {
    errors.push({
      row: rowNumber,
      field: 'Result',
      message: `Invalid result: "${result}". Must be WIN or LOSS`,
    });
  }

  // Validate SOP
  const sop = row.SOP?.trim().toUpperCase();
  if (!sop) {
    errors.push({
      row: rowNumber,
      field: 'SOP',
      message: 'SOP is required',
    });
  } else if (sop !== 'YES' && sop !== 'NO') {
    errors.push({
      row: rowNumber,
      field: 'SOP',
      message: `Invalid SOP: "${sop}". Must be YES or NO`,
    });
  }

  // Validate SOP Type (optional)
  const sopTypeName = row['SOP Type']?.trim();
  // SOP Type is optional, no validation needed if empty

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
  } else if (amount === 0) {
    errors.push({
      row: rowNumber,
      field: 'Amount',
      message: 'Amount cannot be zero',
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

  // If there are errors, return them
  if (errors.length > 0) {
    return { trade: null, errors };
  }

  // Transform to ParsedTrade
  const trade: ParsedTrade = {
    tradeTimestamp: tradeDate.toISOString(),
    result: result as 'WIN' | 'LOSS',
    sopFollowed: sop === 'YES',
    sopTypeName: sopTypeName || '',
    profitLossUsd: amount,
    symbol: symbol || undefined,
    notes: notes || undefined,
  };

  return { trade, errors: [] };
}

/**
 * Generate CSV template file
 */
export function generateCSVTemplate(): string {
  const headers = ['Date & time', 'Result', 'SOP', 'SOP Type', 'Amount', 'Symbol', 'Notes'];
  const exampleRow1 = ['1/12/2026 08:30', 'WIN', 'YES', 'BB Mastery', '150.50', 'EURUSD', 'Good setup'];
  const exampleRow2 = ['1/12/2026 10:45', 'LOSS', 'NO', 'W & M breakout', '-75.00', 'GBPJPY', 'Rushed entry'];
  const exampleRow3 = ['1/12/2026 14:20', 'WIN', 'YES', 'Engulfing Fail', '200.00', 'MNQ', ''];

  const rows = [headers, exampleRow1, exampleRow2, exampleRow3];
  return rows.map(row => row.join(',')).join('\n');
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
