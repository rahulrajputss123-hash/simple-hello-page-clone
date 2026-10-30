/**
 * Currency symbol used throughout the application.
 * All user-facing currency displays use this constant.
 */
export const CURRENCY_SYMBOL = "$";

/**
 * Format a reward/earning/payout amount for display.
 * Always shows exactly 3 decimal places with the currency symbol prefix.
 * 
 * Examples:
 * - 0.175 -> "$0.175"
 * - 0.2 -> "$0.200"
 * - 2.5 -> "$2.500"
 * - 0 -> "$0.000"
 * 
 * @param amount - The numeric amount to format
 * @returns Formatted string with currency symbol and 3 decimals
 */
export function formatReward(amount: number): string {
  return `${CURRENCY_SYMBOL}${amount.toFixed(3)}`;
}

/**
 * Format a wallet balance or withdrawal amount for display.
 * Shows exactly 2 decimal places with the currency symbol prefix.
 * 
 * Examples:
 * - 10.5 -> "$10.50"
 * - 0 -> "$0.00"
 * 
 * @param amount - The numeric amount to format
 * @returns Formatted string with currency symbol and 2 decimals
 */
export function formatBalance(amount: number): string {
  return `${CURRENCY_SYMBOL}${amount.toFixed(2)}`;
}
