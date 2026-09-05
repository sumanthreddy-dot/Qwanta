/**
 * Centralized Indian Rupee (INR) currency conversion & formatting utilities.
 *
 * Configurable exchange rate and standard Indian numeral grouping:
 * 1,000 -> ₹1,000
 * 1,00,000 -> ₹1,00,000 (1 Lakh)
 * 10,00,000 -> ₹10,00,000 (10 Lakh)
 * 1,00,00,000 -> ₹1,00,00,000 (1 Crore)
 */

// Configurable exchange rate for demonstration / operational simulation
// 1 USD = ₹83.50 INR (configurable via localStorage / Settings)
export const DEFAULT_USD_TO_INR_RATE = 83.50;

const STORAGE_KEY = 'spambyte_usd_inr_rate';

/**
 * Get active USD to INR conversion rate.
 */
export function getExchangeRate(): number {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  }
  return DEFAULT_USD_TO_INR_RATE;
}

/**
 * Update the USD to INR conversion rate.
 */
export function setExchangeRate(rate: number): void {
  if (typeof window !== 'undefined' && rate > 0) {
    localStorage.setItem(STORAGE_KEY, rate.toString());
    window.dispatchEvent(new CustomEvent('currency-rate-changed', { detail: rate }));
  }
}

/**
 * Convert USD to INR using active exchange rate.
 */
export function convertUsdToInr(usd: number): number {
  return (usd || 0) * getExchangeRate();
}

/**
 * Format an amount in INR with standard Indian numeral grouping (e.g. ₹1,00,000)
 * or compact readable Indian units (₹77.88 Lakh, ₹1.42 Crore).
 */
export interface FormatINROptions {
  compact?: boolean;
  precision?: number;
  showSymbol?: boolean;
}

export function formatINR(
  amountInINR: number,
  options: FormatINROptions = {}
): string {
  const { compact = false, precision = 2, showSymbol = true } = options;
  const num = Number(amountInINR) || 0;
  const symbol = showSymbol ? '₹' : '';

  if (compact) {
    const abs = Math.abs(num);
    const sign = num < 0 ? '-' : '';

    if (abs >= 10000000) {
      // 1 Crore = 10,000,000
      const cr = abs / 10000000;
      return `${sign}${symbol}${cr.toFixed(precision)} Crore`;
    }
    if (abs >= 100000) {
      // 1 Lakh = 100,000
      const lakh = abs / 100000;
      return `${sign}${symbol}${lakh.toFixed(precision)} Lakh`;
    }
    if (abs >= 1000) {
      // Thousand
      const k = abs / 1000;
      return `${sign}${symbol}${k.toFixed(1)}k`;
    }
    return `${sign}${symbol}${abs.toLocaleString('en-IN', { maximumFractionDigits: precision })}`;
  }

  // Full Indian numeral system formatting
  const formatted = num.toLocaleString('en-IN', {
    maximumFractionDigits: precision,
    minimumFractionDigits: 0
  });

  return `${symbol}${formatted}`;
}

/**
 * Helper to directly convert a USD value to INR and format it.
 */
export function formatUsdAsINR(
  usdAmount: number,
  options: FormatINROptions = {}
): string {
  const inr = convertUsdToInr(usdAmount);
  return formatINR(inr, options);
}
