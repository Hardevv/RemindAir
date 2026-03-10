import type { Data, Reminder } from "./types";
import { saveData } from "./utils";

export const handleNewReminders = (cachedReminders: Reminder<string>[], remindersFromFiles: Reminder<Date>[], data: Data) => {
  const newReminders = remindersFromFiles.map((newReminder) => {
    const existingReminder = cachedReminders.find((r: Reminder<string>) => r.id === newReminder.id);

    if (existingReminder) return null;

    return { ...newReminder, dateTime: newReminder.dateTime.toISOString() };
  });

  const combinedReminders = [...cachedReminders, ...newReminders.filter((r): r is Reminder<string> => r !== null)];
  data.reminders = combinedReminders;
  saveData(data);
};

/** Compares reminder ids from obsidian to cached ones in `data.json` if exist in `json` but not in obsidian it means reminder was deleted */
export const handleDelete = (cachedReminders: Reminder<string>[], remindersFromFiles: Reminder<Date>[], data: Data) => {
  const cachedReminderIds = cachedReminders.map((r: Reminder<string>) => r.id);
  const deletedReminders = cachedReminderIds.map((id) => {
    if (remindersFromFiles.find((r) => r.id === id)) return null;
    return id;
  });
  if (deletedReminders) {
    deletedReminders.forEach((id) => {
      const index = cachedReminders.findIndex((r: Reminder<string>) => r.id === id);
      data.reminders[index].deleted = true;
    });
    saveData(data);
  }
};

export const handleEdit = (cachedReminders: Reminder<string>[], remindersFromFiles: Reminder<Date>[], data: Data) => {
  cachedReminders.forEach((cachedReminder) => {
    const editedReminder = remindersFromFiles.find(
      (r) =>
        r.id === cachedReminder.id &&
        (r.filePath !== cachedReminder.filePath || r.content !== cachedReminder.content || r.dateTime.toISOString() !== cachedReminder.dateTime),
    );

    if (editedReminder?.id === cachedReminder.id) {
      const index = cachedReminders.findIndex((r: Reminder<string>) => r.id === editedReminder.id);
      data.reminders[index] = {
        ...editedReminder,
        dateTime: editedReminder.dateTime.toISOString(),
        sent: cachedReminder.sent,
        deleted: cachedReminder.deleted,
      };
    }

    return cachedReminder;
  });

  saveData(data);
};
