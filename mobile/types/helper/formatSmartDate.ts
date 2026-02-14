import moment from "moment";

/**
 * Format a date into a human-friendly string.
 *
 * Behavior:
 *  - If the date is within the last 30 days → returns relative time
 *      e.g. "10 days ago", "3 hours ago"
 *  - If the date is older than 30 days → returns a full date
 *      e.g. "December 5th, 2025"
 *  - If the input is null, undefined, or invalid → returns an empty string.
 *
 * Examples:
 *  - formatDate(new Date())           -> "a few seconds ago"
 *  - formatDate("2026-01-10")         -> "15 days ago"
 *  - formatDate("2025-03-02")         -> "March 2nd, 2025"
 *  - formatDate(null)                -> ""
 *
 * @param date - A Date object, ISO date string, or null/undefined.
 * @returns A formatted date string for display in the UI.
 */
export function formatDate(date: string | Date | null | undefined): string {
  // Guard: no value provided
  if (!date) return "";

  const m = moment(date);

  // Guard: invalid date input
  if (!m.isValid()) return "";

  const daysDiff = moment().diff(m, "days");

  // Recent dates → "10 days ago", "2 hours ago", etc.
  if (daysDiff <= 30) {
    return m.fromNow();
  }

  // Older dates → "December 5th, 2025"
  return m.format("MMMM Do, YYYY");
}
