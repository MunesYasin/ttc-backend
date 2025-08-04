import { DateTime } from 'luxon';

/**
 * Get the current date in the user's timezone as a string in 'yyyy-MM-dd' format
 * @param timezone - The timezone identifier (e.g., 'America/New_York', 'Europe/London')
 * @returns Date string in 'yyyy-MM-dd' format
 */
export function getUserLocalDateString(timezone?: string | null): string {
  if (timezone) {
    return DateTime.now().setZone(timezone).toFormat('yyyy-MM-dd');
  }
  // fallback: use server's local date
  return DateTime.now().toFormat('yyyy-MM-dd');
}
/**
 * Get a specific date in the user's timezone as a string in 'yyyy-MM-dd' format
 * @param date - The date to format
 * @param timezone - The timezone identifier
 * @returns Date string in 'yyyy-MM-dd' format
 */
export function getDateInTimezone(date: Date, timezone: string): string {
  return DateTime.fromJSDate(date).setZone(timezone).toFormat('yyyy-MM-dd');
}

/**
 * Create a Date object from local date components (avoids UTC conversion issues)
 * @param year - Full year (e.g., 2025)
 * @param month - Month (1-12)
 * @param day - Day of month
 * @returns Date object in local timezone
 */
export function createLocalDate(
  year: number,
  month: number,
  day: number,
): Date {
  return new Date(year, month - 1, day);
}
