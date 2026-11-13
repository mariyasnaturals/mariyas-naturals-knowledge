import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { studies } from './motion.mjs';
gsap.registerPlugin(ScrollTrigger);

/**
 * Natural-scroll botanical journey.
 *
 * Every scene is a real section in document flow. ScrollTrigger only *observes*
 * each scene to drive its own local choreography — there is no `pin`, no sticky
 * stage, no fixed overlay and no single global timeline. The page is what moves:
 * a scene travels up and out of the viewport while the next enters from below,
 * and scrolling continues into the rest of the site with no interruption.
 */
export function mountBotanicalJourney(root: HTMLElement) {
  const media = gsap.matchMedia();
  const scenes = [
    ...root.querySelectorAll<HTMLElement>('[data-scene]'),
  ] as HTMLElement[];
  const q = <T extends Element>(selector: string) =>
    root.querySelector<T>(selector);
  const saveData = (
    navigator as Navigator & { connection?: { saveData?: boolean } }
  ).connection?.saveData;

  // Scenes are in flow whether or not JavaScript ever runs.
  const resetMarkup = () => {
    root.querySelectorAll<HTMLElement>('[data-scene]').forEach((el) => {
      el.removeAttribute('inert');
      el.removeAttribute('aria-hidden');
    });
  };
  resetMarkup();

  media.add(
    {
      reduced: '(prefers-reduced-motion: reduce)',
      mobile: '(max-width: 759px)',
      all: 'all',
    },
    (context) => {
      const { reduced, mobile } = context.conditions as {
        reduced: boolean;
        mobile: boolean;
      };
      root.dataset.layout = mobile ? 'portrait' : 'landscape';

      /* --------------------------------------------------------------------
         Reduced motion (and Save-Data): the journey is a static story. Every
         scene keeps its copy, claim and call to action; nothing is hidden and
         no scroll animation is created.
         ------------------------------------------------------------------ */
      if (reduced || saveData) {
        root.dataset.motion = 'reduced';
        return () => {
          delete root.dataset.motion;
          delete root.dataset.layout;
        };
      }

      root.dataset.motion = 'scroll';
      const triggers: ScrollTrigger[] = [];
      /** A scrubbed timeline tied to one scene's own travel. */
      const sceneTimeline = (
        scene: HTMLElement,
        build: (tl: gsap.core.Timeline) => void,
      ) => {
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: scene,
            // The animation plays across the part of the scene's runway that is
            // actually on screen, so it feels tied to the page rather than to a
            // duration.
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
            invalidateOnRefresh: true,
          },
        });
        build(tl);
        return tl;
      };

      // Overall journey progress (0..1), published for the progress indicator and
      // for tests that prove the page — not a hidden clock — drives everything.
      triggers.push(
        ScrollTrigger.create({
          trigger: root.querySelector<HTMLElement>('.botanical-track')!,
          start: 'top bottom',
          end: 'bottom top',
          onUpdate: (self) => {
            root.dataset.progress = self.progress.toFixed(4);
          },
        }),
      );

      // Portrait: the held bottle owns the middle of the frame (roughly
      // 262–582 of an 844-tall viewport). Chapter copy is in flow, so it sweeps
      // upward at 1:1 and would otherwise be read straight through the product.
      // The only genuinely clear band above the bottle is therefore the reveal
      // window: copy stays at zero until its top edge is clear of the product,
      // then holds until it leaves the frame. Triggered on the copy itself, so
      // the mapping is the copy's own travel — not a guess about scene height.
      if (mobile)
        scenes.forEach((el) => {
          const copy = el.querySelector<HTMLElement>('.botanical-copy');
          if (!copy) return;
          // The finale resolves beneath the product for good, so it is never
          // faded in — only out, once it starts climbing into the held bottle's
          // band. Geometry: copy top reaches 66% (≈557 of 844) exactly as it
          // touches the bottle's base, so it is gone before it can overlap.
          if (el.dataset.scene === 'reveal') {
            const exit = gsap.timeline({
              defaults: { ease: 'none' },
              scrollTrigger: {
                trigger: copy,
                start: 'top 66%',
                end: 'top 60%',
                scrub: true,
                invalidateOnRefresh: true,
              },
            });
            exit.fromTo(copy, { autoAlpha: 1 }, { autoAlpha: 0 });
            return;
          }
          const tl = gsap.timeline({
            defaults: { ease: 'none' },
            scrollTrigger: {
              trigger: copy,
              start: 'top bottom',
              end: 'top top',
              scrub: true,
              invalidateOnRefresh: true,
            },
          });
          tl.fromTo(
            copy,
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: 0.06 },
            0.84,
          ).to(copy, { autoAlpha: 1, duration: 0.1 }, 0.9);
        });

      // Chapter art drifts gently behind the held product, so the background
      // changes around the bottle instead of moving the bottle with it.
      scenes.forEach((el) => {
        const art = el.querySelector<HTMLElement>('.botanical-scene-art');
        if (!art) return;
        gsap.fromTo(
          art,
          { yPercent: mobile ? 3 : 5 },
          {
            yPercent: mobile ? -3 : -5,
            ease: 'none',
            scrollTrigger: {
              trigger: el,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          },
        );
      });

      // Scene activation bookkeeping (cheap, toggles only on enter/leave).
      scenes.forEach((el) => {
        triggers.push(
          ScrollTrigger.create({
            trigger: el,
            onToggle: (self) => {
              el.toggleAttribute('data-scene-active', self.isActive);
              // `data-scene` names a scene, so the root's current scene must use
              // a different attribute or it would shadow every scene selector.
              if (self.isActive)
                root.dataset.activeScene = el.dataset.scene as string;
            },
          } as ScrollTrigger.Vars),
        );
      });

      /* --------------------------------------------------------------------
         Scene 1 · Origin — the plate drifts as the page carries it upward.
         ------------------------------------------------------------------ */
      const origin = q<HTMLElement>('[data-scene="origin"]');
      if (origin) {
        const canopy = origin.querySelector<HTMLElement>('.botanical-canopy');
        const grove = origin.querySelector<HTMLElement>('.botanical-grove');
        const copy = origin.querySelector<HTMLElement>('.botanical-copy');
        sceneTimeline(origin, (tl) => {
          if (canopy)
            tl.fromTo(
              canopy,
              { yPercent: -3, scale: 1.04 },
              { yPercent: 5, scale: 1.1 },
              0,
            );
          if (grove) tl.fromTo(grove, { yPercent: 6 }, { yPercent: -10 }, 0);
          if (copy)
            tl.fromTo(
              copy,
              { y: mobile ? 18 : 34 },
              { y: 0, duration: 0.55 },
              0,
            );
        });
      }

      /* --------------------------------------------------------------------
         Scene 2 · Thirty studies arrive on distinct organic paths. They belong
         to this scene, so they travel with the page instead of appearing over a
         held frame.
         ------------------------------------------------------------------ */
      const studyScene = q<HTMLElement>('[data-scene="studies"]');
      if (studyScene) {
        const items = [
          ...studyScene.querySelectorAll<HTMLElement>('.botanical-study'),
        ];
        sceneTimeline(studyScene, (tl) => {
          items.forEach((item, index) => {
            const meta = studies[index]!;
            const from = meta.enterX > 50 ? 1 : -1;
            tl.fromTo(
              item,
              {
                xPercent: from * 26,
                yPercent: 22 + (index % 4) * 6,
                rotate: meta.rotate,
                scale: 0.42,
                autoAlpha: 0,
              },
              {
                xPercent: (index % 2 ? 1 : -1) * (index % 5) * 1.6,
                yPercent: 0,
                rotate: 0,
                scale: 1,
                autoAlpha: 1,
                duration: 0.42,
              },
              // Staggered start, but every item finishes well inside the scene.
              (index / items.length) * 0.3,
            );
          });
        });
      }

      /* --------------------------------------------------------------------
         Scene 3 · Ingredients physically converge toward the vessel, then the
         vessel is left holding them as the scene exits downward.
         ------------------------------------------------------------------ */
      const convergence = q<HTMLElement>('[data-scene="convergence"]');
      if (convergence) {
        const items = [
          ...convergence.querySelectorAll<HTMLElement>('.botanical-ingredient'),
        ];
        const vessel = convergence.querySelector<HTMLElement>(
          '.botanical-convergence-vessel',
        );
        const radius = mobile ? 132 : 208;
        sceneTimeline(convergence, (tl) => {
          items.forEach((item, index) => {
            const angle = (index * 36 * Math.PI) / 180;
            const spread = 1 + (index % 3) * 0.16;
            tl.fromTo(
              item,
              {
                x: Math.cos(angle) * radius * spread,
                y: Math.sin(angle) * radius * 0.8 * spread,
                rotate: (index % 2 ? 1 : -1) * 18,
                scale: 0.62,
                autoAlpha: 0,
              },
              {
                // Converge to the vessel's mouth and disappear into it.
                x: 0,
                y: -6,
                rotate: 0,
                scale: 0.28,
                autoAlpha: 0,
                duration: 0.5,
              },
              (index / items.length) * 0.42,
            );
            tl.to(
              item,
              { autoAlpha: 1, duration: 0.14 },
              (index / items.length) * 0.42,
            );
            tl.to(
              item,
              { autoAlpha: 0, duration: 0.18 },
              0.48 + (index / items.length) * 0.2,
            );
          });
          if (vessel)
            tl.fromTo(
              vessel,
              { scale: 0.92, yPercent: 6 },
              { scale: 1, yPercent: 0, duration: 0.7 },
              0.1,
            );
        });
      }

      /* --------------------------------------------------------------------
         Scene 4 · Preparation: the pestle grinds, botanical pieces are cut and
         fall, and a paste gathers in the mortar.
         ------------------------------------------------------------------ */
      const preparation = q<HTMLElement>('[data-scene="preparation"]');
      if (preparation) {
        const mortar = preparation.querySelector<HTMLElement>(
          '[data-layer="mortar"]',
        );
        const pestle = preparation.querySelector<HTMLElement>(
          '[data-layer="pestle"]',
        );
        const fragments = preparation.querySelector<HTMLElement>(
          '[data-layer="fragments"]',
        );
        const paste = preparation.querySelector<HTMLElement>(
          '[data-layer="paste"]',
        );
        const cuts = [
          ...preparation.querySelectorAll<HTMLElement>('.botanical-cut i'),
        ];
        sceneTimeline(preparation, (tl) => {
          if (mortar)
            tl.fromTo(
              mortar,
              { scale: 0.9, yPercent: 8 },
              { scale: 1, yPercent: 0, duration: 0.3 },
              0,
            );
          if (pestle) {
            // A grind is a rotation about the pestle's own head, repeated.
            tl.fromTo(
              pestle,
              { rotate: -12, yPercent: -6 },
              {
                rotate: 10,
                yPercent: 4,
                duration: 0.22,
                repeat: 2,
                yoyo: true,
              },
              0.14,
            );
          }
          cuts.forEach((shard, index) => {
            tl.fromTo(
              shard,
              { x: 0, y: 0, rotate: 0, autoAlpha: 0.9, scale: 1 },
              {
                x: (index % 2 ? 1 : -1) * (10 + (index % 3) * 12),
                y: 46 + (index % 4) * 14,
                rotate: (index % 2 ? 1 : -1) * 120,
                autoAlpha: 0,
                scale: 0.5,
                duration: 0.3,
              },
              0.2 + index * 0.05,
            );
          });
          if (fragments)
            tl.fromTo(
              fragments,
              { yPercent: -18, autoAlpha: 0 },
              { yPercent: 0, autoAlpha: 1, duration: 0.25 },
              0.3,
            );
          if (paste)
            tl.fromTo(
              paste,
              { scale: 0.3, autoAlpha: 0 },
              { scale: 1, autoAlpha: 1, duration: 0.3 },
              0.55,
            );
        });
      }

      /* --------------------------------------------------------------------
         Scene 5 · Extraction. The stream is a static relationship between two
         vessels measured once, so its length can never drift with scroll.
         ------------------------------------------------------------------ */
      const extraction = q<HTMLElement>('[data-scene="extraction"]');
      const fill = q<HTMLElement>(
        '[data-scene="extraction"] [data-layer="fill"]',
      );
      const extractStream = q<HTMLElement>('[data-layer="extract-stream"]');
      const extractPool = q<HTMLElement>('[data-layer="extract-pool"]');

      const offsetWithin = (el: HTMLElement, ancestor: HTMLElement) => {
        let x = 0;
        let y = 0;
        let node: HTMLElement | null = el;
        while (node && node !== ancestor) {
          x += node.offsetLeft;
          y += node.offsetTop;
          node = node.offsetParent as HTMLElement | null;
        }
        return { x, y };
      };

      const connectExtraction = () => {
        if (!extraction || !extractStream || !extractPool) return;
        const station = extraction.querySelector<HTMLElement>(
          '.botanical-filter-station',
        );
        const extractor = extraction.querySelector<HTMLElement>(
          '.botanical-extractor',
        );
        const aperture = extraction.querySelector<HTMLElement>(
          '.botanical-receiver .botanical-liquid-aperture',
        );
        if (!station || !extractor || !aperture) return;
        // Resolved in the station's own untransformed layout space: the page
        // scrolls beneath it, so viewport rects would move under the
        // measurement and change the stream's length every frame.
        const outletY =
          offsetWithin(extractor, station).y + extractor.offsetHeight;
        const mouth = offsetWithin(aperture, station);
        const surfaceY = mouth.y + aperture.offsetHeight * 0.35;
        extractStream.style.top = `${outletY - 4}px`;
        extractStream.style.height = `${Math.max(8, surfaceY - outletY + 6)}px`;
        extractPool.style.top = `${surfaceY - 3}px`;
        extractPool.style.left = `${mouth.x + aperture.offsetWidth * 0.34}px`;
        extractPool.style.width = `${aperture.offsetWidth * 0.32}px`;
      };

      if (extraction) {
        const botanicals = extraction.querySelector<HTMLElement>(
          '.botanical-filter-botanicals',
        );
        sceneTimeline(extraction, (tl) => {
          if (botanicals)
            tl.fromTo(
              botanicals,
              { yPercent: -40, scale: 0.6, autoAlpha: 0 },
              { yPercent: 0, scale: 1, autoAlpha: 1, duration: 0.28 },
              0,
            );
          if (extractStream)
            tl.fromTo(
              extractStream,
              { scaleY: 0, autoAlpha: 0 },
              { scaleY: 1, autoAlpha: 1, duration: 0.3 },
              0.16,
            );
          if (extractPool)
            tl.fromTo(
              extractPool,
              { scale: 0.2, autoAlpha: 0 },
              { scale: 1, autoAlpha: 1, duration: 0.3 },
              0.4,
            );
          if (fill)
            tl.fromTo(
              fill,
              { '--collection': 0 },
              { '--collection': 0.72, duration: 0.5 },
              0.32,
            );
        });
      }

      /* --------------------------------------------------------------------
         Scene 6 · Oil: the green extract becomes near-black forest-green oil.
         ------------------------------------------------------------------ */
      const oil = q<HTMLElement>('[data-scene="oil"]');
      if (oil) {
        const uruliFill = oil.querySelector<HTMLElement>(
          '[data-layer="uruli-fill"]',
        );
        const ripples = oil.querySelector<HTMLElement>(
          '[data-layer="ripples"]',
        );
        const copper = oil.querySelector<HTMLElement>('[data-layer="copper"]');
        sceneTimeline(oil, (tl) => {
          if (copper)
            tl.fromTo(
              copper,
              { yPercent: 7, scale: 0.94 },
              { yPercent: 0, scale: 1, duration: 0.4 },
              0,
            );
          if (uruliFill)
            tl.fromTo(
              uruliFill,
              {
                '--collection': 0.14,
                '--liquid-body': '#2f5a3d',
                '--liquid-surface': '#244a31',
              },
              {
                // The finished state is reached while the scene is still on
                // screen, and it holds: the oil is near-black forest green.
                '--collection': 0.84,
                '--liquid-body': '#071a13',
                '--liquid-surface': '#123827',
                duration: 0.45,
              },
              0.1,
            );
          if (ripples)
            tl.fromTo(
              ripples,
              { autoAlpha: 0, scale: 0.7 },
              { autoAlpha: 0.5, scale: 1, duration: 0.4 },
              0.3,
            );
        });
      }

      /* --------------------------------------------------------------------
         Scene 7 · Transfer: the filled vessel pours into the receiving uruli.
         The stream and droplet are children of the pourer, so they can never
         detach from the spout.
         ------------------------------------------------------------------ */
      const transfer = q<HTMLElement>('[data-scene="transfer"]');
      if (transfer) {
        const pourer = transfer.querySelector<HTMLElement>(
          '[data-layer="pourer"]',
        );
        const stream = transfer.querySelector<HTMLElement>(
          '[data-layer="stream"]',
        );
        const drop = transfer.querySelector<HTMLElement>('[data-layer="drop"]');
        const targetFill = transfer.querySelector<HTMLElement>(
          '[data-layer="target-fill"]',
        );
        sceneTimeline(transfer, (tl) => {
          if (pourer)
            tl.fromTo(
              pourer,
              { rotate: 4, yPercent: -8, autoAlpha: 0.4 },
              { rotate: 16, yPercent: 0, autoAlpha: 1, duration: 0.3 },
              0,
            );
          if (stream)
            tl.fromTo(
              stream,
              { scaleY: 0 },
              { scaleY: 1, duration: 0.28 },
              0.16,
            );
          if (drop)
            tl.fromTo(
              drop,
              { y: 0, autoAlpha: 0 },
              { y: mobile ? 54 : 76, autoAlpha: 1, duration: 0.3 },
              0.2,
            );
          if (targetFill)
            tl.fromTo(
              targetFill,
              { '--collection': 0.2 },
              { '--collection': 0.8, duration: 0.4 },
              0.3,
            );
        });
      }

      /* --------------------------------------------------------------------
         The bottle: the stable focal point.

         Its layer is sticky inside the journey track, so the browser keeps it
         centred while the chapters scroll past. This timeline only handles its
         entrance and its graceful release at the journey's bounds — it never
         translates the product with a scene.
         ------------------------------------------------------------------ */
      const bottleLayer = root.querySelector<HTMLElement>(
        '[data-bottle-layer]',
      );
      const bottleStage = root.querySelector<HTMLElement>(
        '[data-bottle-frame]',
      );
      const bottleHalo = root.querySelector<HTMLElement>(
        '.botanical-bottle-halo',
      );
      const closingScene = q<HTMLElement>('[data-scene="reveal"]');
      if (bottleLayer && bottleStage) {
        // Entrance: the bottle rises and settles as the journey opens.
        gsap.fromTo(
          bottleStage,
          { yPercent: 6, scale: 0.94, autoAlpha: 0 },
          {
            yPercent: 0,
            scale: 1,
            autoAlpha: 1,
            ease: 'power2.out',
            duration: 1.1,
            scrollTrigger: {
              trigger: bottleLayer,
              start: 'top 88%',
              toggleActions: 'play none none reverse',
            },
          },
        );
        // Presence across the chapters: subtle, so it stays a focal point rather
        // than a moving object.
        gsap.fromTo(
          bottleStage,
          { scale: 1 },
          {
            scale: mobile ? 1.04 : 1.08,
            ease: 'none',
            scrollTrigger: {
              trigger: root.querySelector<HTMLElement>('.botanical-track')!,
              start: 'top top',
              end: 'bottom bottom',
              scrub: true,
            },
          },
        );
        // Release: as the finale resolves, the bottle settles and the light
        // behind it warms. It then leaves with the journey, not with a scene.
        if (closingScene)
          gsap.fromTo(
            bottleStage,
            { filter: 'saturate(1)' },
            {
              filter: 'saturate(1.04)',
              ease: 'none',
              scrollTrigger: {
                trigger: closingScene,
                start: 'top 70%',
                end: 'top 25%',
                scrub: true,
              },
            },
          );
        if (bottleHalo)
          gsap.fromTo(
            bottleHalo,
            { autoAlpha: 0, scale: 0.8 },
            {
              autoAlpha: 1,
              scale: 1,
              ease: 'none',
              scrollTrigger: {
                trigger: closingScene ?? bottleLayer,
                start: 'top 75%',
                end: 'top 30%',
                scrub: true,
              },
            },
          );
      }

      /* --------------------------------------------------------------------
         Scene 8 · Reveal — copy, claim and CTA resolve around the held bottle.
         ------------------------------------------------------------------ */
      if (closingScene) {
        const copy = closingScene.querySelector<HTMLElement>('.botanical-copy');
        const halo = closingScene.querySelector<HTMLElement>(
          '.botanical-finale-halo',
        );
        sceneTimeline(closingScene, (tl) => {
          if (copy)
            tl.fromTo(
              copy,
              { y: mobile ? 18 : 34 },
              { y: 0, duration: 0.5 },
              0,
            );
          if (halo)
            tl.fromTo(
              halo,
              { scale: 0.7, autoAlpha: 0 },
              { scale: 1, autoAlpha: 1, duration: 0.5 },
              0,
            );
        });
      }

      /* --------------------------------------------------------------------
         Measurements. Stream geometry is resolved on layout changes only, never
         per scroll frame, so reverse scrolling cannot desynchronise it.
         ------------------------------------------------------------------ */
      const layout = () => connectExtraction();
      layout();
      // The vessels are images: their heights arrive after decode, and change
      // with rotation. Re-measure on every real layout change so the stream is
      // never left at zero height.
      const station = extraction?.querySelector<HTMLElement>(
        '.botanical-filter-station',
      );
      let resizeObserver: ResizeObserver | undefined;
      if (station && typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => layout());
        resizeObserver.observe(station);
      }
      root.querySelectorAll('img').forEach((img) => {
        if (!(img as HTMLImageElement).complete)
          img.addEventListener('load', layout, { once: true });
      });
      ScrollTrigger.addEventListener('refreshInit', layout);
      ScrollTrigger.addEventListener('refresh', layout);
      const onResize = () => ScrollTrigger.refresh();
      window.addEventListener('resize', onResize, { passive: true });

      return () => {
        triggers.forEach((trigger) => trigger.kill());
        ScrollTrigger.removeEventListener('refreshInit', layout);
        ScrollTrigger.removeEventListener('refresh', layout);
        window.removeEventListener('resize', onResize);
        resizeObserver?.disconnect();
        delete root.dataset.motion;
        delete root.dataset.layout;
        delete root.dataset.activeScene;
        root.querySelectorAll('[data-scene]').forEach((el) => {
          el.removeAttribute('data-scene-active');
        });
      };
    },
  );

  const cleanup = () => {
    media.revert();
    delete root.dataset.motion;
  };
  document.addEventListener('astro:before-swap', cleanup, { once: true });
  return cleanup;
}
