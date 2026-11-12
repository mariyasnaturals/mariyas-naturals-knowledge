// Placement metadata is normalized to the persistent stage, never viewport pixels.
export const groups = ['A', 'B', 'C', 'D', 'E', 'F'];
export const studies = Array.from({ length: 30 }, (_, index) => {
  const group = Math.floor(index / 5);
  const slot = index % 5;
  const angle = ((index * 137.508 - 90) * Math.PI) / 180;
  return {
    id: `ingredient-${String(index + 1).padStart(2, '0')}`,
    group: groups[group],
    slot,
    identity: null,
    role: 'unnamed-artistic-botanical-study',
    x: 61 + Math.cos(angle) * (13 + slot * 3),
    y: 48 + Math.sin(angle) * (14 + slot * 4),
    enterX: group % 2 ? 115 : -15,
    enterY: 12 + slot * 17,
    depth: 0.7 + (index % 4) * 0.13,
    rotate: -24 + ((index * 17) % 48),
    start: 0.02 + group * 0.19 + slot * 0.016,
    duration: 0.16,
  };
});
export const oilPalette = Object.freeze({
  shadow: '#020a06',
  body: '#071a13',
  reflection: '#244a31',
  olive: '#344735',
});
