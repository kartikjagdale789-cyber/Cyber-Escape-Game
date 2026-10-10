// Moving Firewall obstacle module for Cyber Escape (Level 2).
// Implements dynamic moving hazard barriers with smooth back-and-forth ping-pong movement,
// distinct glowing red/orange hazard aesthetics, animated warning stripes, and cyber hazard patterns.
import { checkCollision } from "./collision.js";

export class MovingFirewall {
  /**
   * Initializes a dynamic moving firewall obstacle.
   * @param {{
   *   id?: string,
   *   x?: number,
   *   y?: number,
   *   width?: number,
   *   height?: number,
   *   startX?: number,
   *   endX?: number,
   *   startY?: number,
   *   endY?: number,
   *   speed?: number,
   *   axis?: "x" | "y",
   *   direction?: number,
   *   label?: string
   * }} config
   */
  constructor(config = {}) {
    this.id = config.id || "fw-1";
    this.startX = config.startX ?? config.x ?? 0;
    this.endX = config.endX ?? config.x ?? this.startX;
    this.startY = config.startY ?? config.y ?? 0;
    this.endY = config.endY ?? config.y ?? this.startY;

    this.x = this.startX;
    this.y = this.startY;
    this.width = config.width || 44;
    this.height = config.height || 18;
    this.speed = config.speed || 60;
    this.axis = config.axis || (this.startX !== this.endX ? "x" : "y");
    this.direction = config.direction ?? 1; // 1 = forward towards end, -1 = reverse towards start
    this.label = config.label || "MOVING_FIREWALL";
    this.animTime = 0;
  }

  /**
   * Resets firewall to its initial coordinate and direction.
   */
  reset() {
    this.x = this.startX;
    this.y = this.startY;
    this.direction = 1;
    this.animTime = 0;
  }

  /**
   * Updates firewall position along its designated movement track.
   * Reverses direction smoothly upon reaching boundaries.
   * @param {number} dt Delta time in seconds
   */
  update(dt) {
    this.animTime += dt;

    if (this.axis === "x") {
      const minX = Math.min(this.startX, this.endX);
      const maxX = Math.max(this.startX, this.endX);

      this.x += this.direction * this.speed * dt;

      if (this.direction > 0 && this.x >= maxX) {
        this.x = maxX;
        this.direction = -1;
      } else if (this.direction < 0 && this.x <= minX) {
        this.x = minX;
        this.direction = 1;
      }
    } else {
      const minY = Math.min(this.startY, this.endY);
      const maxY = Math.max(this.startY, this.endY);

      this.y += this.direction * this.speed * dt;

      if (this.direction > 0 && this.y >= maxY) {
        this.y = maxY;
        this.direction = -1;
      } else if (this.direction < 0 && this.y <= minY) {
        this.y = minY;
        this.direction = 1;
      }
    }
  }

  /**
   * Renders the glowing hazard firewall barrier:
   * - Red/orange warning color palette (#ff3b30, #ff9500)
   * - High-contrast animated diagonal hazard stripes
   * - Radiant glowing barrier aura
   * - Digital cyber hazard label ⚠ FIREWALL ⚠
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} [time]
   */
  draw(ctx, time = this.animTime) {
    ctx.save();

    const pulse = 1 + 0.08 * Math.sin(time * 8);

    // 1. Radiant neon orange/red outer warning glow
    ctx.shadowColor = "#ff3b30";
    ctx.shadowBlur = 12 * pulse;

    // 2. Dark red/black hazard core base
    ctx.fillStyle = "#1e0407";
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // 3. Bright warning neon outer frame
    ctx.strokeStyle = "#ff3b30";
    ctx.lineWidth = 2.0;
    ctx.strokeRect(this.x, this.y, this.width, this.height);

    // 4. Animated diagonal hazard stripes
    ctx.save();
    ctx.beginPath();
    ctx.rect(this.x + 1, this.y + 1, this.width - 2, this.height - 2);
    ctx.clip();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255, 149, 0, 0.75)";
    ctx.lineWidth = 3.5;

    const stripeSpacing = 12;
    const stripeOffset = (time * 30) % stripeSpacing;

    const startX = this.x - this.height;
    const endX = this.x + this.width + this.height;

    ctx.beginPath();
    for (let sx = startX + stripeOffset; sx < endX; sx += stripeSpacing) {
      ctx.moveTo(sx, this.y);
      ctx.lineTo(sx + this.height, this.y + this.height);
    }
    ctx.stroke();

    // 5. Digital warning badge / icon
    if (this.width >= 40 && this.height >= 16) {
      // Horizontal firewall label
      ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
      const labelW = Math.min(this.width - 6, 70);
      const labelH = this.height - 4;
      ctx.fillRect(this.x + (this.width - labelW) / 2, this.y + 2, labelW, labelH);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 7px 'Courier New', monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("⚠ FIREWALL ⚠", this.x + this.width / 2, this.y + this.height / 2);
    } else if (this.height >= 40 && this.width >= 16) {
      // Vertical firewall label
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 9px 'Courier New', monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("⚠", this.x + this.width / 2, this.y + this.height / 2);
    }

    ctx.restore();

    // 6. Corner hazard brackets
    ctx.strokeStyle = "#ff9500";
    ctx.lineWidth = 1.6;
    const b = 3.5;

    // Top-left
    ctx.beginPath();
    ctx.moveTo(this.x, this.y + b);
    ctx.lineTo(this.x, this.y);
    ctx.lineTo(this.x + b, this.y);
    ctx.stroke();

    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(this.x + this.width, this.y + this.height - b);
    ctx.lineTo(this.x + this.width, this.y + this.height);
    ctx.lineTo(this.x + this.width - b, this.y + this.height);
    ctx.stroke();

    ctx.restore();
  }
}
