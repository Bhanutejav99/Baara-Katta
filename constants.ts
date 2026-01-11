import { Coords, PlayerId } from './types';

export const BOARD_SIZES = {
  SMALL: 5,
  BIG: 7
};

// --- SAFE ZONES ---

const SAFE_ZONES_7: Coords[] = [
  { r: 0, c: 0 }, { r: 0, c: 3 }, { r: 0, c: 6 }, // Top Row
  { r: 1, c: 1 }, { r: 1, c: 5 },                 // Inner Top
  { r: 3, c: 0 }, { r: 3, c: 3 }, { r: 3, c: 6 }, // Middle Row
  { r: 5, c: 1 }, { r: 5, c: 5 },                 // Inner Bottom
  { r: 6, c: 0 }, { r: 6, c: 3 }, { r: 6, c: 6 }, // Bottom Row
];

const SAFE_ZONES_5: Coords[] = [
  { r: 4, c: 2 }, // P1 Start (Bottom)
  { r: 2, c: 4 }, // P2 Start (Right)
  { r: 0, c: 2 }, // P3 Start (Top)
  { r: 2, c: 0 }, // P4 Start (Left)
  { r: 2, c: 2 }, // Center
];

export const getSafeZones = (size: number): Coords[] => size === 5 ? SAFE_ZONES_5 : SAFE_ZONES_7;

// --- PATH GENERATION ---

const rotatePoint = (p: Coords, size: number): Coords => {
  const center = Math.floor(size / 2);
  const r = p.r - center;
  const c = p.c - center;
  // Rotate 90 deg clockwise (r, c) -> (c, -r)
  const newR = c;
  const newC = -r;
  return { r: newR + center, c: newC + center };
};

const generateRotatedPath = (basePath: Coords[], rotations: number, size: number): Coords[] => {
  let path = [...basePath];
  for (let i = 0; i < rotations; i++) {
    path = path.map(p => rotatePoint(p, size));
  }
  return path;
};

// 7x7 Path (P1 Bottom)
const P1_PATH_7: Coords[] = [
  { r: 6, c: 3 }, 
  { r: 6, c: 4 }, { r: 6, c: 5 }, { r: 6, c: 6 }, 
  { r: 5, c: 6 }, { r: 4, c: 6 }, { r: 3, c: 6 }, { r: 2, c: 6 }, { r: 1, c: 6 }, { r: 0, c: 6 },
  { r: 0, c: 5 }, { r: 0, c: 4 }, { r: 0, c: 3 }, { r: 0, c: 2 }, { r: 0, c: 1 }, { r: 0, c: 0 },
  { r: 1, c: 0 }, { r: 2, c: 0 }, { r: 3, c: 0 }, { r: 4, c: 0 }, { r: 5, c: 0 }, { r: 6, c: 0 },
  { r: 6, c: 1 }, { r: 6, c: 2 }, 
  { r: 5, c: 2 }, // Inner Entry
  { r: 5, c: 1 }, { r: 4, c: 1 }, { r: 3, c: 1 }, { r: 2, c: 1 }, { r: 1, c: 1 },
  { r: 1, c: 2 }, { r: 1, c: 3 }, { r: 1, c: 4 }, { r: 1, c: 5 },
  { r: 2, c: 5 }, { r: 3, c: 5 }, { r: 4, c: 5 }, { r: 5, c: 5 },
  { r: 5, c: 4 }, { r: 5, c: 3 },
  { r: 4, c: 3 }, { r: 3, c: 3 } // Goal
];

// 5x5 Path (P1 Bottom)
const P1_PATH_5: Coords[] = [
  // Start
  { r: 4, c: 2 },
  // Outer (Anti-Clockwise)
  { r: 4, c: 3 }, { r: 4, c: 4 }, { r: 3, c: 4 }, { r: 2, c: 4 }, { r: 1, c: 4 }, { r: 0, c: 4 },
  { r: 0, c: 3 }, { r: 0, c: 2 }, { r: 0, c: 1 }, { r: 0, c: 0 }, { r: 1, c: 0 }, { r: 2, c: 0 },
  { r: 3, c: 0 }, { r: 4, c: 0 }, { r: 4, c: 1 },
  // Inner Entry
  { r: 3, c: 1 },
  // Inner (Clockwise)
  { r: 2, c: 1 }, { r: 1, c: 1 }, { r: 1, c: 2 }, { r: 1, c: 3 }, { r: 2, c: 3 }, { r: 3, c: 3 }, { r: 3, c: 2 },
  // Goal
  { r: 2, c: 2 }
];

const PATHS_7: Record<PlayerId, Coords[]> = {
  [PlayerId.P1]: P1_PATH_7,
  [PlayerId.P2]: generateRotatedPath(P1_PATH_7, 3, 7), // Right (270 deg)
  [PlayerId.P3]: generateRotatedPath(P1_PATH_7, 2, 7), // Top (180 deg)
  [PlayerId.P4]: generateRotatedPath(P1_PATH_7, 1, 7), // Left (90 deg)
};

const PATHS_5: Record<PlayerId, Coords[]> = {
  [PlayerId.P1]: P1_PATH_5,
  [PlayerId.P2]: generateRotatedPath(P1_PATH_5, 3, 5), // Right
  [PlayerId.P3]: generateRotatedPath(P1_PATH_5, 2, 5), // Top
  [PlayerId.P4]: generateRotatedPath(P1_PATH_5, 1, 5), // Left
};

export const getPaths = (size: number) => size === 5 ? PATHS_5 : PATHS_7;

export const getInnerCircleStartIndex = (size: number) => size === 5 ? 16 : 24;

export const getStartPositions = (size: number) => {
  const paths = getPaths(size);
  return {
    [PlayerId.P1]: paths[PlayerId.P1][0],
    [PlayerId.P2]: paths[PlayerId.P2][0],
    [PlayerId.P3]: paths[PlayerId.P3][0],
    [PlayerId.P4]: paths[PlayerId.P4][0],
  };
};

export const PLAYER_CONFIG = {
  [PlayerId.P1]: { 
    name: "Red", 
    color: "bg-rose-600", 
    border: "border-rose-800", 
    text: "text-rose-500", 
    glow: "shadow-[0_0_15px_rgba(225,29,72,0.6)]",
    gradient: "from-rose-500 to-rose-700" 
  },
  [PlayerId.P2]: { 
    name: "Green", 
    color: "bg-emerald-600", 
    border: "border-emerald-800", 
    text: "text-emerald-500", 
    glow: "shadow-[0_0_15px_rgba(16,185,129,0.6)]",
    gradient: "from-emerald-500 to-emerald-700" 
  },
  [PlayerId.P3]: { 
    name: "Yellow", 
    color: "bg-yellow-400", 
    border: "border-yellow-600", 
    text: "text-yellow-500", 
    glow: "shadow-[0_0_15px_rgba(250,204,21,0.6)]",
    gradient: "from-yellow-300 to-yellow-500" 
  },
  [PlayerId.P4]: { 
    name: "Blue", 
    color: "bg-blue-600", 
    border: "border-blue-800", 
    text: "text-blue-500", 
    glow: "shadow-[0_0_15px_rgba(37,99,235,0.6)]",
    gradient: "from-blue-500 to-blue-700" 
  },
};