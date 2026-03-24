export interface Reminder<T = Date> {
  vaultName: string;
  id: string | null;
  /** Relative path to vault (vault is root for that path) */
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
