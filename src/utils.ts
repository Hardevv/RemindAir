import { writeFileSync, readFileSync } from "fs";
import { Data } from "./types";

const DATA_PATH = `${process.cwd()}/data.json`;
const INIT_DATA: Data = { reminders: [] };

export const initializeDataFile = () => {
  try {
    readFileSync(DATA_PATH, "utf-8");
    console.log("Data file already exists.");
  } catch (err) {
    console.log("Data file not found. Creating a new one.");

    writeFileSync(DATA_PATH, JSON.stringify(INIT_DATA, null, 2));
  }
};

export const getData = (): Data => JSON.parse(readFileSync(DATA_PATH, "utf-8"));
export const saveData = (data: Data) => writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));

export const cleanReminderContent = (content: string) =>
  content
    .split(/:\d+:\s*/)[1]
    ?.split("[reminder::")[0]
    ?.replace(/^-\s*\[.\]\s*/, "")
    ?.trim();

export const getObsidianAdvancedUriBlockLink = (vaultName: string, filePath: string, blockId: string) =>
  `obsidian://open?vault=${vaultName}&file=${filePath}#^${blockId}`;
