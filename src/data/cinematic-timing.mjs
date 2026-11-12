export function chapterAtTime(chapters, time) {
  if (!chapters.length || !Number.isFinite(time)) return -1;
  return chapters.findIndex(
    (chapter, index) =>
      time >= chapter.start &&
      (time < chapter.end || index === chapters.length - 1),
  );
}

// Preserve the same story moment when switching between differently edited cuts.
export function correspondingTime(from, to, time) {
  const index = chapterAtTime(from, time);
  if (index < 0) return 0;
  const source = from[index];
  const target = to.find((chapter) => chapter.id === source.id);
  if (!target) return 0;
  const progress = Math.min(
    1,
    Math.max(0, (time - source.start) / (source.end - source.start)),
  );
  return target.start + progress * (target.end - target.start);
}
