import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

export function mountCinematicStory(root: HTMLElement) {
  const media = gsap.matchMedia();
  const scenes = Array.from(
    root.querySelectorAll<HTMLElement>('[data-story-scene]'),
  );
  // The chapter navigation and photographic scene sections were removed from
  // the homepage; the hero film keeps its eight internal chapters.
  const links = root.querySelectorAll('[data-chapter-link]');
  const watch = (event: MouseEvent) => {
    const link = (event.target as Element).closest<HTMLElement>(
      '[data-watch-scene]',
    );
    if (link)
      root.querySelector('responsive-film')?.dispatchEvent(
        new CustomEvent('cinematic:seek', {
          detail: { id: link.dataset.watchScene },
        }),
      );
  };
  root.addEventListener('click', watch);
  const hero = root.querySelector('.cinema-hero');
  // Observe the film itself rather than the whole story wrapper: with the
  // duplicated scene sections removed, the wrapper is one viewport tall and the
  // header would only switch a full screen too late.
  const headerObserver = new IntersectionObserver(
    ([entry]) => {
      document.documentElement.classList.toggle(
        'cinema-past-hero',
        !entry.isIntersecting,
      );
    },
    // Shrinking the root by a pixel stops a hero that exactly fills the
    // viewport from still counting as intersecting once it is scrolled past.
    { threshold: 0, rootMargin: '-1px 0px 0px 0px' },
  );
  if (hero) headerObserver.observe(hero);
  const setChapter = (index: number) => {
    root.dataset.chapter = String(index + 1);
    links.forEach((link, i) =>
      i === index
        ? link.setAttribute('aria-current', 'step')
        : link.removeAttribute('aria-current'),
    );
  };
  // Natural document scrolling on every viewport; no scroll interception.
  media.add(
    '(prefers-reduced-motion: no-preference)',
    () => {
      const heroCopy = root.querySelectorAll('.cinema-hero-copy > *');
      if (heroCopy.length)
        gsap.from(heroCopy, {
          y: 14,
          opacity: 0,
          duration: 1.1,
          stagger: 0.1,
          ease: 'power2.out',
        });
      scenes.forEach((scene, index) => {
        ScrollTrigger.create({
          trigger: scene,
          start: 'top 60%',
          end: 'bottom 60%',
          onEnter: () => setChapter(index),
          onEnterBack: () => setChapter(index),
        });
        const sceneCopy = scene.querySelector('.cinema-scene-copy');
        if (sceneCopy)
          gsap.from(sceneCopy, {
            y: 24,
            duration: 0.8,
            ease: 'power2.out',
            scrollTrigger: { trigger: scene, start: 'top 90%', once: true },
          });
        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: scene,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.5,
          },
        });
        const halo = scene.querySelector('.cinema-halo');
        if (halo)
          timeline.fromTo(
            halo,
            { scale: 0.85, rotation: -12 },
            { scale: 1.1, rotation: 12, ease: 'none' },
            0,
          );
        const effect = scene.dataset.effect;
        const originals = scene.querySelector('.cinema-originals');
        if (originals && effect === 'botanical')
          timeline.fromTo(
            originals,
            { scale: 1.04 },
            { scale: 1, ease: 'sine.inOut' },
            0,
          );
        if (originals && effect === 'oil')
          timeline.fromTo(
            originals,
            { opacity: 0.9, scale: 1.04 },
            { opacity: 1, scale: 1, ease: 'sine.inOut' },
            0,
          );
        if (originals && effect === 'reveal')
          timeline.fromTo(
            originals,
            { scale: 1.04, opacity: 0.85 },
            { scale: 1, opacity: 1, ease: 'power2.out' },
            0,
          );
        if (originals && effect === 'sweep')
          timeline.fromTo(
            originals,
            { scale: 1.04 },
            { scale: 1, ease: 'sine.inOut' },
            0,
          );
        if (
          (effect === 'oil' || effect === 'application') &&
          scene.querySelector('.cinema-light')
        )
          timeline.fromTo(
            scene.querySelector('.cinema-light'),
            { yPercent: -35, scaleY: 0.8 },
            { yPercent: 35, scaleY: 1.2, ease: 'sine.inOut' },
            0,
          );
        if (
          (effect === 'shine' || effect === 'sweep') &&
          scene.querySelector('.cinema-sweep')
        )
          timeline
            .fromTo(
              scene.querySelector('.cinema-sweep'),
              { xPercent: -70, rotation: -12, opacity: 0 },
              {
                xPercent: 0,
                rotation: -6,
                opacity: 0.16,
                ease: 'sine.inOut',
                duration: 0.45,
              },
              0,
            )
            .to(scene.querySelector('.cinema-sweep'), {
              xPercent: 70,
              opacity: 0,
              duration: 0.45,
              ease: 'sine.inOut',
            });
      });
      // Guarded: the scene list and its progress bar no longer exist now that the
      // duplicated post-hero sections are gone. Never create a ScrollTrigger
      // against a null trigger.
      const scenesList = root.querySelector('.cinema-scenes');
      const progressBar = root.querySelector('.cinema-progress span');
      if (scenesList && progressBar)
        gsap.fromTo(
          progressBar,
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: scenesList,
              start: 'top 60%',
              end: 'bottom 60%',
              scrub: true,
            },
          },
        );
      return () => {
        delete root.dataset.chapter;
        links.forEach((link) => link.removeAttribute('aria-current'));
      };
    },
    root,
  );
  const cleanup = () => {
    media.revert();
    root.removeEventListener('click', watch);
    headerObserver.disconnect();
    document.documentElement.classList.remove('cinema-past-hero');
  };
  document.addEventListener('astro:before-swap', cleanup, { once: true });
  window.addEventListener('pagehide', (event) => {
    if (!event.persisted) cleanup();
  });
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) ScrollTrigger.refresh();
  });
}
