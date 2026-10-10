// Level data and environment obstacles for Cyber Escape.
// Implements Level 1: "SYSTEM ENTRY" with reusable structure, wall collision data, and reserved metadata.

/**
 * Level 1 configuration: "SYSTEM ENTRY"
 */
export const LEVEL_1 = {
  id: 1,
  name: "SYSTEM ENTRY",
  difficulty: "Easy",
  description: "Initial breach zone. Navigate through primary firewall gates to locate the extraction vector.",
  // Player spawn coordinates in lower-left sector with generous clearance
  playerStart: {
    x: 60,
    y: 410,
    direction: "right",
  },
  // Playable Level 1 maze walls
  walls: [
    // 1. Lower-left start chamber roof (leaves bottom corridor and east passage open)
    { id: "w1", x: 0, y: 340, width: 170, height: 18, label: "FIREWALL_SUB_01" },

    // 2. Key chamber east partition (leaves passage below at y: 160-230)
    { id: "w2", x: 160, y: 0, width: 18, height: 160, label: "KEY_GATE_L" },

    // 3. Key chamber south partition (leaves channel to the east)
    { id: "w3", x: 40, y: 230, width: 180, height: 18, label: "KEY_GATE_B" },

    // 4. Lower-center vertical spine (anchors bottom to form central navigation lane)
    { id: "w4", x: 270, y: 340, width: 18, height: 160, label: "CORE_PARTITION_S" },

    // 5. Central horizontal barrier
    { id: "w5", x: 280, y: 240, width: 180, height: 18, label: "DATA_SPINE_H" },

    // 6. Central vertical stem (forms T-barrier with w5, leaves north thoroughfare open)
    { id: "w6", x: 360, y: 110, width: 18, height: 130, label: "DATA_SPINE_V" },

    // 7. East central vertical barrier
    { id: "w7", x: 560, y: 150, width: 18, height: 170, label: "BARRIER_CORE_E" },

    // 8. South-east horizontal firewall
    { id: "w8", x: 470, y: 380, width: 230, height: 18, label: "DEFENSE_GRID_S" },

    // 9. North-east horizontal divider
    { id: "w9", x: 480, y: 90, width: 160, height: 18, label: "ROUTE_FILTER_N" },

    // 10. Exit sanctuary western wall (leaves entryway at y: 160-250)
    { id: "w10", x: 670, y: 0, width: 18, height: 160, label: "EXIT_SANCTUARY_W" },

    // 11. South-east tactical dead-end stop
    { id: "w11", x: 740, y: 260, width: 60, height: 18, label: "DEAD_END_TERMINAL" },
  ],
  // Collectibles configuration for Level 1 (3.5-inch Floppy Disk collectibles)
  collectibles: [
    { id: "chip-1", type: "data", x: 220, y: 430, width: 20, height: 20, points: 10, label: "DATA_FLOPPY_01" },
    { id: "chip-2", type: "data", x: 80, y: 280, width: 20, height: 20, points: 10, label: "DATA_FLOPPY_02" },
    { id: "chip-3", type: "data", x: 390, y: 300, width: 20, height: 20, points: 10, label: "DATA_FLOPPY_03" },
    { id: "chip-4", type: "data", x: 420, y: 48, width: 20, height: 20, points: 10, label: "DATA_FLOPPY_04" },
    { id: "chip-5", type: "data", x: 610, y: 440, width: 20, height: 20, points: 10, label: "DATA_FLOPPY_05" },
  ],
  keyPosition: {
    x: 70,
    y: 70,
    width: 20,
    height: 20,
    label: "SECURITY_KEY",
  },
  exitPosition: {
    x: 730,
    y: 60,
    width: 36,
    height: 36,
    label: "EXTRACTION_GATEWAY",
  },
  // Level 1 Patrol Waypoints
  patrolPoints: [
    { x: 500, y: 220 },
    { x: 620, y: 220 },
    { x: 500, y: 50 },
    { x: 500, y: 330 },
  ],
  // Enemy configuration for Level 1 (Omniscient A* Hunting Virus Bot)
  enemies: [
    {
      id: "virus-1",
      type: "virus",
      x: 500,
      y: 220,
      width: 26,
      height: 26,
      speed: 60, // 60 px/s for Level 1 (player is 220 px/s)
      predictionTime: 0.35, // 0.3 - 0.5s interception prediction
      repathInterval: 0.28, // 250 - 300ms A* throttling
      label: "VIRUS_BOT_01",
    },
  ],
  movingFirewalls: [],
  timer: 60,
};

/**
 * Level 2 configuration: "FIREWALL ZONE"
 * Highly protected network sector with complex maze corridors,
 * dual omniscient hunting viruses, and dynamic moving firewall barriers.
 */
export const LEVEL_2 = {
  id: 2,
  name: "FIREWALL ZONE",
  difficulty: "Medium",
  description: "Heavily defended network sector with active moving firewall barriers and dual hunting viruses.",
  timer: 55,
  // Player spawn coordinates in open top-left chamber
  playerStart: {
    x: 60,
    y: 60,
    direction: "right",
  },
  // Playable Level 2 maze walls (17 walls creating complex junctions and dead ends)
  walls: [
    // 1. Partitions spawn corridor (leaves opening below at y: 120-180)
    { id: "w1", x: 120, y: 0, width: 18, height: 120, label: "FW_GATE_N1" },

    // 2. Under spawn area (leaves west vertical lane open at x: 140-200)
    { id: "w2", x: 0, y: 180, width: 140, height: 18, label: "FW_BARRIER_W1" },

    // 3. Separates west corridor from central spine
    { id: "w3", x: 120, y: 240, width: 18, height: 160, label: "FW_DIVIDER_W2" },

    // 4. Forms dead-end tactical pocket in lower-left
    { id: "w4", x: 40, y: 360, width: 80, height: 18, label: "FW_DEAD_END_SW" },

    // 5. Upper-left horizontal lane
    { id: "w5", x: 200, y: 100, width: 160, height: 18, label: "FW_LANE_NW" },

    // 6. Mid-left vertical partition
    { id: "w6", x: 200, y: 200, width: 18, height: 180, label: "FW_SPINE_W" },

    // 7. Central lower divider
    { id: "w7", x: 280, y: 280, width: 140, height: 18, label: "FW_MID_BARRIER" },

    // 8. Upper central spine
    { id: "w8", x: 340, y: 0, width: 18, height: 150, label: "FW_NORTH_SPINE" },

    // 9. North corridor partition
    { id: "w9", x: 420, y: 80, width: 160, height: 18, label: "FW_NORTH_LANE" },

    // 10. Central core vertical divider
    { id: "w10", x: 420, y: 160, width: 18, height: 160, label: "FW_CENTRAL_CORE" },

    // 11. South thoroughfare firewall
    { id: "w11", x: 280, y: 420, width: 220, height: 18, label: "FW_SOUTH_SPINE" },

    // 12. Security key chamber west partition
    { id: "w12", x: 580, y: 0, width: 18, height: 160, label: "FW_KEY_GATE_E" },

    // 13. East-central divider
    { id: "w13", x: 500, y: 240, width: 180, height: 18, label: "FW_EAST_DIVIDER" },

    // 14. Dead-end barrier near key chamber
    { id: "w14", x: 640, y: 120, width: 18, height: 120, label: "FW_DEAD_END_NE" },

    // 15. Guards exit approach
    { id: "w15", x: 560, y: 320, width: 18, height: 140, label: "FW_GATE_SE" },

    // 16. Exit sanctuary northern ceiling
    { id: "w16", x: 640, y: 380, width: 160, height: 18, label: "FW_EXIT_SANCTUARY" },

    // 17. East corridor dead-end barrier
    { id: "w17", x: 700, y: 240, width: 100, height: 18, label: "FW_DEAD_END_E" },
  ],
  // Collectibles configuration for Level 2 (7 Data Floppy Disks)
  collectibles: [
    { id: "chip-1", type: "data", x: 200, y: 55, width: 20, height: 20, points: 10, label: "DATA_FLOPPY_01" },
    { id: "chip-2", type: "data", x: 60, y: 260, width: 20, height: 20, points: 10, label: "DATA_FLOPPY_02" },
    { id: "chip-3", type: "data", x: 60, y: 440, width: 20, height: 20, points: 10, label: "DATA_FLOPPY_03" },
    { id: "chip-4", type: "data", x: 360, y: 230, width: 20, height: 20, points: 10, label: "DATA_FLOPPY_04" },
    { id: "chip-5", type: "data", x: 730, y: 60, width: 20, height: 20, points: 10, label: "DATA_FLOPPY_05" },
    { id: "chip-6", type: "data", x: 440, y: 360, width: 20, height: 20, points: 10, label: "DATA_FLOPPY_06" },
    { id: "chip-7", type: "data", x: 640, y: 300, width: 20, height: 20, points: 10, label: "DATA_FLOPPY_07" },
  ],
  keyPosition: {
    x: 520,
    y: 40,
    width: 20,
    height: 20,
    label: "SECURITY_KEY",
  },
  exitPosition: {
    x: 730,
    y: 430,
    width: 36,
    height: 36,
    label: "EXTRACTION_GATEWAY",
  },
  // Enemy configuration for Level 2 (Exactly 1 Omniscient Hunting Virus Bot at speed 70)
  enemies: [
    {
      id: "virus-1",
      type: "virus",
      x: 580,
      y: 200,
      width: 26,
      height: 26,
      speed: 70, // Level 2 speed: 70 px/s
      predictionTime: 0.35,
      repathInterval: 0.25,
      label: "VIRUS_BOT_01",
    },
  ],
  // Dynamic moving firewall barriers (Exactly 2 Moving Firewalls)
  movingFirewalls: [
    {
      id: "fw-1",
      startX: 240,
      endX: 440,
      startY: 150,
      endY: 150,
      width: 44,
      height: 18,
      speed: 65,
      axis: "x",
      direction: 1,
      label: "FIREWALL_BARRIER_ALPHA",
    },
    {
      id: "fw-3",
      startX: 100,
      endX: 240,
      startY: 320,
      endY: 320,
      width: 44,
      height: 18,
      speed: 55,
      axis: "x",
      direction: 1,
      label: "FIREWALL_BARRIER_GAMMA",
    },
  ],
};

/**
 * Level 3 configuration: "CYBER STORM"
 * High security defense network with intricate maze corridors,
 * dual intelligent hunting virus bots, and dual dynamic moving firewalls.
 */
export const LEVEL_3 = {
  id: 3,
  name: "CYBER STORM",
  difficulty: "Hard",
  description: "Core defense grid under severe electronic disturbance. Navigate intricate security corridors, evade dual hunting viruses, and slip past active firewalls.",
  timer: 50,
  // Player spawn coordinates in protected west chamber
  playerStart: {
    x: 60,
    y: 240,
    direction: "right",
  },
  // Playable Level 3 maze walls (18 walls creating complex turns, junctions, and dead ends)
  walls: [
    { id: "w1", x: 0, y: 160, width: 140, height: 18, label: "STORM_GATE_W1" },
    { id: "w2", x: 0, y: 320, width: 140, height: 18, label: "STORM_GATE_W2" },
    { id: "w3", x: 200, y: 60, width: 18, height: 150, label: "STORM_SPINE_NW" },
    { id: "w4", x: 200, y: 280, width: 18, height: 160, label: "STORM_SPINE_SW" },
    { id: "w5", x: 200, y: 60, width: 110, height: 18, label: "STORM_LANE_N" },
    { id: "w6", x: 200, y: 422, width: 110, height: 18, label: "STORM_LANE_S" },
    { id: "w7", x: 280, y: 140, width: 18, height: 210, label: "STORM_DIVIDER_W" },
    { id: "w8", x: 360, y: 0, width: 18, height: 120, label: "STORM_CORE_N" },
    { id: "w9", x: 360, y: 180, width: 120, height: 18, label: "STORM_CORE_ROOF" },
    { id: "w10", x: 360, y: 290, width: 120, height: 18, label: "STORM_CORE_FLOOR" },
    { id: "w11", x: 360, y: 370, width: 18, height: 130, label: "STORM_CORE_S" },
    { id: "w12", x: 440, y: 70, width: 140, height: 18, label: "STORM_LANE_NE" },
    { id: "w13", x: 540, y: 150, width: 18, height: 160, label: "STORM_PILLAR_E" },
    { id: "w14", x: 440, y: 400, width: 140, height: 18, label: "STORM_LANE_SE" },
    { id: "w15", x: 640, y: 0, width: 18, height: 150, label: "STORM_SANCTUARY_N" },
    { id: "w16", x: 610, y: 230, width: 120, height: 18, label: "STORM_DIVIDER_E" },
    { id: "w17", x: 650, y: 320, width: 18, height: 180, label: "STORM_SANCTUARY_S" },
    { id: "w18", x: 720, y: 130, width: 80, height: 18, label: "STORM_NOOK_NE" },
  ],
  // Collectibles configuration for Level 3 (Exactly 8 Data Floppy Disks)
  collectibles: [
    { id: "chip-1", type: "data", x: 70, y: 70, width: 20, height: 20, points: 10, label: "DATA_FLOPPY_01" },
    { id: "chip-2", type: "data", x: 70, y: 420, width: 20, height: 20, points: 10, label: "DATA_FLOPPY_02" },
    { id: "chip-3", type: "data", x: 240, y: 240, width: 20, height: 20, points: 10, label: "DATA_FLOPPY_03" },
    { id: "chip-4", type: "data", x: 300, y: 30, width: 20, height: 20, points: 10, label: "DATA_FLOPPY_04" },
    { id: "chip-5", type: "data", x: 420, y: 240, width: 20, height: 20, points: 10, label: "DATA_FLOPPY_05" },
    { id: "chip-6", type: "data", x: 300, y: 460, width: 20, height: 20, points: 10, label: "DATA_FLOPPY_06" },
    { id: "chip-7", type: "data", x: 580, y: 200, width: 20, height: 20, points: 10, label: "DATA_FLOPPY_07" },
    { id: "chip-8", type: "data", x: 580, y: 450, width: 20, height: 20, points: 10, label: "DATA_FLOPPY_08" },
  ],
  keyPosition: {
    x: 730,
    y: 60,
    width: 20,
    height: 20,
    label: "SECURITY_KEY",
  },
  exitPosition: {
    x: 720,
    y: 420,
    width: 36,
    height: 36,
    label: "EXTRACTION_GATEWAY",
  },
  // Enemy configuration for Level 3 (Exactly 2 Omniscient Hunting Virus Bots)
  enemies: [
    {
      id: "virus-1",
      type: "virus",
      x: 520,
      y: 40,
      width: 26,
      height: 26,
      speed: 60, // Virus 1 speed: 60 px/s
      predictionTime: 0.35,
      repathInterval: 0.25,
      label: "VIRUS_BOT_01",
    },
    {
      id: "virus-2",
      type: "virus",
      x: 420,
      y: 340,
      width: 26,
      height: 26,
      speed: 55, // Virus 2 speed: 55 px/s
      predictionTime: 0.35,
      repathInterval: 0.25,
      label: "VIRUS_BOT_02",
    },
  ],
  // Dynamic moving firewall barriers (Exactly 2 Moving Firewalls: 1 horizontal, 1 vertical)
  movingFirewalls: [
    {
      id: "fw-1",
      startX: 380,
      endX: 520,
      startY: 130,
      endY: 130,
      width: 44,
      height: 18,
      speed: 55,
      axis: "x",
      direction: 1,
      label: "FIREWALL_BARRIER_ALPHA",
    },
    {
      id: "fw-2",
      startX: 490,
      endX: 490,
      startY: 220,
      endY: 340,
      width: 18,
      height: 44,
      speed: 50,
      axis: "y",
      direction: 1,
      label: "FIREWALL_BARRIER_BETA",
    },
  ],
};

// Reusable level registry
const LEVELS = {
  1: LEVEL_1,
  2: LEVEL_2,
  3: LEVEL_3,
};

let currentLevelId = 1;

/**
 * Sets active level ID.
 * @param {number} levelId
 */
export function setCurrentLevel(levelId) {
  if (LEVELS[levelId]) {
    currentLevelId = levelId;
  }
}

/**
 * Returns active level ID.
 * @returns {number}
 */
export function getCurrentLevelId() {
  return currentLevelId;
}

/**
 * Retrieves level data by level number.
 * @param {number} [levelId=1]
 * @returns {typeof LEVEL_1}
 */
export function getLevel(levelId = 1) {
  return LEVELS[levelId] || LEVEL_1;
}

/**
 * Returns the currently active level data.
 * @returns {typeof LEVEL_1}
 */
export function getCurrentLevel() {
  return getLevel(currentLevelId);
}

/**
 * Returns fresh clones of active collectibles for the specified level.
 * @param {number} [levelId=currentLevelId]
 * @returns {Array<{id: string, type: string, x: number, y: number, width: number, height: number, points: number, label?: string}>}
 */
export function getLevelCollectibles(levelId = currentLevelId) {
  return getLevel(levelId).collectibles.map((item) => ({ ...item }));
}

/**
 * Returns fresh clones of active enemies for the specified level.
 * @param {number} [levelId=currentLevelId]
 * @returns {Array<{id: string, type: string, x: number, y: number, width: number, height: number, speed: number, label?: string}>}
 */
export function getLevelEnemies(levelId = currentLevelId) {
  return (getLevel(levelId).enemies || []).map((item) => ({ ...item }));
}

/**
 * Returns fresh clones of active moving firewall barriers for the specified level.
 * @param {number} [levelId=currentLevelId]
 * @returns {Array<{id: string, startX: number, endX: number, startY: number, endY: number, width: number, height: number, speed: number, axis: string, direction: number, label?: string}>}
 */
export function getLevelFirewalls(levelId = currentLevelId) {
  return (getLevel(levelId).movingFirewalls || []).map((fw) => ({ ...fw }));
}

/**
 * Returns patrol route waypoints for the specified level.
 * @param {number} [levelId=currentLevelId]
 * @returns {Array<{x: number, y: number}>}
 */
export function getLevelPatrolPoints(levelId = currentLevelId) {
  return (getLevel(levelId).patrolPoints || []).map((pt) => ({ ...pt }));
}

/**
 * Returns the walls for the active level.
 * @param {number} [levelId]
 * @returns {Array<{id: string, x: number, y: number, width: number, height: number, label?: string}>}
 */
export function getLevelWalls(levelId = currentLevelId) {
  return getLevel(levelId).walls;
}

/**
 * Backwards-compatibility alias for test and game modules.
 */
export const getTestWalls = getLevelWalls;

/**
 * Renders level walls with cyber-security dark surfaces, thin neon cyan borders,
 * subtle cyan glow, and high-tech digital panel markings.
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array<{x: number, y: number, width: number, height: number, label?: string}>} [walls]
 */
export function drawWalls(ctx, walls = getLevelWalls()) {
  for (const wall of walls) {
    ctx.save();

    // 1. Subtle cyan glow & sharp cyber border
    ctx.shadowColor = "#52f5df";
    ctx.shadowBlur = 6;
    ctx.strokeStyle = "#52f5df";
    ctx.lineWidth = 1.6;

    // 2. Dark cyber-security surface fill
    ctx.fillStyle = "#0c1822";
    ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
    ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);

    // 3. High-tech interior details
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(82, 245, 223, 0.22)";
    ctx.lineWidth = 1;

    if (wall.width >= wall.height) {
      // Horizontal wall: periodic vertical division markings
      ctx.beginPath();
      for (let sx = wall.x + 16; sx < wall.x + wall.width - 6; sx += 24) {
        ctx.moveTo(sx, wall.y + 2);
        ctx.lineTo(sx, wall.y + wall.height - 2);
      }
      ctx.stroke();
    } else {
      // Vertical wall: periodic horizontal division markings
      ctx.beginPath();
      for (let sy = wall.y + 16; sy < wall.y + wall.height - 6; sy += 24) {
        ctx.moveTo(wall.x + 2, sy);
        ctx.lineTo(wall.x + wall.width - 2, sy);
      }
      ctx.stroke();
    }

    // 4. Subtle corner tech accent brackets
    ctx.strokeStyle = "rgba(82, 245, 223, 0.75)";
    ctx.lineWidth = 1.8;
    const bracket = Math.min(5, Math.min(wall.width, wall.height) / 2);

    // Top-left bracket
    ctx.beginPath();
    ctx.moveTo(wall.x, wall.y + bracket);
    ctx.lineTo(wall.x, wall.y);
    ctx.lineTo(wall.x + bracket, wall.y);
    ctx.stroke();

    // Bottom-right bracket
    ctx.beginPath();
    ctx.moveTo(wall.x + wall.width - bracket, wall.y + wall.height);
    ctx.lineTo(wall.x + wall.width, wall.y + wall.height);
    ctx.lineTo(wall.x + wall.width, wall.y + wall.height - bracket);
    ctx.stroke();

    ctx.restore();
  }
}

/**
 * Renders active data chips as classic 3.5-inch retro floppy disk icons:
 * - Purple/blue square floppy disk body with top-right beveled chamfer
 * - Top sliding silver metal shutter with dark read/write window slot
 * - White/light label section with bright red/pink horizontal detail stripe
 * - Subtle floating & gentle pulse animation (non-rotating for clear readability)
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array<{x: number, y: number, width: number, height: number}>} collectibles
 * @param {number} [time=0] Time in seconds for animation
 */
export function drawDataChips(ctx, collectibles, time = 0) {
  if (!Array.isArray(collectibles) || collectibles.length === 0) return;

  const halfW = 10;
  const halfH = 10;

  for (const chip of collectibles) {
    const cx = chip.x + chip.width / 2;
    // Subtle gentle floating movement (no rotation)
    const floatY = Math.sin(time * 2.5 + chip.x * 0.08) * 1.5;
    const cy = chip.y + chip.height / 2 + floatY;

    // Very subtle scale pulse
    const pulse = 1 + 0.03 * Math.sin(time * 3 + chip.y * 0.08);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(pulse, pulse);

    // 1. Soft atmospheric neon glow around the floppy disk
    ctx.shadowColor = "rgba(82, 245, 223, 0.7)";
    ctx.shadowBlur = 8;

    // 2. Floppy disk body silhouette (classic 3.5" with top-right 45° chamfer corner)
    ctx.beginPath();
    ctx.moveTo(-halfW, -halfH);       // Top-left
    ctx.lineTo(halfW - 3, -halfH);     // Top edge before chamfer
    ctx.lineTo(halfW, -halfH + 3);     // Chamfered top-right corner
    ctx.lineTo(halfW, halfH);          // Bottom-right
    ctx.lineTo(-halfW, halfH);         // Bottom-left
    ctx.closePath();

    // Main purple/blue body
    ctx.fillStyle = "#5542cc";
    ctx.fill();

    // Subtle dark purple bevel shadow along bottom and right edges
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#2e1e78";
    ctx.beginPath();
    ctx.moveTo(-halfW, halfH - 2);
    ctx.lineTo(halfW, halfH - 2);
    ctx.lineTo(halfW, halfH);
    ctx.lineTo(-halfW, halfH);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(halfW - 2, -halfH + 3);
    ctx.lineTo(halfW, -halfH + 3);
    ctx.lineTo(halfW, halfH);
    ctx.lineTo(halfW - 2, halfH);
    ctx.closePath();
    ctx.fill();

    // Outer dark outline
    ctx.strokeStyle = "#1b114d";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // 3. Sliding Silver Metal Shutter (top-center/left)
    ctx.fillStyle = "#cfd8dc";
    ctx.fillRect(-6, -halfH, 11, 7);
    ctx.strokeStyle = "#90a4ae";
    ctx.lineWidth = 0.8;
    ctx.strokeRect(-6, -halfH, 11, 7);

    // Dark head-access window cutout in shutter
    ctx.fillStyle = "#1e2230";
    ctx.fillRect(-3, -halfH + 1, 3, 5);

    // 4. White / Light Label Section (lower half of disk)
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(-8, -1, 16, 9);
    ctx.strokeStyle = "#dcdde1";
    ctx.lineWidth = 0.6;
    ctx.strokeRect(-8, -1, 16, 9);

    // 5. Red/Pink Horizontal Detail Stripe across the label
    ctx.fillStyle = "#ff4757";
    ctx.fillRect(-7, 0, 14, 2);

    // Subtle faint pencil label lines
    ctx.fillStyle = "#cbd5e1";
    ctx.fillRect(-7, 3.5, 11, 1);
    ctx.fillRect(-7, 5.5, 8, 1);

    // 6. Classic Write-Protect Notch (bottom-right square indent)
    ctx.fillStyle = "#070c14"; // matches background
    ctx.fillRect(halfW - 3, halfH - 3, 2, 2);

    ctx.restore();
  }
}

/**
 * Returns fresh clone of the security key configuration for the specified level.
 * @param {number} [levelId=currentLevelId]
 * @returns {{x: number, y: number, width: number, height: number, label?: string}}
 */
export function getKeyPosition(levelId = currentLevelId) {
  return { ...getLevel(levelId).keyPosition };
}

/**
 * Returns fresh clone of the exit portal configuration for the specified level.
 * @param {number} [levelId=currentLevelId]
 * @returns {{x: number, y: number, width: number, height: number, label?: string}}
 */
export function getExitPosition(levelId = currentLevelId) {
  return { ...getLevel(levelId).exitPosition };
}

/**
 * Renders the futuristic Security Key with a recognizable key silhouette,
 * cyan/white glowing aesthetics, hollow hexagonal loop head, shaft, and teeth.
 * @param {CanvasRenderingContext2D} ctx
 * @param {{x: number, y: number, width: number, height: number}} key
 * @param {number} [time=0] Time in seconds for floating animation
 */
export function drawSecurityKey(ctx, key, time = 0) {
  if (!key) return;

  const cx = key.x + key.width / 2;
  const floatY = Math.sin(time * 3) * 2;
  const cy = key.y + key.height / 2 + floatY;
  const pulse = 1 + 0.04 * Math.sin(time * 4);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(pulse, pulse);

  // Soft atmospheric cyan key aura
  ctx.shadowColor = "#52f5df";
  ctx.shadowBlur = 10;

  // Key orientation angle (-35 deg classic key icon stance)
  ctx.save();
  ctx.rotate(-Math.PI * 0.22);

  // 1. Key Head / Bow (Hexagonal futuristic loop with hollow core)
  const headR = 7;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    const hx = -6 + Math.cos(angle) * headR;
    const hy = Math.sin(angle) * headR;
    if (i === 0) ctx.moveTo(hx, hy);
    else ctx.lineTo(hx, hy);
  }
  ctx.closePath();
  ctx.fillStyle = "#091c24";
  ctx.fill();
  ctx.strokeStyle = "#52f5df";
  ctx.lineWidth = 2.2;
  ctx.stroke();

  // Hollow inner eye of key head
  ctx.beginPath();
  ctx.arc(-6, 0, 2.8, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.strokeStyle = "#52f5df";
  ctx.lineWidth = 1;
  ctx.stroke();

  // 2. Key Stem / Shaft
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#52f5df";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(0.5, -2);
  ctx.lineTo(13, -2);
  ctx.lineTo(13, 2);
  ctx.lineTo(0.5, 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 3. Key Bit / Teeth (two distinct cuts facing downwards)
  ctx.beginPath();
  // First tooth (longer)
  ctx.moveTo(8, 2);
  ctx.lineTo(8, 6.5);
  ctx.lineTo(10.5, 6.5);
  ctx.lineTo(10.5, 2);
  // Second tooth (near tip)
  ctx.moveTo(11.5, 2);
  ctx.lineTo(11.5, 5);
  ctx.lineTo(13, 5);
  ctx.lineTo(13, 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.strokeStyle = "#52f5df";
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // 4. Subtle core highlight circuit line on stem
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#52f5df";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(2, 0);
  ctx.lineTo(11, 0);
  ctx.stroke();

  ctx.restore();

  // 5. Tiny orbiting digital sparkle bit
  const sparkleAngle = time * 2.8;
  const sx = Math.cos(sparkleAngle) * 14;
  const sy = Math.sin(sparkleAngle) * 14;
  ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
  ctx.shadowColor = "#52f5df";
  ctx.shadowBlur = 5;
  ctx.fillRect(sx - 1, sy - 1, 2, 2);

  ctx.restore();
}

/**
 * Renders the Exit Portal in either LOCKED or UNLOCKED visual states.
 * - LOCKED: Crimson hazard barrier, closed grill, red padlock (🔒), and "LOCKED" indicator.
 * - UNLOCKED: Glowing cyan swirl vortex, open gateway (🔓), bright neon aura, and "EXIT OPEN" indicator.
 * @param {CanvasRenderingContext2D} ctx
 * @param {{x: number, y: number, width: number, height: number}} exit
 * @param {boolean} isUnlocked
 * @param {number} [time=0] Time in seconds for vortex animation
 */
export function drawExitPortal(ctx, exit, isUnlocked, time = 0) {
  if (!exit) return;

  const cx = exit.x + exit.width / 2;
  const cy = exit.y + exit.height / 2;
  const w = exit.width;
  const h = exit.height;

  ctx.save();
  ctx.translate(cx, cy);

  if (!isUnlocked) {
    // ==========================================
    // STATE A: LOCKED (Before Key is collected)
    // ==========================================
    ctx.shadowColor = "#ff4757";
    ctx.shadowBlur = 8;

    // Dark crimson chamber background
    ctx.fillStyle = "#150910";
    ctx.fillRect(-w / 2, -h / 2, w, h);

    // Hazard warning border
    ctx.strokeStyle = "#ff4757";
    ctx.lineWidth = 2;
    ctx.strokeRect(-w / 2, -h / 2, w, h);

    // Corner hazard brackets
    ctx.fillStyle = "#ff4757";
    ctx.fillRect(-w / 2, -h / 2, 4, 4);
    ctx.fillRect(w / 2 - 4, -h / 2, 4, 4);
    ctx.fillRect(-w / 2, h / 2 - 4, 4, 4);
    ctx.fillRect(w / 2 - 4, h / 2 - 4, 4, 4);

    // Laser barrier security grill (clipped inside doorway)
    ctx.save();
    ctx.beginPath();
    ctx.rect(-w / 2 + 2, -h / 2 + 2, w - 4, h - 4);
    ctx.clip();

    ctx.strokeStyle = "rgba(255, 71, 87, 0.35)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = -w; x <= w; x += 8) {
      ctx.moveTo(x, -h / 2);
      ctx.lineTo(x + h, h / 2);
    }
    ctx.stroke();
    ctx.restore();

    // Digital Padlock glyph (closed lock 🔒)
    ctx.shadowBlur = 6;
    ctx.strokeStyle = "#ff6b81";
    ctx.lineWidth = 1.8;

    // Shackle arch
    ctx.beginPath();
    ctx.arc(0, -3.5, 4.5, Math.PI, 0, false);
    ctx.lineTo(4.5, 0);
    ctx.lineTo(-4.5, 0);
    ctx.stroke();

    // Lock body
    ctx.fillStyle = "#ff4757";
    ctx.fillRect(-6, 0, 12, 9);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 0.9;
    ctx.strokeRect(-6, 0, 12, 9);

    // Keyhole cutout
    ctx.fillStyle = "#150910";
    ctx.beginPath();
    ctx.arc(0, 3.5, 1.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-0.7, 3.5, 1.4, 2.5);

    // "LOCKED" badge text below portal
    ctx.shadowBlur = 0;
    ctx.font = "bold 8px 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ff4757";
    ctx.fillText("LOCKED", 0, h / 2 + 10);

  } else {
    // ==========================================
    // STATE B: UNLOCKED (After Key is collected)
    // ==========================================
    const pulse = 1 + 0.05 * Math.sin(time * 6);
    ctx.shadowColor = "#52f5df";
    ctx.shadowBlur = 14;

    // Deep cyan energy chamber base
    ctx.fillStyle = "#04191c";
    ctx.fillRect(-w / 2, -h / 2, w, h);

    // Radiant cyan frame
    ctx.strokeStyle = "#52f5df";
    ctx.lineWidth = 2.2;
    ctx.strokeRect(-w / 2, -h / 2, w, h);

    // Active extraction vortex (clipped within portal)
    ctx.save();
    ctx.beginPath();
    ctx.rect(-w / 2 + 2, -h / 2 + 2, w - 4, h - 4);
    ctx.clip();

    const ringAngle = time * 3.2;

    // Outer rotating energy square
    ctx.save();
    ctx.rotate(ringAngle);
    ctx.strokeStyle = "rgba(82, 245, 223, 0.75)";
    ctx.lineWidth = 1.6;
    ctx.strokeRect(-9, -9, 18, 18);
    ctx.restore();

    // Inner counter-rotating energy square
    ctx.save();
    ctx.rotate(-ringAngle * 1.5);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.lineWidth = 1.3;
    ctx.strokeRect(-5, -5, 10, 10);
    ctx.restore();

    // Central radiant extraction vortex beam
    const coreGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, 13);
    coreGlow.addColorStop(0, "rgba(255, 255, 255, 0.95)");
    coreGlow.addColorStop(0.45, "rgba(82, 245, 223, 0.65)");
    coreGlow.addColorStop(1, "rgba(82, 245, 223, 0)");
    ctx.fillStyle = coreGlow;
    ctx.beginPath();
    ctx.arc(0, 0, 12 * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Unlocked Padlock glyph (open lock 🔓)
    ctx.shadowBlur = 6;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.6;

    // Unlocked shackle (shifted/open arch)
    ctx.beginPath();
    ctx.arc(1.5, -4, 4, Math.PI, 0, false);
    ctx.lineTo(5.5, -2);
    ctx.stroke();

    // Lock body
    ctx.fillStyle = "#52f5df";
    ctx.fillRect(-5, 0, 10, 8);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 0.9;
    ctx.strokeRect(-5, 0, 10, 8);

    // Keyhole
    ctx.fillStyle = "#04191c";
    ctx.beginPath();
    ctx.arc(0, 3.2, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // "EXIT OPEN" badge text below portal
    ctx.shadowBlur = 4;
    ctx.font = "bold 8px 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = "#52f5df";
    ctx.fillText("EXIT OPEN", 0, h / 2 + 10);
  }

  ctx.restore();
}

