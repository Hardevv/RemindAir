import { writeFileSync, readFileSync } from "fs";
import { Data } from "./types";
import { logger } from "./logger";
import { REMINDER_KEY } from "./consts";

const DATA_PATH = `${process.cwd()}/data.json`;
const INIT_DATA: Data = { reminders: [] };

export const initializeDataFile = () => {
  try {
    readFileSync(DATA_PATH, "utf-8");
  } catch (err) {
    writeFileSync(DATA_PATH, JSON.stringify(INIT_DATA, null, 2));
    logger.info("Data file not found, created new one");
  }
};

export const getData = (): Data => JSON.parse(readFileSync(DATA_PATH, "utf-8"));
export const saveData = (data: Data) => writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));

export const cleanReminderContent = (content: string) =>
  content
    .split(/:\d+:\s*/)[1]
    ?.split(`[${REMINDER_KEY}::`)[0]
    ?.replace(/^-\s*\[.\]\s*/, "")
    ?.trim();

export const getObsidianAdvancedUriBlockLink = (vaultName: string, filePath: string, blockId: string) =>
  `obsidian://open?vault=${vaultName}&file=${filePath}#^${blockId}`;
