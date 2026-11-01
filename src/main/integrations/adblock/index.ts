import type { Session } from "electron";
import { ElectronBlocker } from "@ghostery/adblocker-electron";
import fs from "fs/promises";
import path from "path";
import log from "electron-log";

// Install once on the persistent music session, before its first navigation.
// The same session is reused when the BrowserView is recreated.
export async function enableAdBlocking(musicSession: Session, assetFolder: string): Promise<void> {
  try {
    const filters = await fs.readFile(path.join(assetFolder, "adblock", "engine.bin"));
    const blocker = ElectronBlocker.deserialize(filters);
    blocker.enableBlockingInSession(musicSession);
    log.info("Integration enabled: Ad blocker (network and cosmetic filters)");
  } catch (error) {
    // A broken filter bundle must not prevent the music player from starting.
    log.error("Could not initialize the ad blocker", error);
  }
}
