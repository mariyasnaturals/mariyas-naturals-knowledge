// Placement metadata is normalized to the persistent stage, never viewport pixels.
// The journey is one continuous world: a camera dollies through a single connected
// set of environments and every stage hands its material to the next.
export const groups = ['A', 'B', 'C', 'D', 'E', 'F'];

// World layout, expressed as a fraction of the (larger-than-viewport) world box.
// Desktop dollies horizontally; portrait dollies vertically through the same
// environment, so the choreography is the same story on both axes.
export const world = Object.freeze({
  // The world box is wider/taller than the viewport; the camera travels the rest.
  // Total travel is deliberately modest: consecutive stations must stay within
  // about a fifth of a viewport of each other so vessels that physically touch
  // (filter, kinnam, uruli, pourer) are always visible in the same frame.
  desktopExtent: 2.7,
  mobileExtent: 2.35,
  // Depth planes: far background moves slowest, near props move with the camera.
  planes: Object.freeze({ far: 0.16, mid: 0.42, near: 1 }),
});

// Where each environment sits inside the world, expressed as the scroll progress
// at which the camera must bring it to the centre of the frame. Placement is
// derived from these, so a station can never drift out of its own stage.
export const places = Object.freeze({
  grove: 0.0625,
  bench: 0.4375,
  filter: 0.5625,
  uruli: 0.6875,
  reveal: 0.9375,
});

// A camera at `progress` shows world axis from p*(W-vw) to that + vw, so an
// object centred in frame sits at this fraction of the world.
export function worldFocus(progress, extent) {
  return progress * (1 - 1 / extent) + 1 / (2 * extent);
}

// Portrait dollies vertically. Solving the same projection for a chosen screen
// position lets a station land exactly where the composition wants it (below
// the caption, above the fixed bottom navigation) at its own stage.
export function verticalFocus(progress, screenFraction, extent) {
  return (screenFraction + progress * (extent - 1)) / extent;
}

// Where the camera is centred at each of the eight stages (0..1 of the world).
export const camera = Object.freeze([
  { x: 0.05, y: 0.5, zoom: 1.04 },
  { x: 0.16, y: 0.5, zoom: 1.0 },
  { x: 0.25, y: 0.52, zoom: 1.02 },
  { x: 0.31, y: 0.53, zoom: 1.0 },
  { x: 0.48, y: 0.5, zoom: 1.02 },
  { x: 0.66, y: 0.5, zoom: 1.0 },
  { x: 0.82, y: 0.5, zoom: 1.03 },
  { x: 0.95, y: 0.5, zoom: 1.0 },
]);

// Normalized attachment points inside each registered derivative, used to keep
// liquid streams physically glued to the vessel that emits and receives them.
export const anchors = Object.freeze({
  'preparation-device': { mouth: [0.5, 0.2] },
  'preparation-pestle': { grip: [0.5, 0.18], head: [0.5, 0.86] },
  'brass-filter': { inlet: [0.5, 0.22], outlet: [0.5, 0.93] },
  'brass-kinnam': {
    rim: [0.5, 0.24],
    surface: [0.5, 0.34],
    spout: [0.06, 0.3],
  },
  'brass-uruli': { rim: [0.5, 0.3], surface: [0.5, 0.44] },
  'brass-pourer': { grip: [0.62, 0.28], spout: [0.08, 0.84] },
});

// Thirty independent, unnamed artistic studies. They enter on distinct
// trajectories, travel while the camera moves, converge into the preparation
// equipment and are never merely faded in and out in place.
export const studies = Array.from({ length: 30 }, (_, index) => {
  const group = Math.floor(index / 5);
  const slot = index % 5;
  const angle = ((index * 137.508 - 90) * Math.PI) / 180;
  const radius = 0.055 + (slot % 3) * 0.032;
  return {
    id: `ingredient-${String(index + 1).padStart(2, '0')}`,
    group: groups[group],
    slot,
    identity: null,
    role: 'unnamed-artistic-botanical-study',
    // Resting place across the opening of the world, where stages 1–2 happen.
    x: 17 + (index % 10) * 5.4 + Math.cos(angle) * 1.4,
    y: 16 + Math.floor(index / 10) * 26 + Math.sin(angle) * 5,
    // Where the study is when it first appears (outside the frame on its own side).
    enterX: group % 2 ? 62 : 2,
    enterY: 8 + slot * 19,
    depth: 0.62 + (index % 4) * 0.13,
    rotate: -24 + ((index * 17) % 48),
    // Organic travel: every study drifts on its own arc while it is on screen.
    arc: {
      dx: Math.cos(angle) * (radius * 100),
      dy: Math.sin(angle) * (radius * 62),
      spin: ((index % 5) - 2) * 9,
      sway: 1.6 + (index % 3) * 0.9,
    },
    // Progressive introduction: six groups of five across the first two stages.
    start: 0.02 + group * 0.19 + slot * 0.016,
    duration: 0.16,
    // Position within the convergence arc at the preparation bench.
    // The bench sits at ~0.44 of the world; converging studies gather just
    // above and around the mortar so the pestle meets them.
    converge: {
      x: 34 + Math.cos(angle * 1.4) * 5,
      y: 34 + Math.sin(angle * 1.4) * 8,
      delay: slot * 0.012 + group * 0.006,
    },
  };
});

export const oilPalette = Object.freeze({
  shadow: '#020a06',
  body: '#071a13',
  reflection: '#244a31',
  olive: '#344735',
});

// Stage boundaries in scroll progress and the material each stage receives and
// hands on. The release test asserts every hand-off has a matching recipient.
export const stages = Object.freeze([
  {
    id: 1,
    name: 'origin',
    from: 0,
    to: 0.125,
    receives: 'hero',
    hands: 'botanical studies',
  },
  {
    id: 2,
    name: 'studies',
    from: 0.125,
    to: 0.25,
    receives: 'botanical studies',
    hands: 'converging ingredients',
  },
  {
    id: 3,
    name: 'convergence',
    from: 0.25,
    to: 0.375,
    receives: 'converging ingredients',
    hands: 'preparation material',
  },
  {
    id: 4,
    name: 'preparation',
    from: 0.375,
    to: 0.5,
    receives: 'preparation material',
    hands: 'ground botanical paste',
  },
  {
    id: 5,
    name: 'extraction',
    from: 0.5,
    to: 0.625,
    receives: 'ground botanical paste',
    hands: 'green herbal extract',
  },
  {
    id: 6,
    name: 'oil',
    from: 0.625,
    to: 0.75,
    receives: 'green herbal extract',
    hands: 'deep herbal oil',
  },
  {
    id: 7,
    name: 'transfer',
    from: 0.75,
    to: 0.875,
    receives: 'deep herbal oil',
    hands: 'filled receiving vessel',
  },
  {
    id: 8,
    name: 'reveal',
    from: 0.875,
    to: 1,
    receives: 'filled receiving vessel',
    hands: 'authentic Mariyas product',
  },
]);
