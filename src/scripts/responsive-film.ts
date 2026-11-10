// Only the selected orientation gets a source. Pending assets never request a URL.
export class ResponsiveFilm extends HTMLElement {
  private dispose?: () => void;
  connectedCallback() {
    this.dispose?.();
    const video = this.querySelector('video')!;
    const button = this.querySelector('button')!;
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
    let visible = false;
    let userPaused = false;
    let manualPlay = false;
    let failed = false;
    const pendingText = status.textContent;
    const updateButton = () => {
      const text = video.paused ? this.dataset.play! : this.dataset.pause!;
      button.textContent = text;
      button.setAttribute('aria-label', text);
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
      failed = false;
      manualPlay = false;
      video.pause();
      video.hidden = true;
      fallback.hidden = false;
      status.textContent = pendingText;
      const src = mobile.matches ? this.dataset.mobile : this.dataset.desktop;
      button.hidden = !src;
      // Never fall back to the wrong aspect ratio while the selected cut is pending.
      if (!src) {
        video.removeAttribute('src');
        video.load();
        return;
      }
      video.muted = true;
      video.src = src;
      video.load();
      sync();
    };
    const ready = () => {
      if (failed || !video.hasAttribute('src')) return;
      video.hidden = false;
      fallback.hidden = true;
    };
    const error = () => {
      failed = true;
      video.pause();
      video.hidden = true;
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
    button.addEventListener('click', toggle);
    video.addEventListener('loadeddata', ready);
    video.addEventListener('error', error);
    video.addEventListener('play', updateButton);
    video.addEventListener('pause', updateButton);
    observer.observe(this);
    select();
    this.dispose = () => {
      observer.disconnect();
      mobile.removeEventListener('change', select);
      reduced.removeEventListener('change', preferences);
      connection?.removeEventListener('change', preferences);
      document.removeEventListener('visibilitychange', sync);
      button.removeEventListener('click', toggle);
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
