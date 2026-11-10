import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

export function mountCinematicStory(root: HTMLElement) {
  const media = gsap.matchMedia();
  const scenes = Array.from(
    root.querySelectorAll<HTMLElement>('[data-story-scene]'),
  );
  const links = root.querySelectorAll('[data-chapter-link]');
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
      scenes.forEach((scene, index) => {
        ScrollTrigger.create({
          trigger: scene,
          start: 'top 60%',
          end: 'bottom 60%',
          onEnter: () => setChapter(index),
          onEnterBack: () => setChapter(index),
        });
        gsap.from(scene.querySelector('.cinema-scene-copy'), {
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
          timeline.fromTo(
            scene.querySelector('.cinema-sweep'),
            { xPercent: -110, rotation: -18, opacity: 0 },
            { xPercent: 110, rotation: 8, opacity: 0.22, ease: 'sine.inOut' },
            0,
          );
        if (effect === 'reveal' || effect === 'portrait' || effect === 'hero')
          timeline.fromTo(
            scene.querySelector('.cinema-frame'),
            { y: 18 },
            { y: -18, ease: 'none' },
            0,
          );
      });
      gsap.fromTo(
        root.querySelector('.cinema-progress span'),
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: root.querySelector('.cinema-scenes'),
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
  const cleanup = () => media.revert();
  document.addEventListener('astro:before-swap', cleanup, { once: true });
  window.addEventListener('pagehide', (event) => {
    if (!event.persisted) cleanup();
  });
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) ScrollTrigger.refresh();
  });
}
