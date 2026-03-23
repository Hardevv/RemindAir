export const DEBOUNCE_DELAY = 1000; // milliseconds
export const INTERVAL_DELAY = 5_000;
export const MAX_PAST_MS = 5 * 60 * 1000; // 5 minutes
export const REMINDER_KEY = "🔔";
export const REMINDER_ID_KEY = "^r-";
export const REMINDER_ID_KEY_REGEXP = /\^r-\d+/;
export const REMINDER_REGEXP = /🔔\s+(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})\s+\^r-(\d+-[0-9a-zA-Z])/;
export const REDIRECTION_PAGE_URL = "https://hardevv.github.io/obsidian-notifier";
/** Marches every type of the checkbox - [#] where `#` means any character, it also matches checkbox that starts with * [ ] */
export const CHECKBOX_REGEX = /(?:[-*]\s*\[[^\]]\]\s*)?/;

export const DATA_PATH = `${process.cwd()}/data.json`;
