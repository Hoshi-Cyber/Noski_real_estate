// src/lib/utils/index.ts
export * from './paths';

/** Convert strings like "KSh 120,000.50" to a number (120000.5). */
export function moneyToNumber(val: unknown): number | undefined {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (typeof val !== 'string') return undefined;

  // keep digits, minus and decimal point; drop currency symbols, spaces, commas, etc.
  const cleaned = val.replace(/[^\d.-]/g, '');
  if (!cleaned) return undefined;

  const n = Number(cleaned);
  return Number.isFinite(n) ? n : undefined;
}
