// Scene metadata for the natural-scroll journey.
//
// The journey is ordinary document flow: eight real <section> elements stacked
// vertically. Nothing is pinned, nothing is sticky, and there is no single
// oversized world translated under a fixed window. Each scene owns its own
// choreography; the page itself is what moves.
export const groups = ['A', 'B', 'C', 'D', 'E', 'F'];

// How tall each scene is, in viewport heights of scroll travel. Scene content is
// one viewport tall; the extra height is the runway its own animation plays
// across. Because this is real document height, the next scene enters from below
// while the previous one exits above, exactly like any other part of the page.
export const rhythm = Object.freeze({
  establish: 1.5, // origin, studies, convergence: slower, wider beats
  process: 1.35, // preparation, extraction, oil, transfer
  resolve: 1.15, // the product finale must not overstay
});

// Attachment points inside each registered derivative, used to glue liquid
// streams to the vessel that emits and receives them.
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
    // Resting position inside its own scene, in percent of the scene box.
    // Spread across the scene's whole art box, never pooled at one edge.
    x: 5 + (index % 10) * 9.6 + Math.cos(angle) * 2.2,
    y: 9 + Math.floor(index / 10) * 30 + Math.sin(angle) * 8,
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

// The eight scenes, in document order. `travel` is that scene's own scroll
// runway in viewport heights. The release test asserts the hand-off chain has no
// gaps: what one scene hands on is exactly what its successor receives.
export const stages = Object.freeze([
  {
    id: 1,
    name: 'origin',
    scene: 'origin',
    travel: rhythm.establish,
    receives: 'hero',
    hands: 'botanical studies',
  },
  {
    id: 2,
    name: 'studies',
    scene: 'studies',
    travel: rhythm.establish,
    receives: 'botanical studies',
    hands: 'converging ingredients',
  },
  {
    id: 3,
    name: 'convergence',
    scene: 'convergence',
    travel: rhythm.establish,
    receives: 'converging ingredients',
    hands: 'preparation material',
  },
  {
    id: 4,
    name: 'preparation',
    scene: 'preparation',
    travel: rhythm.process,
    receives: 'preparation material',
    hands: 'ground botanical paste',
  },
  {
    id: 5,
    name: 'extraction',
    scene: 'extraction',
    travel: rhythm.process,
    receives: 'ground botanical paste',
    hands: 'green herbal extract',
  },
  {
    id: 6,
    name: 'oil',
    scene: 'oil',
    travel: rhythm.process,
    receives: 'green herbal extract',
    hands: 'deep herbal oil',
  },
  {
    id: 7,
    name: 'transfer',
    scene: 'transfer',
    travel: rhythm.process,
    receives: 'deep herbal oil',
    hands: 'filled receiving vessel',
  },
  {
    id: 8,
    name: 'reveal',
    scene: 'reveal',
    travel: rhythm.resolve,
    receives: 'filled receiving vessel',
    hands: 'authentic Mariyas product',
  },
]);

// Total scroll runway of the journey, in viewport heights. Used by the tests and
// by the recording script; the browser derives the real height from the DOM.
export const journeyTravel = stages.reduce(
  (total, stage) => total + stage.travel + 1,
  0,
);
