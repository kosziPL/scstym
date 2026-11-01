import { app } from "electron";
import path from "path";

// Ghostery's default require.resolve cannot find node_modules in Forge's Vite
// bundles. Its self-contained preload is shipped alongside the filter snapshot.
export const PRELOAD_PATH = path.join(app.isPackaged ? process.resourcesPath : path.join(app.getAppPath(), "src/assets"), "adblock", "preload.cjs");
