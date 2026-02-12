/**
 * Format a number into a short human-readable form.
 *
 * Examples:
 *  - 532        -> "532"
 *  - 1_000      -> "1K"
 *  - 1_500      -> "1.5K"
 *  - 12_000     -> "12K"
 *  - 1_000_000  -> "1M"
 *  - 2_500_000  -> "2.5M"
 *  - 1_200_000_000 -> "1.2B"
 *
 * Rules:
 *  - Uses base 1000 (K, M, B, T).
 *  - Keeps at most 1 decimal place.
 *  - Removes trailing ".0" (e.g. "1.0K" -> "1K").
 *  - Rounds correctly at boundaries (e.g. 999_999 -> "1M").
 *
 * @param value - The number to format.
 * @returns A compact string representation.
 */
export function formatNumberShort(value: number): string {
  // Handle NaN and infinities safely
  if (!Number.isFinite(value)) {
    return "0";
  }

  // Small numbers don't need formatting
  if (Math.abs(value) < 1000) {
    return String(Math.trunc(value));
  }

  const units = ["K", "M", "B", "T"];
  let unitIndex = -1;
  let num = value;

  // Use 999.5 to ensure proper rounding up at boundaries
  // e.g. 999_999 -> 1M instead of 1000K
  while (Math.abs(num) >= 999.5 && unitIndex < units.length - 1) {
    num = num / 1000;
    unitIndex++;
  }

  // Round to at most 1 decimal place
  const rounded = Math.round(num * 10) / 10;

  // Convert to string and remove trailing ".0"
  const formatted = Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toString();

  return `${formatted}${units[unitIndex]}`;
}
