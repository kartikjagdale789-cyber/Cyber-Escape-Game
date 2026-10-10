// Cyber Security Agent Player entity module for Cyber Escape.
// Handles movement calculation, separate X/Y collision checking for sliding, direction tracking, and rendering.
import { checkCollision, resolveBoundaryCollision } from "./collision.js";

export class Player {
  /**
   * Initializes the Cyber Security Agent player.
   * @param {number} x
   * @param {number} y
   */
  constructor(x = 100, y = 100) {
    this.x = x;
    this.y = y;
    this.width = 28;
    this.height = 28;
    this.speed = 220; // pixels per second
    this.lives = 3;
    this.direction = "right"; // "up" | "down" | "left" | "right"
    this.isMoving = false;
    this.animTime = 0;
    this.invulnerableTimer = 0; // invulnerability countdown in seconds
  }

  /**
   * Resets player state and positions the player at starting coordinates.
   * @param {number} x
   * @param {number} y
   */
  reset(x, y) {
    this.x = x;
    this.y = y;
    this.direction = "right";
    this.isMoving = false;
    this.lives = 3;
    this.animTime = 0;
    this.invulnerableTimer = 0;
  }

  /**
   * Triggers damage if not currently invulnerable.
   * @returns {boolean} True if damage was applied, false if player was protected by invulnerability
   */
  takeDamage() {
    if (this.invulnerableTimer > 0) {
      return false;
    }
    this.invulnerableTimer = 1.5; // 1.5s invulnerability grace period
    return true;
  }

  /**
   * Whether player is currently invulnerable.
   * @returns {boolean}
   */
  get isInvulnerable() {
    return this.invulnerableTimer > 0;
  }

  /**
   * Updates player movement, direction, and boundary & wall collisions.
   * Uses separate X and Y collision checks so the player can slide smoothly along walls.
   * @param {number} dt Delta time in seconds
   * @param {{up: boolean, down: boolean, left: boolean, right: boolean}} input Active directional keys
   * @param {{x: number, y: number, width: number, height: number}} bounds Canvas boundaries
   * @param {Array<{x: number, y: number, width: number, height: number}>} [walls] Array of wall obstacles
   */
  update(dt, input, bounds, walls = []) {
    // Tick down invulnerability timer
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer = Math.max(0, this.invulnerableTimer - dt);
    }
    let dx = 0;
    let dy = 0;

    if (input.up) dy -= 1;
    if (input.down) dy += 1;
    if (input.left) dx -= 1;
    if (input.right) dx += 1;

    this.isMoving = dx !== 0 || dy !== 0;

    if (this.isMoving) {
      // 1. Update visual direction according to the last movement direction
      if (Math.abs(dx) > Math.abs(dy)) {
        this.direction = dx > 0 ? "right" : "left";
      } else if (Math.abs(dy) > Math.abs(dx)) {
        this.direction = dy > 0 ? "down" : "up";
      } else {
        if (dx > 0) this.direction = "right";
        else if (dx < 0) this.direction = "left";
        else if (dy > 0) this.direction = "down";
        else if (dy < 0) this.direction = "up";
      }

      // 2. Normalize velocity vector so diagonal movement is not faster
      const length = Math.hypot(dx, dy);
      const moveX = (dx / length) * this.speed * dt;
      const moveY = (dy / length) * this.speed * dt;

      // 3. Move along X axis and check collision
      if (moveX !== 0) {
        let targetX = this.x + moveX;

        // Boundary constraint for X
        if (targetX < bounds.x) {
          targetX = bounds.x;
        } else if (targetX + this.width > bounds.x + bounds.width) {
          targetX = bounds.x + bounds.width - this.width;
        }

        // Test collision against walls with new X
        const testBoxX = {
          x: targetX,
          y: this.y,
          width: this.width,
          height: this.height,
        };

        let collidedX = false;
        for (const wall of walls) {
          if (checkCollision(testBoxX, wall)) {
            collidedX = true;
            // Snap to wall edge for pixel-perfect contact
            if (moveX > 0) {
              targetX = Math.min(targetX, wall.x - this.width);
            } else if (moveX < 0) {
              targetX = Math.max(targetX, wall.x + wall.width);
            }
            break;
          }
        }

        // Keep inside bounds after snapping
        if (targetX < bounds.x) targetX = bounds.x;
        if (targetX + this.width > bounds.x + bounds.width) {
          targetX = bounds.x + bounds.width - this.width;
        }

        // Apply X movement if no collision or safely snapped
        if (!collidedX) {
          this.x = targetX;
        } else {
          // Verify snapped position doesn't overlap any wall
          const snappedBox = { x: targetX, y: this.y, width: this.width, height: this.height };
          let validSnap = true;
          for (const wall of walls) {
            if (checkCollision(snappedBox, wall)) {
              validSnap = false;
              break;
            }
          }
          if (validSnap) {
            this.x = targetX;
          }
        }
      }

      // 4. Move along Y axis and check collision (enables sliding along walls)
      if (moveY !== 0) {
        let targetY = this.y + moveY;

        // Boundary constraint for Y
        if (targetY < bounds.y) {
          targetY = bounds.y;
        } else if (targetY + this.height > bounds.y + bounds.height) {
          targetY = bounds.y + bounds.height - this.height;
        }

        // Test collision against walls with new Y
        const testBoxY = {
          x: this.x,
          y: targetY,
          width: this.width,
          height: this.height,
        };

        let collidedY = false;
        for (const wall of walls) {
          if (checkCollision(testBoxY, wall)) {
            collidedY = true;
            // Snap to wall edge for pixel-perfect contact
            if (moveY > 0) {
              targetY = Math.min(targetY, wall.y - this.height);
            } else if (moveY < 0) {
              targetY = Math.max(targetY, wall.y + wall.height);
            }
            break;
          }
        }

        // Keep inside bounds after snapping
        if (targetY < bounds.y) targetY = bounds.y;
        if (targetY + this.height > bounds.y + bounds.height) {
          targetY = bounds.y + bounds.height - this.height;
        }

        // Apply Y movement if no collision or safely snapped
        if (!collidedY) {
          this.y = targetY;
        } else {
          const snappedBox = { x: this.x, y: targetY, width: this.width, height: this.height };
          let validSnap = true;
          for (const wall of walls) {
            if (checkCollision(snappedBox, wall)) {
              validSnap = false;
              break;
            }
          }
          if (validSnap) {
            this.y = targetY;
          }
        }
      }

      this.animTime += dt * 8;
    } else {
      this.animTime += dt * 2;
    }

    // Safety boundary pass using reusable collision module
    resolveBoundaryCollision(this, bounds);
  }

  /**
   * Renders the Cyber Security Agent using geometric Canvas shapes with neon glowing aesthetics.
   * @param {CanvasRenderingContext2D} ctx
   */
  draw(ctx) {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const half = this.width / 2;

    ctx.save();
    ctx.translate(cx, cy);

    // Damage flicker effect during invulnerability grace period
    if (this.invulnerableTimer > 0) {
      const isVisiblePhase = Math.floor(this.invulnerableTimer * 14) % 2 === 0;
      if (isVisiblePhase) {
        ctx.globalAlpha = 0.35;
      }
    }

    // Rotate context based on the current facing direction
    let angle = 0;
    switch (this.direction) {
      case "up":
        angle = -Math.PI / 2;
        break;
      case "down":
        angle = Math.PI / 2;
        break;
      case "left":
        angle = Math.PI;
        break;
      case "right":
      default:
        angle = 0;
        break;
    }
    ctx.rotate(angle);

    // 1. Dual micro-thruster exhaust trails (visible when moving)
    if (this.isMoving) {
      const flicker = 0.8 + 0.35 * Math.sin(this.animTime * 4);
      ctx.save();
      ctx.fillStyle = "rgba(82, 245, 223, 0.85)";
      ctx.shadowColor = "#52f5df";
      ctx.shadowBlur = 8;

      ctx.beginPath();
      ctx.moveTo(-half + 3, -6);
      ctx.lineTo(-half - 5 * flicker, -5);
      ctx.lineTo(-half + 3, -4);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(-half + 3, 4);
      ctx.lineTo(-half - 5 * flicker, 5);
      ctx.lineTo(-half + 3, 6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // 2. Outer cyber chassis (futuristic stealth interceptor profile)
    ctx.save();
    ctx.shadowColor = "#52f5df";
    ctx.shadowBlur = 10;
    ctx.fillStyle = "#0c1f2b";
    ctx.strokeStyle = "#52f5df";
    ctx.lineWidth = 1.8;

    ctx.beginPath();
    ctx.moveTo(half - 2, 0); // Front nose
    ctx.lineTo(half - 9, -half + 3); // Forward flank right
    ctx.lineTo(-half + 4, -half + 4); // Rear right wingtip
    ctx.lineTo(-half + 2, -4); // Thruster recess right
    ctx.lineTo(-half + 6, 0); // Rear center notch
    ctx.lineTo(-half + 2, 4); // Thruster recess left
    ctx.lineTo(-half + 4, half - 4); // Rear left wingtip
    ctx.lineTo(half - 9, half - 3); // Forward flank left
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 3. Cyber panel circuit lines
    ctx.save();
    ctx.strokeStyle = "rgba(82, 245, 223, 0.45)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-half + 8, -6);
    ctx.lineTo(0, -6);
    ctx.lineTo(half - 11, -2);
    ctx.moveTo(-half + 8, 6);
    ctx.lineTo(0, 6);
    ctx.lineTo(half - 11, 2);
    ctx.stroke();
    ctx.restore();

    // 4. Central Security Power Core (pulsing white/cyan reactor)
    const pulse = 0.8 + 0.25 * Math.sin(this.animTime);
    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "#52f5df";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(-1, 0, 3 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 5. Tactical Visor / Sensor Array (bright glowing cyan front scanner)
    ctx.save();
    ctx.fillStyle = "#52f5df";
    ctx.shadowColor = "#52f5df";
    ctx.shadowBlur = 10;
    ctx.fillRect(half - 8, -4, 4, 8);
    ctx.restore();

    ctx.restore();
  }
}
