const { ElectronBlocker } = require("@ghostery/adblocker-electron");
const fs = require("node:fs/promises");
const path = require("node:path");

(async () => {
  const blocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(url => fetch(url, { signal: AbortSignal.timeout(30000) }));
  const destination = path.join(__dirname, "../src/assets/adblock/engine.bin");
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, blocker.serialize());
  await fs.copyFile(require.resolve("@ghostery/adblocker-electron-preload"), path.join(path.dirname(destination), "preload.cjs"));
  console.log(`Updated bundled ad-blocking filters: ${destination}`);
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
