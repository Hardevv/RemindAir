import { execSync } from "child_process";
import { watch } from "fs";
import { initializeDataFile } from "./utils";
import { checkPastRemindersAndSend, watchLogic } from "./core";
import { DEBOUNCE_DELAY, INTERVAL_DELAY } from "./consts";
import { startApi } from "./api";
import "dotenv/config";

const API_PORT = process.env.API_PORT || "3000";

const vaultPath = execSync("obsidian vault info=path", { encoding: "utf-8" }).trim();
const vaultName = vaultPath.split("/").slice(-1)[0];

initializeDataFile();
watchLogic(); // Run once on start
startApi(API_PORT);

setInterval(async () => {
  await checkPastRemindersAndSend(vaultName);
}, INTERVAL_DELAY);

let debounceTimer: ReturnType<typeof setTimeout>;
watch(vaultPath, { recursive: true }, (event, filename) => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(watchLogic, DEBOUNCE_DELAY);
});
