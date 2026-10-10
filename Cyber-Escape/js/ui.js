let hudElements = null;
let pauseOverlay = null;
let pauseButton = null;
let completeOverlay = null;
let completeScore = null;
let completeBaseScore = null;
let completeTimeBonus = null;
let completeTotalScore = null;
let completeData = null;
let nextLevelButton = null;
let nextLevelHint = null;
let gameOverOverlay = null;
let gameOverScore = null;
let tryAgainButton = null;

/**
 * Initializes UI navigation, HUD hooks, and screen transitions.
 * @param {{
 *   onPlay: () => void,
 *   onRestart?: () => void,
 *   onTogglePause: () => void,
 *   onResume: () => void,
 *   onLeaveGame: () => void
 * }} callbacks
 */
export function initializeUI({ onPlay, onRestart, onTogglePause, onResume, onLeaveGame, onNextLevel }) {
  const screens = [...document.querySelectorAll(".screen")];
  const playButton = document.querySelector("#play-button");
  const soundToggle = document.querySelector("#sound-toggle");
  const resumeButton = document.querySelector("#resume-button");
  nextLevelButton = document.querySelector("#next-level-button");
  pauseButton = document.querySelector("#pause-button");
  pauseOverlay = document.querySelector("#pause-overlay");
  completeOverlay = document.querySelector("#complete-overlay");
  completeScore = document.querySelector("#complete-score");
  completeBaseScore = document.querySelector("#complete-base-score");
  completeTimeBonus = document.querySelector("#complete-time-bonus");
  completeTotalScore = document.querySelector("#complete-total-score");
  completeData = document.querySelector("#complete-data");
  nextLevelHint = document.querySelector("#next-level-hint");
  gameOverOverlay = document.querySelector("#game-over-overlay");
  gameOverScore = document.querySelector("#game-over-score");
  tryAgainButton = document.querySelector("#try-again-button");

  hudElements = {
    level: document.querySelector("#hud-level"),
    score: document.querySelector("#hud-score"),
    data: document.querySelector("#hud-data"),
    objective: document.querySelector("#hud-objective"),
    lives: document.querySelector("#hud-lives"),
    time: document.querySelector("#hud-time"),
  };

  if (nextLevelButton) {
    nextLevelButton.addEventListener("click", () => {
      if (typeof onNextLevel === "function") {
        onNextLevel();
      } else {
        showLevelStandbyHint("// LEVEL 03 INITIALIZING... SYSTEM STANDBY (LEVEL 3 COMING SOON)");
      }
    });
  }

  // Try Again button restarts level from scratch
  if (tryAgainButton) {
    tryAgainButton.addEventListener("click", () => {
      hideGameOverOverlay();
      if (typeof onRestart === "function") {
        onRestart();
      } else if (typeof onPlay === "function") {
        onPlay();
      }
    });
  }

  if (!screens.length || !playButton || !soundToggle) {
    throw new Error("Cyber Escape is missing required menu interface elements.");
  }

  function showScreen(screenId) {
    const nextScreen = screens.find((screen) => screen.id === screenId);
    if (!nextScreen) {
      throw new Error(`Cyber Escape cannot find the "${screenId}" screen.`);
    }

    // If navigating away from the game screen, notify game engine
    const activeScreen = screens.find((s) => s.classList.contains("is-active"));
    if (activeScreen && activeScreen.id === "game-screen" && screenId !== "game-screen") {
      hideGameOverOverlay();
      hideLevelCompleteOverlay();
      if (typeof onLeaveGame === "function") {
        onLeaveGame();
      }
    }

    for (const screen of screens) {
      const isActive = screen === nextScreen;
      screen.classList.toggle("is-active", isActive);
      screen.setAttribute("aria-hidden", String(!isActive));
      screen.inert = !isActive;
    }
  }

  // Bind screen target buttons
  for (const button of document.querySelectorAll("[data-screen-target]")) {
    button.addEventListener("click", () => {
      showScreen(button.dataset.screenTarget);
    });
  }

  // Play button starts game
  playButton.addEventListener("click", () => {
    showScreen("game-screen");
    if (typeof onPlay === "function") {
      onPlay();
    }
  });

  // Pause button in HUD
  if (pauseButton) {
    pauseButton.addEventListener("click", () => {
      if (typeof onTogglePause === "function") {
        onTogglePause();
      }
    });
  }

  // Resume button in pause overlay
  if (resumeButton) {
    resumeButton.addEventListener("click", () => {
      if (typeof onResume === "function") {
        onResume();
      }
    });
  }

  // Sound toggle in settings
  soundToggle.addEventListener("click", () => {
    const isSoundOn = soundToggle.getAttribute("aria-pressed") !== "true";
    soundToggle.setAttribute("aria-pressed", String(isSoundOn));
    soundToggle.setAttribute("aria-label", `Sound is ${isSoundOn ? "on" : "off"}`);
    soundToggle.querySelector(".toggle-button__label").textContent = isSoundOn ? "ON" : "OFF";
  });

  return {
    showScreen,
    updateHUD,
    setPauseOverlay,
  };
}

/**
 * Updates HUD display elements.
 * @param {{level?: number, score?: number, lives?: number, time?: number}} stats
 */
export function updateHUD({ level, score, dataCollected, dataTotal, lives, time, objective } = {}) {
  if (!hudElements) return;

  if (hudElements.level && level !== undefined) {
    hudElements.level.textContent = String(level).padStart(2, "0");
  }

  if (hudElements.score && score !== undefined) {
    hudElements.score.textContent = String(score).padStart(4, "0");
  }

  if (hudElements.data && (dataCollected !== undefined || dataTotal !== undefined)) {
    const collected = dataCollected ?? 0;
    const total = dataTotal ?? 5;
    hudElements.data.textContent = `${collected}/${total}`;
  }

  if (hudElements.objective && objective !== undefined) {
    hudElements.objective.textContent = objective;
  }

  if (hudElements.lives && lives !== undefined) {
    const safeLives = Math.max(0, lives);
    hudElements.lives.textContent = "❤️ ".repeat(safeLives).trim() || "NONE";
    hudElements.lives.setAttribute("aria-label", `${safeLives} lives remaining`);
  }

  if (hudElements.time && time !== undefined) {
    hudElements.time.textContent = String(time);
  }
}

/**
 * Sets visible pause state in the UI.
 * @param {boolean} isPaused
 */
export function setPauseOverlay(isPaused) {
  if (pauseOverlay) {
    pauseOverlay.classList.toggle("is-hidden", !isPaused);
    pauseOverlay.setAttribute("aria-hidden", String(!isPaused));
  }

  if (pauseButton) {
    const btnText = pauseButton.querySelector(".hud-button__text");
    const btnIcon = pauseButton.querySelector(".hud-button__icon");
    if (btnText) btnText.textContent = isPaused ? "RESUME" : "PAUSE";
    if (btnIcon) btnIcon.textContent = isPaused ? "▶" : "⏸";
  }
}

/**
 * Displays the Level Complete overlay with mission completion stats and score breakdown.
 * @param {{
 *   baseScore?: number,
 *   timeBonus?: number,
 *   totalScore?: number,
 *   score?: number,
 *   dataCollected?: number,
 *   dataTotal?: number
 * }} stats
 */
export function showLevelCompleteOverlay({
  levelId = 1,
  baseScore,
  timeBonus,
  totalScore,
  score,
  dataCollected,
  dataTotal,
} = {}) {
  if (completeOverlay) {
    completeOverlay.classList.remove("is-hidden");
    completeOverlay.setAttribute("aria-hidden", "false");

    const titleEl = completeOverlay.querySelector(".complete-overlay__title");
    const subtitleEl = completeOverlay.querySelector(".complete-overlay__subtitle");
    if (titleEl) {
      if (levelId === 3) {
        titleEl.textContent = "CYBER STORM CLEARED";
      } else if (levelId === 2) {
        titleEl.textContent = "FIREWALL BREACHED";
      } else {
        titleEl.textContent = "SYSTEM BREACHED";
      }
    }
    if (subtitleEl) {
      if (levelId === 3) {
        subtitleEl.textContent = "LEVEL 03 COMPLETE";
      } else if (levelId === 2) {
        subtitleEl.textContent = "LEVEL 02 COMPLETE";
      } else {
        subtitleEl.textContent = "LEVEL 01 COMPLETE";
      }
    }
  }

  const finalTotal = totalScore ?? score ?? 0;
  const base = baseScore ?? score ?? 0;
  const bonus = timeBonus ?? 0;

  if (completeBaseScore) {
    completeBaseScore.textContent = String(base).padStart(4, "0");
  }

  if (completeTimeBonus) {
    completeTimeBonus.textContent = `+${bonus}`;
  }

  if (completeTotalScore) {
    completeTotalScore.textContent = String(finalTotal).padStart(4, "0");
  }

  if (completeScore) {
    completeScore.textContent = String(finalTotal).padStart(4, "0");
  }

  if (completeData && (dataCollected !== undefined || dataTotal !== undefined)) {
    const collected = dataCollected ?? 0;
    const total = dataTotal ?? (levelId === 3 ? 8 : (levelId === 2 ? 7 : 5));
    completeData.textContent = `${collected}/${total}`;
  }

  if (nextLevelHint) {
    nextLevelHint.classList.add("is-hidden");
  }

  if (nextLevelButton) {
    nextLevelButton.disabled = false;
    const btnText = nextLevelButton.querySelector("span:not(.action-button__arrow)");
    if (btnText) btnText.textContent = "NEXT LEVEL";
  }

  setPauseOverlay(false);
}

/**
 * Displays the standby/initializing message when no further level is implemented yet.
 * @param {string} [message]
 */
export function showLevelStandbyHint(message = "// LEVEL 04 INITIALIZING... SYSTEM STANDBY (LEVEL 4 COMING SOON)") {
  if (nextLevelButton) {
    nextLevelButton.disabled = true;
    const btnText = nextLevelButton.querySelector("span:not(.action-button__arrow)");
    if (btnText) btnText.textContent = "INITIALIZING...";
  }
  if (nextLevelHint) {
    nextLevelHint.textContent = message;
    nextLevelHint.classList.remove("is-hidden");
  }
}

/**
 * Hides the Level Complete overlay.
 */
export function hideLevelCompleteOverlay() {
  if (completeOverlay) {
    completeOverlay.classList.add("is-hidden");
    completeOverlay.setAttribute("aria-hidden", "true");
  }

  if (nextLevelHint) {
    nextLevelHint.classList.add("is-hidden");
  }

  if (nextLevelButton) {
    nextLevelButton.disabled = false;
    const btnText = nextLevelButton.querySelector("span:not(.action-button__arrow)");
    if (btnText) btnText.textContent = "NEXT LEVEL";
  }
}

/**
 * Displays the Game Over overlay with final score.
 * @param {{score?: number}} stats
 */
export function showGameOverOverlay({ score } = {}) {
  if (gameOverOverlay) {
    gameOverOverlay.classList.remove("is-hidden");
    gameOverOverlay.setAttribute("aria-hidden", "false");
  }

  if (gameOverScore && score !== undefined) {
    gameOverScore.textContent = String(score).padStart(4, "0");
  }

  setPauseOverlay(false);
}

/**
 * Hides the Game Over overlay.
 */
export function hideGameOverOverlay() {
  if (gameOverOverlay) {
    gameOverOverlay.classList.add("is-hidden");
    gameOverOverlay.setAttribute("aria-hidden", "true");
  }
}

