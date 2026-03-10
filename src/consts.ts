export const DEBOUNCE_DELAY = 1000; // milliseconds
export const INTERVAL_DELAY = 5_000;
export const MAX_PAST_MS = 5 * 60 * 1000; // 5 minutes
export const REMINDER_KEY = "reminder";
export const REMINDER_ID_KEY_REGEXP = new RegExp(/\^r-\d+/);
export const REMINDER_REGEXP = new RegExp(`\\[${REMINDER_KEY}::\\s*(.+?)\\]`);
