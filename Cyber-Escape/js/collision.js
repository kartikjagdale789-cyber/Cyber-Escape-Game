// Reusable generic collision detection system for Cyber Escape.
// Supports rectangular (AABB) overlap, boundary resolution, and circle collision.

/**
 * Generic Axis-Aligned Bounding Box (AABB) rectangular collision detection.
 * Detects whether two rectangular entities overlap.
 * Designed for reuse across Player, Walls, Enemies, Data Chips, Keys, and Exits.
 * @param {{x: number, y: number, width: number, height: number}} rectA
 * @param {{x: number, y: number, width: number, height: number}} rectB
 * @returns {boolean} True if the two rectangles overlap
 */
export function checkCollision(rectA, rectB) {
  return (
    rectA.x < rectB.x + rectB.width &&
    rectA.x + rectA.width > rectB.x &&
    rectA.y < rectB.y + rectB.height &&
    rectA.y + rectA.height > rectB.y
  );
}

/**
 * Alias for checkCollision for backwards compatibility.
 */
export const checkAABB = checkCollision;

/**
 * Checks whether a rectangle collides with any obstacle in an array of obstacles.
 * @param {{x: number, y: number, width: number, height: number}} entity
 * @param {Array<{x: number, y: number, width: number, height: number}>} obstacles
 * @returns {{x: number, y: number, width: number, height: number}|null} The collided obstacle, or null
 */
export function checkCollisionList(entity, obstacles) {
  if (!Array.isArray(obstacles) || obstacles.length === 0) return null;
  for (const obstacle of obstacles) {
    if (checkCollision(entity, obstacle)) {
      return obstacle;
    }
  }
  return null;
}

/**
 * Clamps an entity's coordinates to remain strictly within the specified rectangular boundary.
 * Modifies entity.x and entity.y directly if bounds are violated.
 * @param {{x: number, y: number, width: number, height: number}} entity
 * @param {{x: number, y: number, width: number, height: number}} bounds
 * @returns {{left: boolean, right: boolean, top: boolean, bottom: boolean, collided: boolean}}
 */
export function resolveBoundaryCollision(entity, bounds) {
  const result = {
    left: false,
    right: false,
    top: false,
    bottom: false,
    collided: false,
  };

  if (entity.x < bounds.x) {
    entity.x = bounds.x;
    result.left = true;
    result.collided = true;
  } else if (entity.x + entity.width > bounds.x + bounds.width) {
    entity.x = bounds.x + bounds.width - entity.width;
    result.right = true;
    result.collided = true;
  }

  if (entity.y < bounds.y) {
    entity.y = bounds.y;
    result.top = true;
    result.collided = true;
  } else if (entity.y + entity.height > bounds.y + bounds.height) {
    entity.y = bounds.y + bounds.height - entity.height;
    result.bottom = true;
    result.collided = true;
  }

  return result;
}

/**
 * Generic circle collision detection.
 * Both objects must have x, y, and radius.
 * @param {{x: number, y: number, radius: number}} c1
 * @param {{x: number, y: number, radius: number}} c2
 * @returns {boolean}
 */
export function checkCircleCollision(c1, c2) {
  const dx = c1.x - c2.x;
  const dy = c1.y - c2.y;
  const distanceSq = dx * dx + dy * dy;
  const radiusSum = c1.radius + c2.radius;
  return distanceSq < radiusSum * radiusSum;
}

/**
 * Tests whether a finite line segment (x1, y1) -> (x2, y2) intersects an axis-aligned bounding box.
 * Uses Liang-Barsky parametric clipping algorithm for fast, exact line-box intersection.
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @param {{x: number, y: number, width: number, height: number}} rect
 * @returns {boolean} True if the line segment intersects or lies inside the rectangle
 */
export function lineIntersectsRect(x1, y1, x2, y2, rect) {
  // If either endpoint is inside the rectangle
  if (
    x1 >= rect.x &&
    x1 <= rect.x + rect.width &&
    y1 >= rect.y &&
    y1 <= rect.y + rect.height
  ) {
    return true;
  }
  if (
    x2 >= rect.x &&
    x2 <= rect.x + rect.width &&
    y2 >= rect.y &&
    y2 <= rect.y + rect.height
  ) {
    return true;
  }

  const dx = x2 - x1;
  const dy = y2 - y1;
  let t0 = 0.0;
  let t1 = 1.0;

  const p = [-dx, dx, -dy, dy];
  const q = [
    x1 - rect.x,
    rect.x + rect.width - x1,
    y1 - rect.y,
    rect.y + rect.height - y1,
  ];

  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) {
      if (q[i] < 0) return false; // Parallel and outside
    } else {
      const t = q[i] / p[i];
      if (p[i] < 0) {
        if (t > t1) return false;
        if (t > t0) t0 = t;
      } else {
        if (t < t0) return false;
        if (t < t1) t1 = t;
      }
    }
  }

  return t0 <= t1;
}

/**
 * Checks if there is an unblocked direct line of sight between two points.
 * @param {number} x1 Origin X
 * @param {number} y1 Origin Y
 * @param {number} x2 Target X
 * @param {number} y2 Target Y
 * @param {Array<{x: number, y: number, width: number, height: number}>} walls Obstacle walls
 * @param {number} [maxDistance=Infinity] Maximum sight range
 * @returns {boolean} True if line of sight is clear
 */
export function hasLineOfSight(x1, y1, x2, y2, walls = [], maxDistance = Infinity) {
  const dist = Math.hypot(x2 - x1, y2 - y1);
  if (dist > maxDistance) return false;
  if (dist === 0) return true;

  for (const wall of walls) {
    if (lineIntersectsRect(x1, y1, x2, y2, wall)) {
      return false;
    }
  }
  return true;
}

/**
 * Checks if a direct corridor segment with clearance padding is free of wall collisions.
 * Inflates walls by clearance padding so entities do not scrape or catch on corners.
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @param {Array<{x: number, y: number, width: number, height: number}>} walls
 * @param {number} [padding=10]
 * @returns {boolean} True if unobstructed with clearance
 */
export function hasClearPath(x1, y1, x2, y2, walls = [], padding = 10) {
  for (const wall of walls) {
    const inflated = {
      x: wall.x - padding,
      y: wall.y - padding,
      width: wall.width + padding * 2,
      height: wall.height + padding * 2,
    };
    if (lineIntersectsRect(x1, y1, x2, y2, inflated)) {
      return false;
    }
  }
  return true;
}

