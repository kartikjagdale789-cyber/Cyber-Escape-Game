// Virus Enemy entity module for Cyber Escape.
// Implements an omniscient, intelligent 2D maze hunting AI:
// - Always aware of the player's current position and velocity.
// - No line-of-sight requirement, no hearing system, no patrol routes, no search state.
// - Continuously in CHASE state, hunting the player through maze corridors.
// - Uses A* pathfinding to intelligently navigate around walls and obstacles.
// - Intercepts the player using velocity-based prediction (0.3 - 0.5s).
// - Smooth steering with velocity interpolation, wall sliding, and anti-stuck watchdog.
// - Never physically passes through walls or tunnels.
import { checkCollision, hasLineOfSight, hasClearPath } from "./collision.js";
import { getGrid, findPath } from "./pathfinding.js";

/**
 * AI State enumeration for Virus enemies.
 * The Virus is always in CHASE mode during active gameplay.
 */
export const AIState = Object.freeze({
  CHASE: "CHASE",
  // Legacy aliases for backward compatibility if referenced
  PATROL: "CHASE",
  INVESTIGATE: "CHASE",
  SEARCH: "CHASE",
  RETURN: "CHASE",
});

export class Virus {
  // Global toggle for developer debug state label (disabled for clean gameplay)
  static DEBUG_STATE = false;

  /**
   * Initializes an omniscient hunting Virus enemy entity.
   * @param {{
   *   id?: string,
   *   x?: number,
   *   y?: number,
   *   width?: number,
   *   height?: number,
   *   speed?: number,
   *   predictionTime?: number,
   *   repathInterval?: number,
   *   label?: string
   * }} config
   */
  constructor(config = {}) {
    this.id = config.id || "virus-1";
    this.type = "virus";
    this.label = config.label || "VIRUS_BOT";
    this.spawnX = config.x ?? 500;
    this.spawnY = config.y ?? 220;
    this.x = this.spawnX;
    this.y = this.spawnY;
    this.width = config.width || 26;
    this.height = config.height || 26;

    // AI configuration parameters (balanced for Level 1)
    this.config = {
      speed: config.speed ?? 60, // 60 px/sec for Level 1 (player is 220 px/sec)
      predictionTime: config.predictionTime ?? 0.35, // 0.3 - 0.5s interception horizon
      repathInterval: config.repathInterval ?? 0.28, // 250 - 300ms A* throttling
    };

    this.speed = this.config.speed;

    // Smooth movement velocities
    this.vx = 0;
    this.vy = 0;

    // Active AI state - always CHASE
    this.state = AIState.CHASE;
    this.currentPath = [];
    this.pathTimer = 0;

    // Target tracking for smart repath triggers
    this.lastTargetDirection = null;
    this.lastTargetPos = null;

    // Anti-stuck watchdog
    this.stuckTimer = 0;
    this.lastPosX = this.x;
    this.lastPosY = this.y;

    this.hasTargetLOS = false;
    this.showDebugState = Virus.DEBUG_STATE;
    this.animTime = 0;
  }

  /**
   * Resets virus back to its initial spawn state and begins chasing.
   */
  reset() {
    this.x = this.spawnX;
    this.y = this.spawnY;
    this.vx = 0;
    this.vy = 0;
    this.state = AIState.CHASE;
    this.currentPath = [];
    this.pathTimer = 0;
    this.lastTargetDirection = null;
    this.lastTargetPos = null;
    this.stuckTimer = 0;
    this.lastPosX = this.x;
    this.lastPosY = this.y;
    this.hasTargetLOS = false;
    this.animTime = 0;
  }

  /**
   * Center X coordinate of the virus entity.
   * @returns {number}
   */
  get centerX() {
    return this.x + this.width / 2;
  }

  /**
   * Center Y coordinate of the virus entity.
   * @returns {number}
   */
  get centerY() {
    return this.y + this.height / 2;
  }

  /**
   * Checks whether the virus has unblocked direct line-of-sight to the player.
   * Note: The virus's knowledge is omniscient; line-of-sight is used only for visual effects.
   * @param {{x: number, y: number, width: number, height: number}} player
   * @param {Array<{x: number, y: number, width: number, height: number}>} walls
   * @returns {boolean}
   */
  checkLineOfSight(player, walls = []) {
    if (!player) return false;
    const px = player.x + player.width / 2;
    const py = player.y + player.height / 2;
    return hasLineOfSight(this.centerX, this.centerY, px, py, walls, 500);
  }

  /**
   * Predicts player's future interception position based on current velocity.
   * Targets 0.3 - 0.5s ahead to intercept the player through corridors.
   * If predicted point hits a wall or boundary, falls back to the player's current position.
   * @param {{x: number, y: number, width: number, height: number, direction?: string, isMoving?: boolean, speed?: number, vx?: number, vy?: number}} player
   * @param {{x: number, y: number, width: number, height: number}} bounds
   * @param {Array<{x: number, y: number, width: number, height: number}>} walls
   * @returns {{x: number, y: number}}
   */
  predictPlayerPosition(player, bounds, walls = []) {
    const px = player.x + player.width / 2;
    const py = player.y + player.height / 2;

    const isMoving = Boolean(
      player.isMoving ||
      Math.hypot(player.vx || 0, player.vy || 0) > 10
    );

    if (!isMoving) {
      return { x: px, y: py };
    }

    const pSpeed = player.speed || 220;
    let vx = player.vx || 0;
    let vy = player.vy || 0;

    if (vx === 0 && vy === 0) {
      switch (player.direction) {
        case "up":
          vy = -pSpeed;
          break;
        case "down":
          vy = pSpeed;
          break;
        case "left":
          vx = -pSpeed;
          break;
        case "right":
        default:
          vx = pSpeed;
          break;
      }
    }

    const horizon = this.config.predictionTime;
    const predX = px + vx * horizon;
    const predY = py + vy * horizon;

    // Validate that predicted point is inside arena bounds and does not collide with walls
    const half = 12;
    const testBox = {
      x: predX - half,
      y: predY - half,
      width: half * 2,
      height: half * 2,
    };

    if (
      testBox.x < bounds.x ||
      testBox.x + testBox.width > bounds.x + bounds.width ||
      testBox.y < bounds.y ||
      testBox.y + testBox.height > bounds.y + bounds.height
    ) {
      return { x: px, y: py };
    }

    for (const wall of walls) {
      if (checkCollision(testBox, wall)) {
        // Intercept at current player coordinate if predicted point is inside a wall
        return { x: px, y: py };
      }
    }

    return { x: predX, y: predY };
  }

  /**
   * Main AI and movement update tick.
   * The Virus ALWAYS knows the player's current position and continually hunts them using A*.
   * @param {number} dt Delta time in seconds
   * @param {object} player Player entity
   * @param {{x: number, y: number, width: number, height: number}} bounds Canvas boundaries
   * @param {Array<{x: number, y: number, width: number, height: number}>} walls Level walls
   */
  update(dt, player, bounds, walls = [], dynamicObstacles = []) {
    this.animTime += dt;
    if (!player) return;

    const allObstacles = dynamicObstacles.length > 0 ? [...walls, ...dynamicObstacles] : walls;

    // Compute line of sight for subtle visual intensity (does NOT restrict chasing)
    this.hasTargetLOS = this.checkLineOfSight(player, walls);

    // 1. Calculate target position using current player coordinate + interception prediction
    const targetPos = this.predictPlayerPosition(player, bounds, allObstacles);

    // 2. Controlled A* path recalculation (throttled to 250 - 300ms, with responsive triggers)
    this.pathTimer += dt;

    const dirChanged = Boolean(
      player.direction &&
      this.lastTargetDirection &&
      player.direction !== this.lastTargetDirection
    );

    const distFromLastTarget = this.lastTargetPos
      ? Math.hypot(targetPos.x - this.lastTargetPos.x, targetPos.y - this.lastTargetPos.y)
      : Infinity;

    const pathEmpty = !this.currentPath || this.currentPath.length <= 1;
    const timerElapsed = this.pathTimer >= this.config.repathInterval;

    // Recalculate route if path finished, player turned, player moved significantly, or interval elapsed
    if (pathEmpty || dirChanged || distFromLastTarget > 35 || timerElapsed) {
      const grid = getGrid(walls, bounds.width, bounds.height);
      this.currentPath = findPath(
        grid,
        { x: this.centerX, y: this.centerY },
        targetPos,
        walls,
        dynamicObstacles
      );
      this.pathTimer = 0;
      this.lastTargetDirection = player.direction;
      this.lastTargetPos = { ...targetPos };
    }

    // 3. Steer along waypoints with smooth velocity interpolation, wall sliding, and anti-stuck protection
    const grid = getGrid(walls, bounds.width, bounds.height);
    this.followPath(dt, bounds, allObstacles, grid);
  }

  /**
   * Steers the virus continuously and smoothly along path waypoints.
   * Avoids cell-by-cell jumps, implements velocity interpolation and wall sliding.
   * Never physically passes through walls.
   * @param {number} dt Delta time in seconds
   * @param {{x: number, y: number, width: number, height: number}} bounds Canvas boundaries
   * @param {Array<{x: number, y: number, width: number, height: number}>} walls Level walls
   * @param {import('./pathfinding.js').PathfindingGrid} [grid]
   */
  followPath(dt, bounds, walls = [], grid = null) {
    if (!this.currentPath || this.currentPath.length === 0) {
      // Decelerate smoothly to stop
      this.vx *= Math.max(0, 1 - dt * 10);
      this.vy *= Math.max(0, 1 - dt * 10);
      return;
    }

    let target = this.currentPath[0];
    let dx = target.x - this.centerX;
    let dy = target.y - this.centerY;
    let dist = Math.hypot(dx, dy);

    // Consume waypoint when arrived close
    while (dist < 14 && this.currentPath.length > 1) {
      this.currentPath.shift();
      target = this.currentPath[0];
      dx = target.x - this.centerX;
      dy = target.y - this.centerY;
      dist = Math.hypot(dx, dy);
    }

    // Smooth corner shortcutting: if next node after target has clear path with clearance, advance early
    if (this.currentPath.length > 2) {
      const nextNode = this.currentPath[1];
      if (hasClearPath(this.centerX, this.centerY, nextNode.x, nextNode.y, walls, 11)) {
        this.currentPath.shift();
        target = this.currentPath[0];
        dx = target.x - this.centerX;
        dy = target.y - this.centerY;
        dist = Math.hypot(dx, dy);
      }
    }

    if (dist < 1) return;

    // Desired direction vector
    const dirX = dx / dist;
    const dirY = dy / dist;

    // Smooth velocity interpolation for natural curved steering around corners
    const turnRate = Math.min(1, dt * 12);
    const targetVx = dirX * this.speed;
    const targetVy = dirY * this.speed;

    this.vx += (targetVx - this.vx) * turnRate;
    this.vy += (targetVy - this.vy) * turnRate;

    const moveX = this.vx * dt;
    const moveY = this.vy * dt;

    // Separate X-axis movement and wall collision resolution (wall sliding)
    if (moveX !== 0) {
      let nextX = this.x + moveX;

      if (bounds) {
        if (nextX < bounds.x) nextX = bounds.x;
        else if (nextX + this.width > bounds.x + bounds.width) {
          nextX = bounds.x + bounds.width - this.width;
        }
      }

      const boxX = { x: nextX, y: this.y, width: this.width, height: this.height };
      let colX = false;
      for (const wall of walls) {
        if (checkCollision(boxX, wall)) {
          colX = true;
          if (moveX > 0) nextX = Math.min(nextX, wall.x - this.width);
          else if (moveX < 0) nextX = Math.max(nextX, wall.x + wall.width);
          break;
        }
      }

      if (!colX) {
        this.x = nextX;
      } else {
        const snapBox = { x: nextX, y: this.y, width: this.width, height: this.height };
        let validSnap = true;
        for (const wall of walls) {
          if (checkCollision(snapBox, wall)) {
            validSnap = false;
            break;
          }
        }
        if (validSnap) this.x = nextX;
        this.vx = 0; // zero out blocked velocity to allow perpendicular sliding
      }
    }

    // Separate Y-axis movement and wall collision resolution (wall sliding)
    if (moveY !== 0) {
      let nextY = this.y + moveY;

      if (bounds) {
        if (nextY < bounds.y) nextY = bounds.y;
        else if (nextY + this.height > bounds.y + bounds.height) {
          nextY = bounds.y + bounds.height - this.height;
        }
      }

      const boxY = { x: this.x, y: nextY, width: this.width, height: this.height };
      let colY = false;
      for (const wall of walls) {
        if (checkCollision(boxY, wall)) {
          colY = true;
          if (moveY > 0) nextY = Math.min(nextY, wall.y - this.height);
          else if (moveY < 0) nextY = Math.max(nextY, wall.y + wall.height);
          break;
        }
      }

      if (!colY) {
        this.y = nextY;
      } else {
        const snapBox = { x: this.x, y: nextY, width: this.width, height: this.height };
        let validSnap = true;
        for (const wall of walls) {
          if (checkCollision(snapBox, wall)) {
            validSnap = false;
            break;
          }
        }
        if (validSnap) this.y = nextY;
        this.vy = 0; // zero out blocked velocity to allow perpendicular sliding
      }
    }

    // Anti-stuck watchdog: detects if enemy is pinned against a geometry corner
    const distMoved = Math.hypot(this.x - this.lastPosX, this.y - this.lastPosY);
    if (distMoved < 0.8 && this.currentPath.length > 0) {
      this.stuckTimer += dt;
      if (this.stuckTimer > 0.3) {
        this.stuckTimer = 0;
        this.currentPath.shift(); // skip blocked node and re-aim
        this.pathTimer = 999; // trigger immediate repath
      }
    } else {
      this.stuckTimer = 0;
    }

    this.lastPosX = this.x;
    this.lastPosY = this.y;
  }

  /**
   * Renders the corrupted digital Virus Bot:
   * - Red/magenta/purple warning color palette
   * - Dark corrupted nucleus center (#15040d)
   * - Spiked cyber virus outer tendrils/nodes
   * - Corrupted cross/eye symbol (✕)
   * - Menacing crimson aura and rotation
   * - No debug text labels rendered during gameplay
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;

    const pulse = 1 + 0.1 * Math.sin(this.animTime * 8);
    const rotation = this.animTime * 2.0;

    ctx.save();
    ctx.translate(cx, cy);

    // 1. Menacing red/magenta neon aura
    ctx.shadowColor = "#ff0055";
    ctx.shadowBlur = 15;

    // 2. Corrupted outer spiked nodes / tentacles (6 orbiting digital spikes)
    ctx.save();
    ctx.rotate(rotation);
    ctx.strokeStyle = "#ff0055";
    ctx.lineWidth = 1.6;
    ctx.fillStyle = "#ff0077";

    const nodeCount = 6;
    const spikeDist = 11.5 * pulse;
    for (let i = 0; i < nodeCount; i++) {
      const angle = (Math.PI * 2 * i) / nodeCount;
      const nx = Math.cos(angle) * spikeDist;
      const ny = Math.sin(angle) * spikeDist;

      // Tendril spine
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(nx, ny);
      ctx.stroke();

      // Outer satellite node
      ctx.beginPath();
      ctx.arc(nx, ny, 2.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 3. Counter-rotating inner jagged shield / corrupted diamond
    ctx.save();
    ctx.rotate(-rotation * 0.7);
    ctx.strokeStyle = "#ff477e";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    const coreR = 8.2 * pulse;
    ctx.moveTo(0, -coreR);
    ctx.lineTo(coreR, 0);
    ctx.lineTo(0, coreR);
    ctx.lineTo(-coreR, 0);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();

    // 4. Dark corrupted nucleus body
    ctx.fillStyle = "#15040d";
    ctx.beginPath();
    ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ff0055";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 5. Corrupted Virus Cross Symbol (✕ digital glitch eye)
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.4;
    ctx.shadowColor = "#ffffff";
    ctx.shadowBlur = 5;
    const xSize = 3;
    ctx.beginPath();
    ctx.moveTo(-xSize, -xSize);
    ctx.lineTo(xSize, xSize);
    ctx.moveTo(xSize, -xSize);
    ctx.lineTo(-xSize, xSize);
    ctx.stroke();

    // 6. Developer debug AI state indicator (OFF by default for gameplay)
    if (this.showDebugState) {
      ctx.shadowBlur = 0;
      ctx.font = "bold 8px 'Courier New', monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = "#ff0055";
      ctx.fillText(`[${this.state}]`, 0, -this.height / 2 - 8);
    }

    ctx.restore();
  }
}
