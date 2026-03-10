import { execSync } from "child_process";
import { watch } from "fs";
import type { Reminder } from "./types";
import { cleanReminderContent, getData, getObsidianAdvancedUriBlockLink, initializeDataFile, saveData } from "./utils";
import { handleDelete, handleEdit, handleNewReminders } from "./core";
import "dotenv/config";

const DEBOUNCE_DELAY = 1000; // milliseconds
const INTERVAL_DELAY = 5_000;
const MAX_PAST_MS = 5 * 60 * 1000; // 5 minutes
const REMINDER_KEY = "reminder";
const REMINDER_ID_KEY_REGEXP = new RegExp(/\^r-\d+/);
const REMINDER_REGEXP = new RegExp(`\\[${REMINDER_KEY}::\\s*(.+?)\\]`);
const vaultPath = execSync("obsidian vault info=path", { encoding: "utf-8" }).trim();

initializeDataFile();

/** fetches reminders form Obsidian vault via new Obsidian CLI */
const getObsidianReminders = (): Reminder[] => {
  const searchResult = execSync(`obsidian search:context query="/\\[${REMINDER_KEY}::/"`, { encoding: "utf-8" }).trim();
  const reminderLines = searchResult.split("\n");

  return reminderLines.map((line) => {
    const reminderTime = line.match(REMINDER_REGEXP)?.[1];
    const reminderId = line.match(REMINDER_ID_KEY_REGEXP)?.[0];
    console.log(`Parsed reminder: ${line}, time: ${reminderTime}, id: ${reminderId}`);

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

const vaultName = vaultPath.split("/").slice(-1)[0];
const sentObsidianWebhook = async (reminder: Reminder<string>) => {
  const reminderId = reminder.content?.split("^r-")[1];
  const obsidianLink = getObsidianAdvancedUriBlockLink(vaultName, reminder.filePath, `^r-${reminderId}`);

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
};

let debounceTimer: ReturnType<typeof setTimeout>;

setInterval(async () => {
  const now = new Date();
  const data = getData();
  for (const reminder of data.reminders) {
    const diff = now.getTime() - new Date(reminder.dateTime).getTime();
    if (diff >= 0 && !reminder.sent && reminder.id && !reminder.deleted) {
      const index = data.reminders.findIndex((r) => r.id === reminder.id);
      data.reminders[index].sent = true;
      await sentObsidianWebhook(reminder);
      saveData(data);
    }
  }
}, INTERVAL_DELAY);

watch(vaultPath, { recursive: true }, (event, filename) => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const remindersFromFiles = getObsidianReminders();
    const data = getData();
    const cachedReminders = data.reminders || [];

    handleNewReminders(cachedReminders, remindersFromFiles, data);
    handleDelete(cachedReminders, remindersFromFiles, data);
    handleEdit(cachedReminders, remindersFromFiles, data);
  }, DEBOUNCE_DELAY);
});
