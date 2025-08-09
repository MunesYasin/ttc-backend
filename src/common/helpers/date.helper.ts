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

/**
 * Calculate date ranges for filtering based on filter type and value
 * @param filterType - Type of filter: 'day', 'year', 'month'
 * @param filterValue - Value for the filter (date string, year, month)
 * @returns Object with currentPeriodStart and currentPeriodEnd dates
 */
export function calculateDateRanges(filterType?: string, filterValue?: string) {
  let currentPeriodStart: Date;
  let currentPeriodEnd: Date;

  if (filterType === 'day' && filterValue) {
    // Specific day
    const targetDate = new Date(filterValue);
    currentPeriodStart = new Date(targetDate);
    currentPeriodStart.setHours(0, 0, 0, 0);
    currentPeriodEnd = new Date(targetDate);
    currentPeriodEnd.setHours(23, 59, 59, 999);
  } else if (filterType === 'year' && filterValue) {
    // Specific year (expecting YYYY format)
    const year = parseInt(filterValue);
    currentPeriodStart = new Date(year, 0, 1); // January 1st
    currentPeriodStart.setHours(0, 0, 0, 0);
    currentPeriodEnd = new Date(year, 11, 31); // December 31st
    currentPeriodEnd.setHours(23, 59, 59, 999);
  } else if (filterType === 'month' && filterValue) {
    // Specific month (expecting YYYY-MM format)
    const [year, month] = filterValue.split('-').map(Number);
    currentPeriodStart = new Date(year, month - 1, 1);
    currentPeriodEnd = new Date(year, month, 0);
    currentPeriodEnd.setHours(23, 59, 59, 999);
  } else {
    // Default to current month
    currentPeriodStart = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    );
    currentPeriodEnd = new Date();
  }

  return {
    currentPeriodStart,
    currentPeriodEnd,
  };
}

/**
 * Get today's date string in a specific timezone (YYYY-MM-DD format)
 * @param timezone - The timezone identifier (e.g., 'America/New_York', 'Europe/London')
 * @returns Date string in 'YYYY-MM-DD' format in the specified timezone
 */
export function getTodayInTimezone(timezone: string = 'UTC'): string {
  const today = new Date();

  // Convert to the target timezone
  const todayInTimezone = new Date(
    today.toLocaleString('en-US', { timeZone: timezone }),
  );

  // Format as YYYY-MM-DD
  return (
    todayInTimezone.getFullYear() +
    '-' +
    String(todayInTimezone.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(todayInTimezone.getDate()).padStart(2, '0')
  );
}

export const formatDateForInput = (dateStr: Date | null) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const yy = String(d.getFullYear());
  const mm = String(d.getMonth() + 1).padStart(2, '0'); // months are 0-based
  const dd = String(d.getDate()).padStart(2, '0');
  const newDate = `${yy}-${mm}-${dd}`;
  // Try parsing as ISO date first
  const date = new Date(newDate);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }
  // If it's already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
    return newDate;
  }
  return newDate;
};
