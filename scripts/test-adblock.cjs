const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const { app, BrowserWindow, session } = require("electron");
const { ElectronBlocker, Request } = require("@ghostery/adblocker-electron");

const profile = fs.mkdtempSync(path.join(os.tmpdir(), "scstym-adblock-test-"));
app.setPath("userData", profile);
app.disableHardwareAcceleration();
app.commandLine.appendSwitch("ozone-platform", "headless");
let server;
let window;
const timeout = setTimeout(() => {
  console.error("Ad blocker smoke test timed out");
  app.exit(1);
}, 30000);

app
  .whenReady()
  .then(async () => {
    const blocker = ElectronBlocker.deserialize(fs.readFileSync(path.join(__dirname, "../src/assets/adblock/engine.bin")));
    const musicSession = session.fromPartition("adblock-smoke");
    const otherSession = session.fromPartition("adblock-control");
    blocker.enableBlockingInSession(musicSession);
    blocker.enableBlockingInSession(musicSession);
    assert.equal(blocker.isBlockingEnabled(musicSession), true);
    assert.equal(blocker.isBlockingEnabled(otherSession), false);
    assert.equal(musicSession.getPreloadScripts().length, 1);
    assert.equal(otherSession.getPreloadScripts().length, 0);

    const musicRequest = Request.fromRawDetails({
      url: "https://music.youtube.com/youtubei/v1/player?prettyPrint=false",
      sourceUrl: "https://music.youtube.com/",
      type: "xmlhttprequest"
    });
    assert.equal(blocker.match(musicRequest).match, false, "Music player API must remain accessible");
    await assert.rejects(musicSession.fetch("https://googleads.g.doubleclick.net/pagead/id"), /ERR_BLOCKED_BY_CLIENT/);

    server = http.createServer((_request, response) => response.end("<html><body>Music player smoke test</body></html>"));
    await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
    window = new BrowserWindow({ show: false, webPreferences: { session: musicSession, sandbox: true, contextIsolation: true } });
    const preloadErrors = [];
    window.webContents.on("preload-error", (_event, _file, error) => preloadErrors.push(error));
    await window.loadURL(`http://127.0.0.1:${server.address().port}`);
    assert.equal(preloadErrors.length, 0, "Cosmetic-filter preload must load in a sandboxed view");
    assert.equal(await window.webContents.executeJavaScript("document.body.textContent"), "Music player smoke test");

    blocker.disableBlockingInSession(musicSession);
    assert.equal(musicSession.getPreloadScripts().length, 0);
    blocker.enableBlockingInSession(musicSession);
    blocker.disableBlockingInSession(musicSession);
    console.log("Ad blocker: network blocking, player API, session isolation, sandboxed preload and lifecycle OK");
  })
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    clearTimeout(timeout);
    if (window) window.destroy();
    if (server) server.close();
    app.exit(process.exitCode || 0);
  });
app.on("quit", () => fs.rmSync(profile, { recursive: true, force: true }));
