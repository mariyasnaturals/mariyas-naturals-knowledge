import { chapterAtTime, correspondingTime } from '../data/cinematic-timing.mjs';
import { filmCompositionFit } from '../data/cinematic-framing.mjs';
type Chapter = { id: string; start: number; end: number };

// One original cut at a time. Time follows the corresponding story beat on resize.
export class ResponsiveFilm extends HTMLElement {
  private dispose?: () => void;
  connectedCallback() {
    this.dispose?.();
    const video = this.querySelector('video')!;
    const button = this.querySelector('button')!;
    const poster = this.querySelector<HTMLElement>('.cinema-film-poster')!;
    const fallback = this.querySelector<HTMLElement>(
      '.cinema-film-placeholder',
    )!;
    const status = this.querySelector<HTMLElement>('[data-film-status]')!;
    const mobile = matchMedia(
      `(max-width: ${Number(this.dataset.breakpoint) - 1}px)`,
    );
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const connection = (
      navigator as Navigator & {
        connection?: EventTarget & { saveData?: boolean };
      }
    ).connection;
    const desktopTimeline: Chapter[] = JSON.parse(
      this.dataset.timelineDesktop || '[]',
    );
    const mobileTimeline: Chapter[] = JSON.parse(
      this.dataset.timelineMobile || '[]',
    );
    let timeline: Chapter[] = [];
    let visible = false;
    let userPaused = false;
    let manualPlay = false;
    let failed = false;
    let pendingSeek: number | undefined;
    let lastChapter = -1;
    const hero = this.closest<HTMLElement>('.cinema-hero');
    const composition = () => {
      const chapter = this.dataset.currentChapter || 'botanicals';
      this.dataset.fit = filmCompositionFit();
      if (hero) {
        hero.dataset.filmChapter = chapter;
        const index = Math.max(
          0,
          timeline.findIndex((item) => item.id === chapter),
        );
        const headlines: string[] = JSON.parse(hero.dataset.headlines || '[]');
        const lines: string[] = JSON.parse(hero.dataset.lines || '[]');
        const title = hero.querySelector('h1');
        const line = hero.querySelector('.cinema-hero-line');
        if (title && headlines[index]) title.textContent = headlines[index];
        if (line && lines[index]) line.textContent = lines[index];
      }
    };
    const pendingText = status.textContent;
    const updateButton = () => {
      const text = video.paused ? this.dataset.play! : this.dataset.pause!;
      button.textContent = text;
      button.setAttribute('aria-label', text);
      button.dataset.paused = String(video.paused);
    };
    const updateTime = () => {
      const index = chapterAtTime(timeline, video.currentTime);
      if (index === lastChapter) return;
      lastChapter = index;
      if (index < 0) {
        delete this.dataset.currentChapter;
        return;
      }
      this.dataset.currentChapter = timeline[index].id;
      composition();
      this.dispatchEvent(
        new CustomEvent('cinematic:chapter-change', {
          bubbles: true,
          detail: { id: timeline[index].id, index, time: video.currentTime },
        }),
      );
    };
    const sync = () => {
      if (
        visible &&
        !document.hidden &&
        !userPaused &&
        !failed &&
        (manualPlay || (!reduced.matches && !connection?.saveData)) &&
        video.hasAttribute('src')
      ) {
        video.play().catch(updateButton);
      } else video.pause();
    };
    const select = () => {
      const nextTimeline = mobile.matches ? mobileTimeline : desktopTimeline;
      pendingSeek = timeline.length
        ? correspondingTime(timeline, nextTimeline, video.currentTime)
        : 0;
      timeline = nextTimeline;
      lastChapter = -1;
      delete this.dataset.currentChapter;
      composition();
      failed = false;
      manualPlay = false;
      video.pause();
      video.hidden = true;
      poster.hidden = false;
      fallback.hidden = true;
      status.textContent = pendingText;
      const src = mobile.matches ? this.dataset.mobile : this.dataset.desktop;
      button.hidden = !src;
      if (!src) {
        video.removeAttribute('src');
        poster.hidden = true;
        fallback.hidden = false;
        video.load();
        return;
      }
      video.muted = true;
      video.src = src;
      // preload=none leaves the poster in place until visibility or user intent.
      sync();
    };
    const seekWhenReady = () => {
      if (pendingSeek !== undefined && Number.isFinite(video.duration)) {
        video.currentTime = Math.min(
          pendingSeek,
          Math.max(0, video.duration - 0.05),
        );
        pendingSeek = undefined;
      }
      updateTime();
    };
    const ready = () => {
      if (failed || !video.hasAttribute('src')) return;
      video.hidden = false;
      poster.hidden = true;
      fallback.hidden = true;
      updateTime();
    };
    const error = () => {
      failed = true;
      video.pause();
      video.hidden = true;
      poster.hidden = true;
      fallback.hidden = false;
      status.textContent = this.dataset.unavailable!;
      button.hidden = true;
    };
    const toggle = () => {
      if (!video.paused) {
        userPaused = true;
        manualPlay = false;
        video.pause();
      } else {
        userPaused = false;
        manualPlay = true;
        video.play().catch(updateButton);
      }
    };
    const seekChapter = (event: Event) => {
      const id = (event as CustomEvent<{ id: string }>).detail.id;
      const chapter = timeline.find((chapter) => chapter.id === id);
      if (!chapter || failed || !video.hasAttribute('src')) return;
      pendingSeek = chapter.start;
      userPaused = false;
      manualPlay = true;
      if (video.readyState >= 1) seekWhenReady();
      video.play().catch(updateButton);
    };
    const preferences = () => {
      manualPlay = false;
      sync();
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting && entry.intersectionRatio >= 0.15;
        sync();
      },
      { threshold: [0, 0.15] },
    );
    mobile.addEventListener('change', select);
    reduced.addEventListener('change', preferences);
    connection?.addEventListener('change', preferences);
    document.addEventListener('visibilitychange', sync);
    this.addEventListener('cinematic:seek', seekChapter);
    button.addEventListener('click', toggle);
    video.addEventListener('loadedmetadata', seekWhenReady);
    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('seeked', updateTime);
    video.addEventListener('loadeddata', ready);
    video.addEventListener('error', error);
    video.addEventListener('play', updateButton);
    video.addEventListener('pause', updateButton);
    observer.observe(this);
    const resize = new ResizeObserver(composition);
    resize.observe(this);
    select();
    this.dispose = () => {
      observer.disconnect();
      resize.disconnect();
      mobile.removeEventListener('change', select);
      reduced.removeEventListener('change', preferences);
      connection?.removeEventListener('change', preferences);
      document.removeEventListener('visibilitychange', sync);
      this.removeEventListener('cinematic:seek', seekChapter);
      button.removeEventListener('click', toggle);
      video.removeEventListener('loadedmetadata', seekWhenReady);
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('seeked', updateTime);
      video.removeEventListener('loadeddata', ready);
      video.removeEventListener('error', error);
      video.removeEventListener('play', updateButton);
      video.removeEventListener('pause', updateButton);
      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }
  disconnectedCallback() {
    this.dispose?.();
  }
}
