/* eslint-disable @typescript-eslint/no-unused-expressions */
(function () {
  const STORAGE_KEY = "scstym:playback_settings";
  const PRESET_SPEEDS = [0.75, 1.0, 1.25, 1.5, 2.0];
  const MIN_SPEED = 0.25;
  const MAX_SPEED = 4.0;
  const STEP_SPEED = 0.05;

  let currentSpeed = 1.0;
  let pitchFollowsSpeed = false;
  let popupOpen = false;

  // Load persisted settings if available
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.speed === "number" && !isNaN(parsed.speed)) {
        currentSpeed = Math.min(MAX_SPEED, Math.max(MIN_SPEED, Math.round(parsed.speed * 100) / 100));
      }
      if (typeof parsed.pitchFollowsSpeed === "boolean") {
        pitchFollowsSpeed = parsed.pitchFollowsSpeed;
      }
    }
  } catch {
    // Ignore localStorage read errors
  }

  function saveSettings() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          speed: currentSpeed,
          pitchFollowsSpeed: pitchFollowsSpeed
        })
      );
    } catch {
      // Ignore localStorage write errors
    }
  }

  // Inject CSS styles for SCSTYM playback controls
  function injectStyles() {
    if (document.getElementById("scstym-playback-styles")) return;
    const style = document.createElement("style");
    style.id = "scstym-playback-styles";
    style.textContent = `
      .scstym-playback-speed-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 32px;
        min-width: 52px;
        padding: 0 8px;
        margin: 0 4px;
        background: transparent;
        border: 1px solid transparent;
        border-radius: 16px;
        color: var(--ytmusic-text-secondary, #909090);
        font-family: var(--ytmusic-body-font, Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
        font-size: 13px;
        font-weight: 500;
        letter-spacing: 0.2px;
        cursor: pointer;
        user-select: none;
        box-sizing: border-box;
        transition: color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease;
      }

      .scstym-playback-speed-button:hover {
        color: #ffffff;
        background-color: rgba(255, 255, 255, 0.1);
      }

      .scstym-playback-speed-button.scstym-active {
        color: #ffffff;
        background-color: rgba(255, 255, 255, 0.12);
        border-color: rgba(255, 255, 255, 0.25);
        font-weight: 600;
      }

      .scstym-playback-speed-button.scstym-popup-open {
        color: #ffffff;
        background-color: rgba(255, 255, 255, 0.18);
      }

      .scstym-playback-popup {
        position: fixed;
        z-index: 10000;
        width: 250px;
        background: rgba(33, 33, 33, 0.98);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.65);
        padding: 14px 16px;
        color: #ffffff;
        font-family: var(--ytmusic-body-font, Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
        font-size: 13px;
        box-sizing: border-box;
        user-select: none;
        opacity: 1;
        transform: translateY(0);
        transition: opacity 0.15s ease, transform 0.15s ease, visibility 0.15s ease;
        visibility: visible;
      }

      .scstym-playback-popup.scstym-hidden {
        opacity: 0;
        transform: translateY(8px);
        pointer-events: none;
        visibility: hidden;
      }

      .scstym-popup-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
      }

      .scstym-popup-title {
        font-size: 14px;
        font-weight: 600;
        color: #ffffff;
      }

      .scstym-reset-btn {
        background: transparent;
        border: none;
        color: var(--ytmusic-text-secondary, #aaaaaa);
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        padding: 2px 6px;
        border-radius: 4px;
        transition: color 0.15s ease, background-color 0.15s ease;
      }

      .scstym-reset-btn:hover {
        color: #ffffff;
        background-color: rgba(255, 255, 255, 0.1);
      }

      .scstym-presets-container {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-bottom: 14px;
      }

      .scstym-preset-btn {
        flex: 1 1 calc(33.33% - 6px);
        min-width: 60px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 6px;
        color: #cccccc;
        font-size: 12px;
        font-weight: 500;
        padding: 6px 0;
        text-align: center;
        cursor: pointer;
        transition: all 0.12s ease;
      }

      .scstym-preset-btn:hover {
        background: rgba(255, 255, 255, 0.14);
        color: #ffffff;
        border-color: rgba(255, 255, 255, 0.2);
      }

      .scstym-preset-btn.scstym-preset-active {
        background: #ffffff;
        color: #0f0f0f;
        font-weight: 600;
        border-color: #ffffff;
      }

      .scstym-custom-speed-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
        gap: 8px;
      }

      .scstym-custom-label {
        font-size: 12px;
        color: var(--ytmusic-text-secondary, #aaaaaa);
      }

      .scstym-speed-input-wrapper {
        position: relative;
        display: inline-flex;
        align-items: center;
        width: 80px;
      }

      .scstym-speed-input {
        width: 100%;
        height: 28px;
        background: rgba(0, 0, 0, 0.35);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 6px;
        color: #ffffff;
        font-size: 13px;
        font-weight: 600;
        text-align: center;
        padding: 0 16px 0 6px;
        box-sizing: border-box;
        outline: none;
        transition: border-color 0.15s ease;
        -moz-appearance: textfield;
      }

      .scstym-speed-input::-webkit-inner-spin-button,
      .scstym-speed-input::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }

      .scstym-speed-input:focus {
        border-color: #ffffff;
      }

      .scstym-speed-unit {
        position: absolute;
        right: 8px;
        color: #888888;
        font-size: 12px;
        font-weight: 500;
        pointer-events: none;
      }

      .scstym-divider {
        height: 1px;
        background: rgba(255, 255, 255, 0.08);
        margin: 10px 0;
      }

      .scstym-pitch-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: pointer;
        padding: 2px 0;
      }

      .scstym-pitch-info {
        display: flex;
        flex-direction: column;
      }

      .scstym-pitch-title {
        font-size: 13px;
        font-weight: 500;
        color: #ffffff;
      }

      .scstym-pitch-hint {
        font-size: 11px;
        color: var(--ytmusic-text-secondary, #888888);
        margin-top: 1px;
      }

      .scstym-switch {
        position: relative;
        width: 36px;
        height: 20px;
        flex-shrink: 0;
      }

      .scstym-pitch-checkbox {
        opacity: 0;
        width: 0;
        height: 0;
        margin: 0;
      }

      .scstym-switch-slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(255, 255, 255, 0.2);
        transition: 0.2s;
        border-radius: 20px;
      }

      .scstym-switch-slider:before {
        position: absolute;
        content: "";
        height: 14px;
        width: 14px;
        left: 3px;
        bottom: 3px;
        background-color: #ffffff;
        transition: 0.2s;
        border-radius: 50%;
      }

      .scstym-pitch-checkbox:checked + .scstym-switch-slider {
        background-color: #ffffff;
      }

      .scstym-pitch-checkbox:checked + .scstym-switch-slider:before {
        transform: translateX(16px);
        background-color: #0f0f0f;
      }
    `;
    document.head.appendChild(style);
  }

  function getVideoElement() {
    return document.querySelector("video") || document.querySelector(".html5-main-video");
  }

  function applyPlaybackSettings(video = getVideoElement()) {
    if (!video) return;

    try {
      // Media loading resets playbackRate to defaultPlaybackRate.
      if (Math.abs(video.defaultPlaybackRate - currentSpeed) > 0.001) {
        video.defaultPlaybackRate = currentSpeed;
      }
      if (Math.abs(video.playbackRate - currentSpeed) > 0.001) {
        video.playbackRate = currentSpeed;
      }

      const preserves = !pitchFollowsSpeed;
      video.preservesPitch = preserves;
      if (video.webkitPreservesPitch !== undefined) video.webkitPreservesPitch = preserves;
      if (video.mozPreservesPitch !== undefined) video.mozPreservesPitch = preserves;
    } catch {
      // The media element may be getting detached during a track change.
    }
  }

  function hookVideoElement(video) {
    if (!video || video.__scstym_hooked) return;
    video.__scstym_hooked = true;

    // Prevent YTM's transition-time writes from reaching the native player at
    // 1x. A ratechange listener alone runs after the audible change has occurred.
    // Restrict the override to this player element, leaving other media alone.
    for (const property of ["playbackRate", "defaultPlaybackRate"]) {
      const descriptor = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, property);
      if (!descriptor?.get || !descriptor?.set || Object.hasOwn(video, property)) continue;
      Object.defineProperty(video, property, {
        configurable: true,
        enumerable: descriptor.enumerable,
        get() {
          return descriptor.get.call(this);
        },
        set() {
          descriptor.set.call(this, currentSpeed);
        }
      });
    }

    // Native media resets can bypass JavaScript setters. No asynchronous guard:
    // equality checks make our own ratechange events harmless.
    for (const event of ["ratechange", "loadstart", "loadedmetadata", "play", "playing", "emptied"]) {
      video.addEventListener(event, () => applyPlaybackSettings(video));
    }
    applyPlaybackSettings(video);
  }

  function formatSpeedText(speed) {
    return `${speed.toFixed(2)}×`;
  }

  // Create UI Elements via Trusted DOM APIs (no innerHTML)
  injectStyles();

  const speedButton = document.createElement("button");
  speedButton.type = "button";
  speedButton.classList.add("ytmusic-player-bar", "ytmd-player-bar-control", "scstym-playback-speed-button");
  speedButton.id = "scstym-playback-speed-btn";

  const popup = document.createElement("div");
  popup.classList.add("scstym-playback-popup", "scstym-hidden");
  popup.id = "scstym-playback-popup";

  // Header
  const header = document.createElement("div");
  header.classList.add("scstym-popup-header");

  const title = document.createElement("span");
  title.classList.add("scstym-popup-title");
  title.textContent = "Playback speed";

  const resetBtn = document.createElement("button");
  resetBtn.type = "button";
  resetBtn.classList.add("scstym-reset-btn");
  resetBtn.id = "scstym-reset-btn";
  resetBtn.textContent = "Reset";

  header.appendChild(title);
  header.appendChild(resetBtn);
  popup.appendChild(header);

  // Presets Container
  const presetsContainer = document.createElement("div");
  presetsContainer.classList.add("scstym-presets-container");
  presetsContainer.id = "scstym-presets-container";

  const presetButtons = [];
  PRESET_SPEEDS.forEach(speed => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.classList.add("scstym-preset-btn");
    btn.dataset.speed = speed.toString();
    btn.textContent = formatSpeedText(speed);
    btn.addEventListener("click", () => {
      setSpeed(speed);
    });
    presetsContainer.appendChild(btn);
    presetButtons.push(btn);
  });
  popup.appendChild(presetsContainer);

  // Custom Speed Row
  const customRow = document.createElement("div");
  customRow.classList.add("scstym-custom-speed-row");

  const customLabel = document.createElement("span");
  customLabel.classList.add("scstym-custom-label");
  customLabel.textContent = "Custom speed";

  const inputWrapper = document.createElement("div");
  inputWrapper.classList.add("scstym-speed-input-wrapper");

  const speedInput = document.createElement("input");
  speedInput.type = "number";
  speedInput.id = "scstym-speed-input";
  speedInput.classList.add("scstym-speed-input");
  speedInput.min = MIN_SPEED.toString();
  speedInput.max = MAX_SPEED.toString();
  speedInput.step = STEP_SPEED.toString();

  const unitSpan = document.createElement("span");
  unitSpan.classList.add("scstym-speed-unit");
  unitSpan.textContent = "×";

  inputWrapper.appendChild(speedInput);
  inputWrapper.appendChild(unitSpan);

  customRow.appendChild(customLabel);
  customRow.appendChild(inputWrapper);
  popup.appendChild(customRow);

  // Divider
  const divider = document.createElement("div");
  divider.classList.add("scstym-divider");
  popup.appendChild(divider);

  // Pitch Row
  const pitchRow = document.createElement("label");
  pitchRow.classList.add("scstym-pitch-row");
  pitchRow.htmlFor = "scstym-pitch-toggle";

  const pitchInfo = document.createElement("div");
  pitchInfo.classList.add("scstym-pitch-info");

  const pitchTitle = document.createElement("span");
  pitchTitle.classList.add("scstym-pitch-title");
  pitchTitle.textContent = "Pitch follows speed";

  const pitchHint = document.createElement("span");
  pitchHint.classList.add("scstym-pitch-hint");
  pitchHint.textContent = "Nightcore / Slowed style";

  pitchInfo.appendChild(pitchTitle);
  pitchInfo.appendChild(pitchHint);

  const switchContainer = document.createElement("div");
  switchContainer.classList.add("scstym-switch");

  const pitchCheckbox = document.createElement("input");
  pitchCheckbox.type = "checkbox";
  pitchCheckbox.id = "scstym-pitch-toggle";
  pitchCheckbox.classList.add("scstym-pitch-checkbox");

  const switchSlider = document.createElement("span");
  switchSlider.classList.add("scstym-switch-slider");

  switchContainer.appendChild(pitchCheckbox);
  switchContainer.appendChild(switchSlider);

  pitchRow.appendChild(pitchInfo);
  pitchRow.appendChild(switchContainer);
  popup.appendChild(pitchRow);

  function updateUI() {
    speedButton.textContent = formatSpeedText(currentSpeed);
    const isCustomized = Math.abs(currentSpeed - 1.0) > 0.001 || pitchFollowsSpeed;
    if (isCustomized) {
      speedButton.classList.add("scstym-active");
    } else {
      speedButton.classList.remove("scstym-active");
    }
    speedButton.setAttribute("title", `Playback speed: ${formatSpeedText(currentSpeed)}${pitchFollowsSpeed ? " (Pitch follows speed)" : ""}`);

    // Update presets active state
    presetButtons.forEach(btn => {
      const presetSpeed = parseFloat(btn.dataset.speed || "1");
      if (Math.abs(presetSpeed - currentSpeed) < 0.001) {
        btn.classList.add("scstym-preset-active");
      } else {
        btn.classList.remove("scstym-preset-active");
      }
    });

    // Update input field
    if (document.activeElement !== speedInput) {
      speedInput.value = currentSpeed.toFixed(2);
    }

    // Update pitch toggle
    pitchCheckbox.checked = pitchFollowsSpeed;
  }

  function setSpeed(speed) {
    let val = parseFloat(speed);
    if (isNaN(val)) val = 1.0;
    val = Math.min(MAX_SPEED, Math.max(MIN_SPEED, Math.round(val * 100) / 100));
    currentSpeed = val;
    saveSettings();
    applyPlaybackSettings();
    updateUI();
  }

  function setPitchFollowsSpeed(enabled) {
    pitchFollowsSpeed = Boolean(enabled);
    saveSettings();
    applyPlaybackSettings();
    updateUI();
  }

  // Event Listeners for Popup Inputs
  speedInput.addEventListener("change", e => {
    setSpeed(e.target.value);
  });

  speedInput.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      setSpeed(e.target.value);
      speedInput.blur();
    }
  });

  pitchCheckbox.addEventListener("change", e => {
    setPitchFollowsSpeed(e.target.checked);
  });

  resetBtn.addEventListener("click", () => {
    currentSpeed = 1.0;
    pitchFollowsSpeed = false;
    saveSettings();
    applyPlaybackSettings();
    updateUI();
  });

  function updatePopupPosition() {
    if (!speedButton || !popup) return;
    const rect = speedButton.getBoundingClientRect();
    const popupWidth = popup.offsetWidth || 250;
    let left = rect.right - popupWidth;
    if (left < 10) left = 10;
    if (left + popupWidth > window.innerWidth - 10) {
      left = window.innerWidth - popupWidth - 10;
    }
    const bottom = window.innerHeight - rect.top + 8;
    popup.style.bottom = `${bottom}px`;
    popup.style.left = `${left}px`;
  }

  function openPopup() {
    popupOpen = true;
    popup.classList.remove("scstym-hidden");
    speedButton.classList.add("scstym-popup-open");
    updatePopupPosition();
  }

  function closePopup() {
    popupOpen = false;
    popup.classList.add("scstym-hidden");
    speedButton.classList.remove("scstym-popup-open");
  }

  function togglePopup() {
    if (popupOpen) {
      closePopup();
    } else {
      openPopup();
    }
  }

  speedButton.addEventListener("click", e => {
    e.stopPropagation();
    togglePopup();
  });

  document.addEventListener("click", e => {
    if (popupOpen && !popup.contains(e.target) && !speedButton.contains(e.target)) {
      closePopup();
    }
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && popupOpen) {
      closePopup();
    }
  });

  window.addEventListener("resize", () => {
    if (popupOpen) {
      updatePopupPosition();
    }
  });

  // Append popup to document body
  document.body.appendChild(popup);

  // Insert speed button into right controls
  function insertSpeedButton() {
    const playerBar = document.querySelector("ytmusic-app-layout>ytmusic-player-bar");
    if (!playerBar) return false;
    const rightControls = playerBar.querySelector(".right-controls-buttons");
    if (!rightControls) return false;

    if (speedButton.parentElement === rightControls) return true;

    const sleepTimerBtn = rightControls.querySelector(".sleep-timer-button");
    if (sleepTimerBtn) {
      sleepTimerBtn.insertAdjacentElement("afterend", speedButton);
      return true;
    }

    const shuffleBtn = rightControls.querySelector(".shuffle");
    if (shuffleBtn) {
      shuffleBtn.insertAdjacentElement("afterend", speedButton);
      return true;
    }

    rightControls.appendChild(speedButton);
    return true;
  }

  // Hook into YTM playerApi lifecycle
  function hookPlayerApi() {
    const playerBar = document.querySelector("ytmusic-app-layout>ytmusic-player-bar");
    const playerApi = window.__YTMD_HOOK__?.ytmPlayerBar?.playerApi;
    if (playerBar && playerApi) {
      playerApi.addEventListener("onVideoDataChange", event => {
        if (event.playertype === 1 && (event.type === "dataloaded" || event.type === "dataupdated")) {
          applyPlaybackSettings();
        }
      });
      playerApi.addEventListener("onStateChange", () => {
        applyPlaybackSettings();
      });
    }
  }

  // Observe DOM for video replacement and player bar insertion
  const observer = new MutationObserver(() => {
    const video = getVideoElement();
    if (video && !video.__scstym_hooked) {
      hookVideoElement(video);
      applyPlaybackSettings();
    }
    insertSpeedButton();
  });

  observer.observe(document.documentElement || document.body, {
    childList: true,
    subtree: true
  });

  // Initial setup
  insertSpeedButton();
  const initialVideo = getVideoElement();
  if (initialVideo) {
    hookVideoElement(initialVideo);
    applyPlaybackSettings();
  }
  hookPlayerApi();
  updateUI();
});
