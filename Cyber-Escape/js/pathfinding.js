// Lightweight A* pathfinding and navigation grid module for Cyber Escape.
// Constructs a walkable maze grid from level walls, computes shortest paths avoiding obstacles,
// and applies line-of-sight path smoothing for natural, fluid enemy navigation.
import { hasLineOfSight, hasClearPath, checkCollision } from "./collision.js";

/**
 * Grid navigation representation of the maze environment.
 */
export class PathfindingGrid {
  /**
   * @param {Array<{x: number, y: number, width: number, height: number}>} walls
   * @param {number} [width=800]
   * @param {number} [height=500]
   * @param {number} [cellSize=20]
   */
  constructor(walls = [], width = 800, height = 500, cellSize = 20) {
    this.width = width;
    this.height = height;
    this.cellSize = cellSize;
    this.cols = Math.ceil(width / cellSize);
    this.rows = Math.ceil(height / cellSize);
    this.walls = walls;
    this.grid = new Uint8Array(this.cols * this.rows); // 0 = walkable, 1 = blocked
    this.build(walls);
  }

  /**
   * Builds the walkable grid matrix, inflating walls by half-entity size (11px)
   * to guarantee the 26x26 virus entity can freely navigate without clipping.
   * @param {Array<{x: number, y: number, width: number, height: number}>} walls
   */
  build(walls) {
    this.grid.fill(0);
    const halfEntity = 11; // Collision clearance padding for entity

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cx = c * this.cellSize + this.cellSize / 2;
        const cy = r * this.cellSize + this.cellSize / 2;

        // Bounding box of the entity centered at this cell
        const box = {
          x: cx - halfEntity,
          y: cy - halfEntity,
          width: halfEntity * 2,
          height: halfEntity * 2,
        };

        // Out-of-bounds boundary check
        if (
          box.x < 0 ||
          box.x + box.width > this.width ||
          box.y < 0 ||
          box.y + box.height > this.height
        ) {
          this.grid[r * this.cols + c] = 1;
          continue;
        }

        // Test collision against walls
        let blocked = false;
        for (const wall of walls) {
          if (
            box.x < wall.x + wall.width &&
            box.x + box.width > wall.x &&
            box.y < wall.y + wall.height &&
            box.y + box.height > wall.y
          ) {
            blocked = true;
            break;
          }
        }

        if (blocked) {
          this.grid[r * this.cols + c] = 1;
        }
      }
    }
  }

  /**
   * Returns whether a cell is walkable.
   * @param {number} c
   * @param {number} r
   * @returns {boolean}
   */
  isWalkable(c, r) {
    if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) return false;
    return this.grid[r * this.cols + c] === 0;
  }

  /**
   * Returns nearest walkable grid cell coordinates if target cell is inside a wall.
   * @param {number} c
   * @param {number} r
   * @returns {{c: number, r: number}}
   */
  getNearestWalkable(c, r) {
    if (this.isWalkable(c, r)) return { c, r };

    for (let radius = 1; radius <= 5; radius++) {
      for (let dc = -radius; dc <= radius; dc++) {
        for (let dr = -radius; dr <= radius; dr++) {
          if (Math.abs(dc) === radius || Math.abs(dr) === radius) {
            const nc = c + dc;
            const nr = r + dr;
            if (this.isWalkable(nc, nr)) {
              return { c: nc, r: nr };
            }
          }
        }
      }
    }
    return { c: Math.max(0, Math.min(this.cols - 1, c)), r: Math.max(0, Math.min(this.rows - 1, r)) };
  }

  /**
   * Converts world coordinates to grid cell indices.
   * @param {number} x
   * @param {number} y
   * @returns {{c: number, r: number}}
   */
  worldToGrid(x, y) {
    const c = Math.floor(x / this.cellSize);
    const r = Math.floor(y / this.cellSize);
    return {
      c: Math.max(0, Math.min(this.cols - 1, c)),
      r: Math.max(0, Math.min(this.rows - 1, r)),
    };
  }

  /**
   * Converts grid cell indices to center world coordinates.
   * @param {number} c
   * @param {number} r
   * @returns {{x: number, y: number}}
   */
  gridToWorld(c, r) {
    return {
      x: c * this.cellSize + this.cellSize / 2,
      y: r * this.cellSize + this.cellSize / 2,
    };
  }
}

/**
 * Priority queue for efficient A* open set operations.
 */
class MinHeap {
  constructor() {
    this.nodes = [];
  }

  push(item, priority) {
    this.nodes.push({ item, priority });
    this.bubbleUp(this.nodes.length - 1);
  }

  pop() {
    const top = this.nodes[0];
    const bottom = this.nodes.pop();
    if (this.nodes.length > 0) {
      this.nodes[0] = bottom;
      this.sinkDown(0);
    }
    return top ? top.item : null;
  }

  size() {
    return this.nodes.length;
  }

  bubbleUp(index) {
    const node = this.nodes[index];
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      const parent = this.nodes[parentIndex];
      if (node.priority >= parent.priority) break;
      this.nodes[index] = parent;
      this.nodes[parentIndex] = node;
      index = parentIndex;
    }
  }

  sinkDown(index) {
    const length = this.nodes.length;
    const node = this.nodes[index];
    while (true) {
      let left = index * 2 + 1;
      let right = index * 2 + 2;
      let swap = null;

      if (left < length && this.nodes[left].priority < node.priority) {
        swap = left;
      }
      if (
        right < length &&
        ((swap === null && this.nodes[right].priority < node.priority) ||
          (swap !== null && this.nodes[right].priority < this.nodes[left].priority))
      ) {
        swap = right;
      }
      if (swap === null) break;
      this.nodes[index] = this.nodes[swap];
      this.nodes[swap] = node;
      index = swap;
    }
  }
}

/**
 * Calculates shortest path between start and target positions using A* algorithm.
 * Applies path smoothing to produce clean, natural paths around maze corners.
 * @param {PathfindingGrid} grid
 * @param {{x: number, y: number}} startPos
 * @param {{x: number, y: number}} targetPos
 * @param {Array<{x: number, y: number, width: number, height: number}>} [walls]
 * @returns {Array<{x: number, y: number}>} Array of world coordinate waypoints
 */
export function findPath(grid, startPos, targetPos, walls = [], dynamicObstacles = []) {
  if (!grid) return [];

  const hasDynamic = Array.isArray(dynamicObstacles) && dynamicObstacles.length > 0;
  const allObstacles = hasDynamic ? [...walls, ...dynamicObstacles] : walls;

  function isCellBlocked(c, r) {
    if (!grid.isWalkable(c, r)) return true;
    if (hasDynamic) {
      const cx = c * grid.cellSize + grid.cellSize / 2;
      const cy = r * grid.cellSize + grid.cellSize / 2;
      const half = 11;
      const cellBox = { x: cx - half, y: cy - half, width: half * 2, height: half * 2 };
      for (const obs of dynamicObstacles) {
        if (checkCollision(cellBox, obs)) return true;
      }
    }
    return false;
  }

  // Convert to grid coordinates and snap to walkable cells
  const rawStart = grid.worldToGrid(startPos.x, startPos.y);
  const rawTarget = grid.worldToGrid(targetPos.x, targetPos.y);

  const start = grid.getNearestWalkable(rawStart.c, rawStart.r);
  const target = grid.getNearestWalkable(rawTarget.c, rawTarget.r);

  if (start.c === target.c && start.r === target.r) {
    return [{ x: targetPos.x, y: targetPos.y }];
  }

  const cols = grid.cols;
  const rows = grid.rows;
  const totalCells = cols * rows;

  const startIdx = start.r * cols + start.c;
  const targetIdx = target.r * cols + target.c;

  const gScore = new Float32Array(totalCells);
  gScore.fill(Infinity);
  gScore[startIdx] = 0;

  const cameFrom = new Int32Array(totalCells);
  cameFrom.fill(-1);

  const closedSet = new Uint8Array(totalCells);

  const openHeap = new MinHeap();
  openHeap.push(startIdx, 0);

  // Octile distance heuristic
  function heuristic(c, r) {
    const dc = Math.abs(c - target.c);
    const dr = Math.abs(r - target.r);
    return Math.max(dc, dr) + 0.414 * Math.min(dc, dr);
  }

  // 8-directional neighbor offsets (orthogonal + diagonal)
  const neighbors = [
    { dc: 1, dr: 0, cost: 1.0 },
    { dc: -1, dr: 0, cost: 1.0 },
    { dc: 0, dr: 1, cost: 1.0 },
    { dc: 0, dr: -1, cost: 1.0 },
    { dc: 1, dr: 1, cost: 1.414, check: [{ dc: 1, dr: 0 }, { dc: 0, dr: 1 }] },
    { dc: -1, dr: 1, cost: 1.414, check: [{ dc: -1, dr: 0 }, { dc: 0, dr: 1 }] },
    { dc: 1, dr: -1, cost: 1.414, check: [{ dc: 1, dr: 0 }, { dc: 0, dr: -1 }] },
    { dc: -1, dr: -1, cost: 1.414, check: [{ dc: -1, dr: 0 }, { dc: 0, dr: -1 }] },
  ];

  let found = false;
  let iterations = 0;
  const maxIterations = 1500; // safety ceiling

  while (openHeap.size() > 0 && iterations++ < maxIterations) {
    const currentIdx = openHeap.pop();

    if (currentIdx === targetIdx) {
      found = true;
      break;
    }

    if (closedSet[currentIdx]) continue;
    closedSet[currentIdx] = 1;

    const curC = currentIdx % cols;
    const curR = Math.floor(currentIdx / cols);
    const currentG = gScore[currentIdx];

    for (const nb of neighbors) {
      const nc = curC + nb.dc;
      const nr = curR + nb.dr;

      if (isCellBlocked(nc, nr)) continue;

      // Prevent cutting through corners diagonally if adjacent orthogonal cells are blocked
      if (nb.check) {
        if (isCellBlocked(curC + nb.check[0].dc, curR + nb.check[0].dr)) continue;
        if (isCellBlocked(curC + nb.check[1].dc, curR + nb.check[1].dr)) continue;
      }

      const neighborIdx = nr * cols + nc;
      if (closedSet[neighborIdx]) continue;

      const tentativeG = currentG + nb.cost;
      if (tentativeG < gScore[neighborIdx]) {
        cameFrom[neighborIdx] = currentIdx;
        gScore[neighborIdx] = tentativeG;
        const fScore = tentativeG + heuristic(nc, nr);
        openHeap.push(neighborIdx, fScore);
      }
    }
  }

  if (!found) {
    // If exact target unreachable, return direct target pos as fallback
    return [{ x: targetPos.x, y: targetPos.y }];
  }

  // Reconstruct path backward
  const path = [];
  let curr = targetIdx;
  while (curr !== -1 && curr !== startIdx) {
    const c = curr % cols;
    const r = Math.floor(curr / cols);
    path.push(grid.gridToWorld(c, r));
    curr = cameFrom[curr];
  }

  path.reverse();

  // Anchor final waypoint precisely at target position
  if (path.length > 0) {
    path[path.length - 1] = { x: targetPos.x, y: targetPos.y };
  } else {
    path.push({ x: targetPos.x, y: targetPos.y });
  }

  // Apply line-of-sight path smoothing with all static and dynamic obstacles
  return smoothPath(startPos, path, allObstacles);
}

/**
 * Path smoothing: eliminates redundant zigzags by raycasting ahead to bypass intermediate nodes.
 * @param {{x: number, y: number}} startPos
 * @param {Array<{x: number, y: number}>} path
 * @param {Array<{x: number, y: number, width: number, height: number}>} walls
 * @returns {Array<{x: number, y: number}>}
 */
export function smoothPath(startPos, path, walls = []) {
  if (!path || path.length <= 1 || !walls.length) return path;

  const smoothed = [];
  let currentPos = startPos;
  let index = 0;

  while (index < path.length) {
    // Look ahead from the end of the path backwards
    let furthest = index;
    for (let j = path.length - 1; j > index; j--) {
      if (hasClearPath(currentPos.x, currentPos.y, path[j].x, path[j].y, walls, 10)) {
        furthest = j;
        break;
      }
    }

    smoothed.push(path[furthest]);
    currentPos = path[furthest];
    index = furthest + 1;
  }

  return smoothed.length > 0 ? smoothed : path;
}

// Cached grid map singleton per walls reference
let cachedGrid = null;
let cachedWallsRef = null;

/**
 * Returns a cached PathfindingGrid instance for the active level walls.
 * @param {Array<{x: number, y: number, width: number, height: number}>} walls
 * @param {number} [width=800]
 * @param {number} [height=500]
 * @returns {PathfindingGrid}
 */
export function getGrid(walls = [], width = 800, height = 500) {
  if (!cachedGrid || cachedWallsRef !== walls) {
    cachedWallsRef = walls;
    cachedGrid = new PathfindingGrid(walls, width, height, 20);
  }
  return cachedGrid;
}
