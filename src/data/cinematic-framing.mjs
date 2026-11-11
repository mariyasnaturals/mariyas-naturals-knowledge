// Atmospheric shots may fill by cropping. Faces, hands, hair and packaging
// always use the entire source frame, including on unusually shaped viewports.
export function filmCompositionFit(width, height, chapter, mobile) {
  if (!(width > 0 && height > 0)) return 'contain';
  if (!['botanicals', 'golden-oil'].includes(chapter)) return 'contain';
  const sourceRatio = mobile ? 9 / 16 : 16 / 9;
  const viewportRatio = width / height;
  const crop =
    1 - Math.min(viewportRatio / sourceRatio, sourceRatio / viewportRatio);
  return crop <= 0.22 ? 'cover' : 'contain';
}
