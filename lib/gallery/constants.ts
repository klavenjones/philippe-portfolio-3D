// All scene measurements in meters.

export const HALL = {
  width: 6, // walls at x = ±3
  height: 4,
  startZ: 4,
  endZ: -78, // end wall
} as const;

export const WALL_X = HALL.width / 2;

export const SLOT_SPACING = 5;
export const SLOT_COUNT = 15;

export const CAMERA = {
  height: 1.6,
  fov: 55,
  near: 0.1,
  far: 120,
  startZ: 4,
  endZ: -74,
} as const;

export const ART_CENTER_Y = 1.6;
export const LABEL_Y = 2.6;

export const FRAME = {
  border: 0.06, // frame extends this much past the art on each side
  depth: 0.05,
  wallGap: 0.025, // frame face offset from wall
  matBorder: 0.08, // passe-partout border for drawings
} as const;

export const DETAIL_VIEW = {
  distance: 1.9,
  minDistance: 1.6,
  focusDuration: 1.0,
  returnDuration: 0.8,
} as const;

export const SCROLL_SPACER_VH = 1500;

export const COLORS = {
  wall: 0xf4f2ee,
  floor: 0xc9b18a,
  ceiling: 0xffffff,
  frame: 0x3d2b1f, // dark walnut
  mat: 0xfafaf7,
  fog: 0xe8e6e1,
} as const;

export const slotZ = (slot: number) => -slot * SLOT_SPACING;
