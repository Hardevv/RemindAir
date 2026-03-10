import { execSync } from "child_process";
import type { Data, Reminder } from "./types";
import { cleanReminderContent, getData, getObsidianAdvancedUriBlockLink, saveData } from "./utils";
import { REMINDER_ID_KEY_REGEXP, REMINDER_KEY, REMINDER_REGEXP } from "./consts";
import { logger } from "./logger";

const handleNewReminders = (cachedReminders: Reminder<string>[], remindersFromFiles: Reminder<Date>[], data: Data) => {
  const newReminders = remindersFromFiles
    .map((newReminder) => {
      if (!newReminder.id) return null;

      const existingReminder = cachedReminders.find((r: Reminder<string>) => r?.id === newReminder.id);

      if (existingReminder) return null;

      if (!validateDateReminder(newReminder)) return;

      return { ...newReminder, dateTime: newReminder.dateTime.toISOString() };
    })
    .filter((r): r is Reminder<string> => Boolean(r));

  logger.info(`Found ${newReminders.length} new reminders`);

  const combinedReminders = [...cachedReminders, ...newReminders];
  data.reminders = combinedReminders;
  saveData(data);
};

/** Compares reminder ids from obsidian to cached ones in `data.json` if exist in `json` but not in obsidian it means reminder was deleted */
const handleDelete = (cachedReminders: Reminder<string>[], remindersFromFiles: Reminder<Date>[], data: Data) => {
  const cachedReminderIds = cachedReminders.map((r: Reminder<string>) => r?.id);
  const deletedReminders = cachedReminderIds
    .map((id) => {
      if (remindersFromFiles.find((r) => r?.id === id)) return null;
      return id;
    })
    .filter(Boolean);
  if (deletedReminders) {
    deletedReminders.forEach((id) => {
      const index = cachedReminders.findIndex((r: Reminder<string>) => r?.id === id && !r?.deleted);
      if (index === -1) return;
      data.reminders[index].deleted = true;
      logger.info(`Reminder with id ${id} marked as deleted`);
    });
    saveData(data);
  }
};

const handleEdit = (cachedReminders: Reminder<string>[], remindersFromFiles: Reminder<Date>[], data: Data) => {
  cachedReminders.forEach((cachedReminder) => {
    const editedReminder = remindersFromFiles.find(
      (r) =>
        r.id === cachedReminder?.id &&
        (r.filePath !== cachedReminder.filePath || r.content !== cachedReminder.content || r.dateTime.toISOString() !== cachedReminder.dateTime),
    );

    if (editedReminder?.id === cachedReminder?.id) {
      const index = cachedReminders.findIndex((r: Reminder<string>) => r?.id === editedReminder?.id);
      if (!validateDateReminder(editedReminder)) return;
      data.reminders[index] = {
        ...editedReminder,
        dateTime: editedReminder.dateTime.toISOString(),
        sent: cachedReminder.sent,
        deleted: cachedReminder.deleted,
      };
      logger.info(`Reminder with id ${editedReminder.id} was edited, updated cache`);
    }

    return cachedReminder;
  });

  saveData(data);
};

/** fetches reminders form Obsidian vault via new Obsidian CLI */
const getObsidianReminders = (): Reminder[] => {
  const searchResult = execSync(`obsidian search:context query="/\\[${REMINDER_KEY}::/"`, { encoding: "utf-8" }).trim();
  const reminderLines = searchResult.split("\n");

  return reminderLines.map((line) => {
    const reminderTime = line.match(REMINDER_REGEXP)?.[1];
    const reminderId = line.match(REMINDER_ID_KEY_REGEXP)?.[0];

    return {
      id: reminderId || null,
      filePath: line.split(":")[0], // file name is before the first colon
      content: line,
      dateTime: reminderTime ? new Date(reminderTime) : new Date(), // Default to current time if parsing fails
      sent: false,
      deleted: false,
    };
  });
};

export const watchLogic = () => {
  const remindersFromFiles = getObsidianReminders();
  const data = getData();
  const cachedReminders = data.reminders || [];

  handleNewReminders(cachedReminders, remindersFromFiles, data);
  handleDelete(cachedReminders, remindersFromFiles, data);
  handleEdit(cachedReminders, remindersFromFiles, data);
};

const sentObsidianWebhook = async (reminder: Reminder<string>, vaultName: string) => {
  const reminderId = reminder.content?.split("^r-")[1];
  const obsidianLink = getObsidianAdvancedUriBlockLink(vaultName, reminder.filePath, `^r-${reminderId}`);

  try {
    await fetch(process.env.DISCORD_WEBHOOK_URL || "", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: `🔔 **Reminder:** ${cleanReminderContent(reminder.content)}`,
        embeds: [
          {
            title: "Open in obsidian",
            description: `https://hardevv.github.io/obsidian-notifier?deeplink=${encodeURIComponent(obsidianLink)}`, // TODO: use .env
            color: 0x7c3aed,
          },
        ],
      }),
    });
    logger.info(`Sent webhook for reminder with id ${reminder.id}`);
  } catch (err) {
    logger.error(`Failed to send webhook for reminder with id ${reminder.id}: ${(err as Error).message}`);
  }
};

export const checkPastRemindersAndSend = async (vaultName: string) => {
  const now = new Date();
  const data = getData();
  for (const reminder of data.reminders) {
    if (!validateStringReminder(reminder)) {
      logger.error({ reminder }, "Invalid reminder format");
      return;
    }
    const diff = now.getTime() - new Date(reminder.dateTime).getTime();
    if (diff >= 0 && !reminder.sent && reminder.id && !reminder.deleted) {
      const index = data.reminders.findIndex((r) => r.id === reminder.id);
      data.reminders[index].sent = true;
      await sentObsidianWebhook(reminder, vaultName);
      saveData(data);
    }
  }
};

const validateDateReminder = (reminder: any): reminder is Reminder<Date> => {
  try {
    return !!(reminder.id && reminder.filePath && reminder.dateTime && reminder.dateTime.toISOString());
  } catch {
    return false;
  }
};

const validateStringReminder = (reminder: any): reminder is Reminder<String> => {
  try {
    return !!(reminder.id && reminder.filePath && reminder.dateTime && typeof reminder.dateTime === "string");
  } catch {
    return false;
  }
};
