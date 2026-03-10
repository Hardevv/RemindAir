export interface Reminder<T = Date> {
  id: string | null;
  filePath: string;
  content: string;
  dateTime: T;
  /** Cached value */
  sent: boolean;
  /** Cached value */
  deleted: boolean;
}

export interface Data {
  reminders: Reminder<string>[];
}
