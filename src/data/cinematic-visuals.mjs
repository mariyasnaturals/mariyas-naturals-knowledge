// Identity and packaging come from owner photographs, never inferred video frames.
export function sceneVisuals(manifest, scene) {
  const reference = (key) => ({
    id: `reference-${key}`,
    asset: manifest.references[key],
  });
  let candidates;
  if (scene.id === 'product-reveal') candidates = [reference('product')];
  else if (scene.id === 'original-model') candidates = [reference('model')];
  else if (scene.id === 'final-hero')
    candidates = [reference('model'), reference('product')];
  else candidates = [{ id: scene.id, asset: scene }];
  return candidates.filter(
    ({ asset }) => asset.status === 'ready' && asset.src,
  );
}
