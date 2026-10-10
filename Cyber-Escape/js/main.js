import {
  initializeGame,
  getPlayer,
  getGameState,
  getWalls,
  getLevelData,
  getCollectibles,
  getEnemies,
  getFirewalls,
  getGameStats,
  hasKey,
  isExitPortalUnlocked,
  getKey,
  getExit,
  completeLevel,
  triggerGameOver,
  startGame,
  startLevel,
  advanceNextLevel,
  pauseGame,
  resumeGame,
  exitToMenu,
} from "./game.js";
import { AIState, Virus } from "./enemy.js";
import { MovingFirewall } from "./firewall.js";

initializeGame();

// Global debug handle for console testing and verification
window.CyberEscape = {
  getPlayer,
  getGameState,
  getWalls,
  getLevelData,
  getCollectibles,
  getEnemies,
  getFirewalls,
  getGameStats,
  hasKey,
  isExitPortalUnlocked,
  getKey,
  getExit,
  completeLevel,
  triggerGameOver,
  startGame,
  startLevel,
  advanceNextLevel,
  pauseGame,
  resumeGame,
  exitToMenu,
  AIState,
  Virus,
  MovingFirewall,
};


