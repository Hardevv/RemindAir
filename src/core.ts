import { execSync } from "child_process";
import type { Data, Reminder } from "./types";
import { cleanReminderContent, getData, getObsidianAdvancedUriBlockLink, saveData, validateDateReminder, validateStringReminder } from "./utils";
import { REDIRECTION_PAGE_URL, REMINDER_ID_KEY, REMINDER_KEY, REMINDER_REGEXP } from "./consts";
import { logger } from "./logger";

const handleNewReminders = (cachedReminders: Reminder<string>[], remindersFromObsidian: Reminder<Date>[], data: Data) => {
  const cachedIds = new Set(cachedReminders.map((r) => r?.id).filter((id): id is string => Boolean(id)));
  const newReminders: Reminder<string>[] = [];

  for (const reminder of remindersFromObsidian) {
    if (!reminder.id) continue;
    if (cachedIds.has(reminder.id)) continue;
    if (!validateDateReminder(reminder)) continue;

    newReminders.push({ ...reminder, dateTime: reminder.dateTime.toISOString() });
  }

  logger.info(`Found ${newReminders.length} new reminders`);

  if (newReminders.length === 0) return;

  data.reminders = [...cachedReminders, ...newReminders];
  saveData(data);
};

/** Compares reminder ids from obsidian to cached ones in `data.json` if exist in `json` but not in obsidian it means reminder was deleted */
const handleDelete = (cachedReminders: Reminder<string>[], remindersFromObsidian: Reminder<Date>[], data: Data) => {
  if (remindersFromObsidian.length === 0) return;

  const cachedReminderIds = cachedReminders.map((r: Reminder<string>) => r?.id);
  const deletedReminders = cachedReminderIds
    .map((id) => {
      if (remindersFromObsidian.find((r) => r?.id === id)) return null;
      return id;
    })
    .filter(Boolean);
  if (deletedReminders.length > 0) {
    deletedReminders.forEach((id) => {
      const index = cachedReminders.findIndex((r: Reminder<string>) => r?.id === id && !r?.deleted);
      if (index === -1) return;
      data.reminders[index].deleted = true;
      logger.info(`Reminder with id ${id} marked as deleted`);
    });
    saveData(data);
  }
};

const handleEdit = (cachedReminders: Reminder<string>[], remindersFromObsidian: Reminder<Date>[], data: Data) => {
  cachedReminders.forEach((cachedReminder) => {
    const editedReminder = remindersFromObsidian.find(
      (r) =>
        r.id === cachedReminder?.id &&
        (r.filePath !== cachedReminder.filePath || r.content !== cachedReminder.content || r.dateTime.toISOString() !== cachedReminder.dateTime),
    );

    if (editedReminder?.id === cachedReminder?.id) {
      const index = cachedReminders.findIndex((r: Reminder<string>) => r?.id === editedReminder?.id);
      if (!validateDateReminder(editedReminder)) return;
      const hasDateChanged = editedReminder.dateTime.toISOString() !== cachedReminder.dateTime;
      data.reminders[index] = {
        ...editedReminder,
        dateTime: editedReminder.dateTime.toISOString(),
        sent: hasDateChanged ? false : cachedReminder.sent,
        deleted: false,
      };
      logger.info(`Reminder with id ${editedReminder.id} was edited, updated cache`);
    }

    return cachedReminder;
  });

  saveData(data);
};

/** fetches reminders form Obsidian vault via new Obsidian CLI */
const getObsidianReminders = (): Reminder[] => {
  const searchResult = execSync(`obsidian search:context query="/${REMINDER_KEY}/"`, { encoding: "utf-8" }).trim();
  const reminderLines = searchResult.split("\n");

  return reminderLines
    .map((line) => {
      const reminderMatch = line.match(REMINDER_REGEXP);
      const reminderTime = reminderMatch?.[1];
      const reminderId = reminderMatch?.[2] ? `${REMINDER_ID_KEY}${reminderMatch[2]}` : undefined;

      if (!reminderTime || !reminderId) return null;

      return {
        id: reminderId,
        filePath: line.split(":")[0], // file name is before the first colon
        content: line,
        dateTime: new Date(reminderTime),
        sent: false,
        deleted: false,
      };
    })
    .filter(Boolean) as Reminder[];
};

/** It checks md files and update cache of the reminders to handle new, edited, deleted reminders */
export const watchLogic = () => {
  const remindersFromObsidian = getObsidianReminders();
  const data = getData();
  const cachedReminders = data.reminders || [];

  let t = Date.now();
  handleNewReminders(cachedReminders, remindersFromObsidian, data);
  logger.info(`handleNewReminders took ${new Date().getTime() - t} ms`);

  t = Date.now();
  handleDelete(cachedReminders, remindersFromObsidian, data);
  logger.info(`handleDelete took ${new Date().getTime() - t} ms`);

  t = Date.now();
  handleEdit(cachedReminders, remindersFromObsidian, data);
  logger.info(`handleEdit took ${new Date().getTime() - t} ms`);
};

const sentDiscordWebhook = async (reminder: Reminder<string>, vaultName: string) => {
  const reminderId = reminder.content?.split(REMINDER_ID_KEY)[1];
  const obsidianLink = getObsidianAdvancedUriBlockLink(vaultName, reminder.filePath, `${REMINDER_ID_KEY}${reminderId}`);

  try {
    const response = await fetch(process.env.DISCORD_WEBHOOK_URL || "", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [
          {
            title: `🔔 Reminder: ${cleanReminderContent(reminder.content)}`,
            description: `### [🔗 Open in obsidian](${REDIRECTION_PAGE_URL}?deeplink=${encodeURIComponent(obsidianLink)})`,
            color: 0x7e48e7,
          },
        ],
      }),
    });
    if (response.ok) logger.info(`Sent webhook for reminder with id ${reminder.id}`);
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
      continue;
    }
    const diff = now.getTime() - new Date(reminder.dateTime).getTime();

    if (diff >= 0 && !reminder.sent && reminder.id && !reminder.deleted) {
      const index = data.reminders.findIndex((r) => r.id === reminder.id);
      try {
        await sentDiscordWebhook(reminder, vaultName);
        data.reminders[index].sent = true;
        saveData(data);
      } catch {
        logger.error(`Failed to send reminder with id ${reminder.id}`);
      }
    }
  }
};
