import { Player } from "./player.js";
import { Virus } from "./enemy.js";
import { MovingFirewall } from "./firewall.js";
import {
  initializeUI,
  updateHUD,
  setPauseOverlay,
  showLevelCompleteOverlay,
  hideLevelCompleteOverlay,
  showGameOverOverlay,
  hideGameOverOverlay,
  showLevelStandbyHint,
} from "./ui.js";
import { checkCollision } from "./collision.js";
import {
  getCurrentLevel,
  getLevelWalls,
  getLevelCollectibles,
  getLevelEnemies,
  getLevelFirewalls,
  getKeyPosition,
  getExitPosition,
  setCurrentLevel,
  getCurrentLevelId,
  drawWalls,
  drawDataChips,
  drawSecurityKey,
  drawExitPortal,
} from "./level.js";

/**
 * Game state enumeration.
 */
export const GameState = Object.freeze({
  MENU: "MENU",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  GAME_OVER: "GAME_OVER",
  LEVEL_COMPLETE: "LEVEL_COMPLETE",
  VICTORY: "VICTORY",
});

// Engine variables
let canvas = null;
let ctx = null;
let player = null;
let currentState = GameState.MENU;
let animationFrameId = null;
let lastTimestamp = 0;
let activeCollectibles = [];
let collectParticles = [];
let activeEnemies = [];
let activeFirewalls = [];
let hasSecurityKey = false;
let isExitUnlocked = false;
let activeKey = null;
let activeExit = null;
let timerAccumulator = 0;
let levelStartScore = 0;

// Game statistics
const gameStats = {
  level: 1,
  score: 0,
  dataCollected: 0,
  dataTotal: 5,
  lives: 3,
  time: 60,
};

// Input state
const inputKeys = {
  up: false,
  down: false,
  left: false,
  right: false,
};

/**
 * Initializes the game canvas, input listeners, UI bindings, and prepares the player entity.
 */
export function initializeGame() {
  canvas = document.querySelector("#game-canvas");
  ctx = canvas?.getContext("2d");

  if (!canvas || !ctx) {
    throw new Error("Cyber Escape could not initialize canvas or 2D rendering context.");
  }

  // Set standard native internal canvas resolution
  canvas.width = 800;
  canvas.height = 500;

  // Load Level 1 data and initialize Cyber Security Agent player at playerStart position
  const levelData = getCurrentLevel();
  player = new Player(levelData.playerStart.x, levelData.playerStart.y);
  player.direction = levelData.playerStart.direction || "right";

  // Set up input listeners once
  setupInputListeners();

  // Initialize UI with action callbacks
  initializeUI({
    onPlay: () => startGame(),
    onRestart: () => startLevel(getCurrentLevelId(), levelStartScore),
    onTogglePause: () => togglePause(),
    onResume: () => resumeGame(),
    onLeaveGame: () => exitToMenu(),
    onNextLevel: () => advanceNextLevel(),
  });

  activeCollectibles = getLevelCollectibles();
  collectParticles = [];
  gameStats.dataTotal = activeCollectibles.length;
  activeEnemies = getLevelEnemies().map((cfg) => new Virus(cfg));
  activeFirewalls = getLevelFirewalls().map((cfg) => new MovingFirewall(cfg));
  hasSecurityKey = false;
  isExitUnlocked = false;
  activeKey = getKeyPosition();
  activeExit = getExitPosition();

  // Render initial standby arena with level walls, exit portal, key, enemies, and data chips
  drawEnvironment();
  drawWalls(ctx, getLevelWalls());
  activeFirewalls.forEach((fw) => fw.draw(ctx, 0));
  drawExitPortal(ctx, activeExit, isExitUnlocked, 0);
  drawSecurityKey(ctx, activeKey, 0);
  drawDataChips(ctx, activeCollectibles, 0);
  activeEnemies.forEach((e) => e.draw(ctx));
  player.draw(ctx);
}

/**
 * Returns the current player instance (useful for collision systems and tests).
 * @returns {Player|null}
 */
export function getPlayer() {
  return player;
}

/**
 * Returns the current game state.
 * @returns {string}
 */
export function getGameState() {
  return currentState;
}

/**
 * Returns the active obstacles/walls for current level.
 * @returns {Array<{id: string, x: number, y: number, width: number, height: number, label?: string}>}
 */
export function getWalls() {
  return getLevelWalls();
}

/**
 * Returns the active collectible chips currently in the level.
 * @returns {Array<{id: string, type: string, x: number, y: number, width: number, height: number}>}
 */
export function getCollectibles() {
  return activeCollectibles;
}

/**
 * Returns current level metadata and geometry.
 * @returns {object}
 */
export function getLevelData() {
  return getCurrentLevel();
}

/**
 * Returns active score, collected chips, and game statistics.
 * @returns {typeof gameStats}
 */
export function getGameStats() {
  return { ...gameStats };
}

/**
 * Attaches keyboard listeners once to handle player controls and prevent unwanted page scrolling.
 */
function setupInputListeners() {
  const handledKeyCodes = new Set([
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "KeyW",
    "KeyS",
    "KeyA",
    "KeyD",
    "KeyP",
    "Space",
  ]);

  window.addEventListener("keydown", (e) => {
    // Only intercept gameplay keys when on game screen or playing/paused
    if (handledKeyCodes.has(e.code) || handledKeyCodes.has(e.key)) {
      if (currentState === GameState.PLAYING || currentState === GameState.PAUSED) {
        // Prevent browser scrolling with arrow keys / space
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code) || ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
          e.preventDefault();
        }
      }
    }

    // Toggle pause with 'P'
    if (e.code === "KeyP" || e.key === "p" || e.key === "P") {
      if (currentState === GameState.PLAYING || currentState === GameState.PAUSED) {
        e.preventDefault();
        togglePause();
        return;
      }
    }

    // Directional keys
    const code = e.code || "";
    const key = (e.key || "").toLowerCase();

    if (code === "ArrowUp" || code === "KeyW" || key === "w" || key === "arrowup") {
      inputKeys.up = true;
    }
    if (code === "ArrowDown" || code === "KeyS" || key === "s" || key === "arrowdown") {
      inputKeys.down = true;
    }
    if (code === "ArrowLeft" || code === "KeyA" || key === "a" || key === "arrowleft") {
      inputKeys.left = true;
    }
    if (code === "ArrowRight" || code === "KeyD" || key === "d" || key === "arrowright") {
      inputKeys.right = true;
    }
  });

  window.addEventListener("keyup", (e) => {
    const code = e.code || "";
    const key = (e.key || "").toLowerCase();

    if (code === "ArrowUp" || code === "KeyW" || key === "w" || key === "arrowup") {
      inputKeys.up = false;
    }
    if (code === "ArrowDown" || code === "KeyS" || key === "s" || key === "arrowdown") {
      inputKeys.down = false;
    }
    if (code === "ArrowLeft" || code === "KeyA" || key === "a" || key === "arrowleft") {
      inputKeys.left = false;
    }
    if (code === "ArrowRight" || code === "KeyD" || key === "d" || key === "arrowright") {
      inputKeys.right = false;
    }
  });

  // Reset inputs when window loses focus
  window.addEventListener("blur", () => {
    inputKeys.up = false;
    inputKeys.down = false;
    inputKeys.left = false;
    inputKeys.right = false;
  });
}

/**
 * Starts or restarts a gameplay session for the specified level.
 * @param {number} [levelId=1]
 * @param {number} [carriedScore=0]
 */
export function startLevel(levelId = 1, carriedScore = 0) {
  setCurrentLevel(levelId);
  const levelData = getCurrentLevel();
  currentState = GameState.PLAYING;

  // Set stats for level
  levelStartScore = carriedScore;
  gameStats.level = levelData.id;
  gameStats.score = carriedScore;
  gameStats.dataCollected = 0;
  activeCollectibles = getLevelCollectibles(levelId);
  gameStats.dataTotal = activeCollectibles.length;
  collectParticles = [];
  gameStats.lives = 3;
  gameStats.time = levelData.timer ?? (levelId === 3 ? 50 : (levelId === 2 ? 55 : 60));
  timerAccumulator = 0;

  // Reset player at level start coordinates
  player.reset(levelData.playerStart.x, levelData.playerStart.y);
  player.direction = levelData.playerStart.direction || "right";

  // Reset Security Key and Exit Portal status
  hasSecurityKey = false;
  isExitUnlocked = false;
  activeKey = getKeyPosition(levelId);
  activeExit = getExitPosition(levelId);

  // Initialize/reset active enemies and moving firewalls
  activeEnemies = getLevelEnemies(levelId).map((cfg) => new Virus(cfg));
  activeFirewalls = getLevelFirewalls(levelId).map((cfg) => new MovingFirewall(cfg));

  // Hide level complete and game over overlays if open
  hideLevelCompleteOverlay();
  hideGameOverOverlay();

  // Update UI and HUD with initial objective
  updateHUD({ ...gameStats, objective: "FIND SECURITY KEY" });
  setPauseOverlay(false);

  // Reset input keys
  inputKeys.up = false;
  inputKeys.down = false;
  inputKeys.left = false;
  inputKeys.right = false;

  // Start animation loop
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  lastTimestamp = performance.now();
  animationFrameId = requestAnimationFrame(gameLoop);
}

/**
 * Starts or restarts a gameplay session from Level 1.
 */
export function startGame() {
  startLevel(1, 0);
}

/**
 * Advances to the next level or prepares standby message.
 */
export function advanceNextLevel() {
  if (gameStats.level === 1) {
    startLevel(2, gameStats.score);
  } else if (gameStats.level === 2) {
    startLevel(3, gameStats.score);
  } else {
    showLevelStandbyHint("// LEVEL 04 INITIALIZING... SYSTEM STANDBY (LEVEL 4 COMING SOON)");
  }
}

/**
 * Pauses active gameplay loop.
 */
export function pauseGame() {
  if (currentState !== GameState.PLAYING) return;

  currentState = GameState.PAUSED;
  setPauseOverlay(true);
}

/**
 * Resumes gameplay from paused state.
 */
export function resumeGame() {
  if (currentState !== GameState.PAUSED) return;

  currentState = GameState.PLAYING;
  lastTimestamp = performance.now(); // Avoid sudden dt delta leap
  setPauseOverlay(false);
}

/**
 * Toggles between playing and paused states.
 */
export function togglePause() {
  if (currentState === GameState.PLAYING) {
    pauseGame();
  } else if (currentState === GameState.PAUSED) {
    resumeGame();
  }
}

/**
 * Exits current game back to main menu.
 */
export function exitToMenu() {
  currentState = GameState.MENU;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  setPauseOverlay(false);
  hideLevelCompleteOverlay();
  hideGameOverOverlay();
  inputKeys.up = false;
  inputKeys.down = false;
  inputKeys.left = false;
  inputKeys.right = false;
}

/**
 * Primary requestAnimationFrame loop.
 * @param {number} timestamp
 */
function gameLoop(timestamp) {
  // Compute delta time in seconds, clamped to 100ms max to prevent tunneling after tab switches
  const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
  lastTimestamp = timestamp;

  if (currentState === GameState.PLAYING) {
    update(dt);
  }

  draw();

  // Continue looping while playing or paused
  if (currentState === GameState.PLAYING || currentState === GameState.PAUSED) {
    animationFrameId = requestAnimationFrame(gameLoop);
  }
}

/**
 * Update step: updates entities, collects data chips, and updates particle effects.
 * @param {number} dt Delta time in seconds
 */
function update(dt) {
  const arenaBounds = {
    x: 0,
    y: 0,
    width: canvas.width,
    height: canvas.height,
  };

  // 1. Update active moving firewalls
  for (const firewall of activeFirewalls) {
    firewall.update(dt);
  }

  // 2. Update controllable player with wall collisions and moving firewalls
  const walls = getLevelWalls();
  const allSolidObstacles = activeFirewalls.length > 0 ? [...walls, ...activeFirewalls] : walls;
  player.update(dt, inputKeys, arenaBounds, allSolidObstacles);

  // 3. Check collision between player and moving firewalls
  for (const firewall of activeFirewalls) {
    if (checkCollision(player, firewall)) {
      if (player.takeDamage()) {
        // Player loses 1 life, score -10 (min 0) with 1.5s invulnerability
        gameStats.lives = Math.max(0, gameStats.lives - 1);
        gameStats.score = Math.max(0, gameStats.score - 10);

        spawnDamageParticles(player.x + player.width / 2, player.y + player.height / 2);
        updateHUD(gameStats);

        if (gameStats.lives <= 0) {
          triggerGameOver();
          return;
        }
      }
    }
  }

  // 4. Check collision between player and active data chips
  for (let i = activeCollectibles.length - 1; i >= 0; i--) {
    const chip = activeCollectibles[i];
    if (checkCollision(player, chip)) {
      // Remove collected chip
      activeCollectibles.splice(i, 1);

      // Increase score by +10 and update counter
      gameStats.score += chip.points || 10;
      gameStats.dataCollected += 1;

      // Trigger collection burst animation
      spawnCollectParticles(chip.x + chip.width / 2, chip.y + chip.height / 2);

      // Update HUD immediately with active objective
      updateHUD({
        ...gameStats,
        objective: hasSecurityKey ? "REACH EXIT" : "FIND SECURITY KEY",
      });
    }
  }

  // 5. Check collision between player and Security Key
  if (!hasSecurityKey && activeKey) {
    if (checkCollision(player, activeKey)) {
      hasSecurityKey = true;
      isExitUnlocked = true;

      // Trigger radiant key collection burst
      spawnKeyCollectParticles(activeKey.x + activeKey.width / 2, activeKey.y + activeKey.height / 2);

      // Update HUD to prompt player to reach exit
      updateHUD({
        ...gameStats,
        objective: "REACH EXIT",
      });
    }
  }

  // 6. Check collision between player and Exit Portal
  if (activeExit && checkCollision(player, activeExit)) {
    if (isExitUnlocked) {
      completeLevel();
      return;
    }
  }

  // 7. Update active enemies (intelligently chase player through maze, avoiding firewalls)
  for (const enemy of activeEnemies) {
    enemy.update(dt, player, arenaBounds, walls, activeFirewalls);
  }

  // 8. Check collision between Player and Virus enemies
  for (const enemy of activeEnemies) {
    if (checkCollision(player, enemy)) {
      if (player.takeDamage()) {
        // Player takes 1 hit: lose 1 life, score -10 (cannot drop below 0)
        gameStats.lives = Math.max(0, gameStats.lives - 1);
        gameStats.score = Math.max(0, gameStats.score - 10);

        // Visual damage burst
        spawnDamageParticles(player.x + player.width / 2, player.y + player.height / 2);

        // Update HUD lives & score immediately
        updateHUD(gameStats);

        // Check for Game Over condition
        if (gameStats.lives <= 0) {
          triggerGameOver();
          return;
        }
      }
    }
  }

  // 9. Update collection and damage visual feedback particles
  updateParticles(dt);

  // 10. Session countdown timer
  timerAccumulator += dt;
  if (timerAccumulator >= 1.0) {
    const elapsedSec = Math.floor(timerAccumulator);
    timerAccumulator -= elapsedSec;
    gameStats.time = Math.max(0, gameStats.time - elapsedSec);

    updateHUD({
      ...gameStats,
      objective: isExitUnlocked ? "REACH EXIT" : "FIND SECURITY KEY",
    });

    if (gameStats.time <= 0) {
      triggerGameOver();
      return;
    }
  }
}

/**
 * Completes the active level and presents the level complete screen.
 */
export function completeLevel() {
  currentState = GameState.LEVEL_COMPLETE;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  const baseScore = gameStats.score;
  const timeBonus = Math.max(0, Math.floor(gameStats.time));
  const totalScore = baseScore + timeBonus;
  gameStats.score = totalScore;

  updateHUD({
    ...gameStats,
    objective: "MISSION COMPLETE",
  });

  showLevelCompleteOverlay({
    levelId: gameStats.level,
    score: totalScore,
    baseScore: baseScore,
    timeBonus: timeBonus,
    totalScore: totalScore,
    dataCollected: gameStats.dataCollected,
    dataTotal: gameStats.dataTotal,
  });
}

/**
 * Triggers Game Over sequence when all lives are depleted.
 */
export function triggerGameOver() {
  currentState = GameState.GAME_OVER;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  showGameOverOverlay({ score: gameStats.score });
}

/**
 * Spawns warning glitch sparks and shockwave when the player sustains virus damage.
 * @param {number} x
 * @param {number} y
 */
function spawnDamageParticles(x, y) {
  const count = 12;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
    const speed = 70 + Math.random() * 85;
    collectParticles.push({
      isRing: false,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 2.5 + Math.random() * 2,
      color: i % 2 === 0 ? "#ff0055" : "#ffffff",
      alpha: 1,
      maxLife: 0.35,
      life: 0.35,
    });
  }

  // Expanding warning shockwave
  collectParticles.push({
    isRing: true,
    x,
    y,
    radius: 4,
    maxRadius: 28,
    alpha: 1,
    maxLife: 0.3,
    life: 0.3,
  });
}

/**
 * Spawns an energetic golden/cyan particle shockwave when the security key is gathered.
 * @param {number} x
 * @param {number} y
 */
function spawnKeyCollectParticles(x, y) {
  const count = 16;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.3;
    const speed = 75 + Math.random() * 95;
    collectParticles.push({
      isRing: false,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 3 + Math.random() * 2.5,
      color: i % 2 === 0 ? "#52f5df" : "#ffffff",
      alpha: 1,
      maxLife: 0.5,
      life: 0.5,
    });
  }

  // Expanding neon shockwave ring
  collectParticles.push({
    isRing: true,
    x,
    y,
    radius: 4,
    maxRadius: 36,
    alpha: 1,
    maxLife: 0.42,
    life: 0.42,
  });
}

/**
 * Spawns a glowing cyber data burst at the collection coordinates.
 * @param {number} x
 * @param {number} y
 */
function spawnCollectParticles(x, y) {
  const count = 10;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
    const speed = 65 + Math.random() * 85;
    collectParticles.push({
      isRing: false,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 2.5 + Math.random() * 2,
      color: Math.random() > 0.35 ? "#52f5df" : "#ffffff",
      alpha: 1,
      maxLife: 0.35,
      life: 0.35,
    });
  }

  // Expanding neon shockwave ring
  collectParticles.push({
    isRing: true,
    x,
    y,
    radius: 4,
    maxRadius: 24,
    alpha: 1,
    maxLife: 0.28,
    life: 0.28,
  });
}

/**
 * Advances and trims collection particles.
 * @param {number} dt Delta time in seconds
 */
function updateParticles(dt) {
  for (let i = collectParticles.length - 1; i >= 0; i--) {
    const p = collectParticles[i];
    p.life -= dt;
    if (p.life <= 0) {
      collectParticles.splice(i, 1);
      continue;
    }
    p.alpha = Math.max(0, p.life / p.maxLife);
    if (p.isRing) {
      p.radius += (p.maxRadius - p.radius) * (dt * 12);
    } else {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.93;
      p.vy *= 0.93;
    }
  }
}

/**
 * Draws active collection feedback particles and shockwaves.
 * @param {CanvasRenderingContext2D} ctx
 */
function drawParticles(ctx) {
  for (const p of collectParticles) {
    ctx.save();
    if (p.isRing) {
      ctx.strokeStyle = `rgba(82, 245, 223, ${p.alpha * 0.9})`;
      ctx.lineWidth = 1.5;
      ctx.shadowColor = "#52f5df";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.shadowColor = "#52f5df";
      ctx.shadowBlur = 6;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.restore();
  }
}

/**
 * Draw step: renders environment, cyber grid, walls, exit portal, key, data chips, particles, and player.
 */
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 1. Draw digital cyber grid background
  drawEnvironment();

  // 2. Draw Level maze walls
  drawWalls(ctx, getLevelWalls());

  // 2b. Draw Moving Firewalls
  for (const firewall of activeFirewalls) {
    firewall.draw(ctx, lastTimestamp / 1000);
  }

  // 3. Draw Exit Portal (in locked or unlocked state)
  if (activeExit) {
    drawExitPortal(ctx, activeExit, isExitUnlocked, lastTimestamp / 1000);
  }

  // 4. Draw Security Key (if not yet collected)
  if (!hasSecurityKey && activeKey) {
    drawSecurityKey(ctx, activeKey, lastTimestamp / 1000);
  }

  // 5. Draw active collectible Data Chips
  drawDataChips(ctx, activeCollectibles, lastTimestamp / 1000);

  // 6. Draw active Virus enemies
  for (const enemy of activeEnemies) {
    enemy.draw(ctx);
  }

  // 7. Draw collection and damage feedback particles
  drawParticles(ctx);

  // 8. Draw Cyber Security Agent player
  player.draw(ctx);

  // 9. Draw subtle visual indicator when paused
  if (currentState === GameState.PAUSED) {
    drawPausedCanvasEffect();
  }
}

/**
 * Draws the cyber-security themed dark grid arena.
 */
function drawEnvironment() {
  const width = canvas.width;
  const height = canvas.height;
  const gridSize = 40;

  // Dark cyber background base
  ctx.fillStyle = "#070c14";
  ctx.fillRect(0, 0, width, height);

  // Subtle digital grid lines
  ctx.save();
  ctx.strokeStyle = "rgba(82, 245, 223, 0.05)";
  ctx.lineWidth = 1;

  ctx.beginPath();
  for (let x = 0; x <= width; x += gridSize) {
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, height);
  }
  for (let y = 0; y <= height; y += gridSize) {
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(width, y + 0.5);
  }
  ctx.stroke();

  // Grid intersection coordinate markers
  ctx.fillStyle = "rgba(82, 245, 223, 0.18)";
  for (let x = 0; x <= width; x += gridSize * 2) {
    for (let y = 0; y <= height; y += gridSize * 2) {
      ctx.fillRect(x - 1, y - 1, 2, 2);
    }
  }

  // Outer arena security perimeter border
  ctx.strokeStyle = "rgba(82, 245, 223, 0.35)";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, height - 2);

  // Decorative corner brackets
  const bracketLength = 16;
  ctx.strokeStyle = "#52f5df";
  ctx.lineWidth = 2;

  // Top-left
  ctx.beginPath();
  ctx.moveTo(2, bracketLength);
  ctx.lineTo(2, 2);
  ctx.lineTo(bracketLength, 2);
  ctx.stroke();

  // Top-right
  ctx.beginPath();
  ctx.moveTo(width - bracketLength, 2);
  ctx.lineTo(width - 2, 2);
  ctx.lineTo(width - 2, bracketLength);
  ctx.stroke();

  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(2, height - bracketLength);
  ctx.lineTo(2, height - 2);
  ctx.lineTo(bracketLength, height - 2);
  ctx.stroke();

  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(width - bracketLength, height - 2);
  ctx.lineTo(width - 2, height - 2);
  ctx.lineTo(width - 2, height - bracketLength);
  ctx.stroke();

  ctx.restore();
}

/**
 * Draws subtle scanline shading and standby watermark over the canvas when paused.
 */
function drawPausedCanvasEffect() {
  ctx.save();
  ctx.fillStyle = "rgba(7, 12, 18, 0.4)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}

/**
 * Returns whether the player has acquired the security key.
 * @returns {boolean}
 */
export function hasKey() {
  return hasSecurityKey;
}

/**
 * Returns whether the extraction portal is unlocked.
 * @returns {boolean}
 */
export function isExitPortalUnlocked() {
  return isExitUnlocked;
}

/**
 * Returns the current security key object.
 * @returns {{x: number, y: number, width: number, height: number, label?: string}|null}
 */
export function getKey() {
  return activeKey ? { ...activeKey } : null;
}

/**
 * Returns the extraction gateway object.
 * @returns {{x: number, y: number, width: number, height: number, label?: string}|null}
 */
export function getExit() {
  return activeExit ? { ...activeExit } : null;
}

/**
 * Returns active enemies in the level.
 * @returns {Array<Virus>}
 */
export function getEnemies() {
  return activeEnemies;
}

/**
 * Returns active moving firewalls in the level.
 * @returns {Array<MovingFirewall>}
 */
export function getFirewalls() {
  return activeFirewalls;
}

