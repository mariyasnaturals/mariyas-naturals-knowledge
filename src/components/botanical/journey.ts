import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { studies, camera } from './motion.mjs';
gsap.registerPlugin(ScrollTrigger);

/**
 * One continuous world, one camera.
 *
 * The stage is a viewport-sized window onto a much larger world box. Scrolling
 * dollies the camera through that box (horizontally on landscape, vertically on
 * portrait), so the viewer travels through connected environments instead of
 * watching objects fade in and out of a fixed picture. Everything is driven by
 * native scroll position, so it is fully reversible and pausable.
 */
export function mountBotanicalJourney(root: HTMLElement) {
  const media = gsap.matchMedia();
  const track = root.querySelector<HTMLElement>('.botanical-track')!;
  const steps = [
    ...root.querySelectorAll<HTMLElement>('[data-botanical-step]'),
  ];
  const q = <T extends Element>(selector: string) =>
    root.querySelector<T>(selector);
  const saveData = (
    navigator as Navigator & { connection?: { saveData?: boolean } }
  ).connection?.saveData;
  media.add(
    {
      reduced: '(prefers-reduced-motion: reduce)',
      mobile: '(max-width: 759px)',
      all: 'all',
    },
    (context) => {
      const reduced = context.conditions?.reduced || saveData;
      const mobile = Boolean(context.conditions?.mobile);
      root.dataset.motion = reduced ? 'reduced' : 'scroll';
      root.dataset.layout = mobile ? 'portrait' : 'landscape';
      if (reduced) return;

      const worldEl = q<HTMLElement>('[data-layer="world"]')!;
      const stage = q<HTMLElement>('.botanical-stage')!;
      const animated = root.querySelectorAll<HTMLElement>(
        '.botanical-study,.botanical-mortar,.botanical-filter-station,.botanical-copper,.botanical-pourer,.botanical-stream,.botanical-drop,.botanical-product,.botanical-paste,.botanical-extract-stream,.botanical-extract-pool,.botanical-ripples',
      );
      gsap.set(animated, { autoAlpha: 0 });
      gsap.set('.botanical-extract-stream,.botanical-stream', {
        scaleY: 0,
        transformOrigin: '50% 0%',
      });

      // Captions live inside the persistent stage so they can never scroll under
      // the fixed header, and inactive ones stay inert for screen readers.
      const captionLayer = document.createElement('div');
      captionLayer.className = 'botanical-caption-layer';
      const captions = steps.map((step) => {
        const copy = step.querySelector<HTMLElement>('.botanical-copy')!;
        captionLayer.append(copy);
        return copy;
      });
      stage.append(captionLayer);
      stage.removeAttribute('aria-hidden');

      const preload = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          stage.querySelectorAll('img').forEach((img) => {
            img.loading = 'eager';
          });
          preload.disconnect();
        },
        { rootMargin: '900px' },
      );
      preload.observe(root);

      // Keep the caption block clear of the fixed header on every viewport.
      const headerRoom = () => {
        const header = document.querySelector<HTMLElement>('header');
        const inset = header
          ? Math.max(0, header.getBoundingClientRect().bottom)
          : 0;
        captionLayer.style.setProperty(
          '--botanical-header-room',
          `${Math.round(inset)}px`,
        );
      };
      headerRoom();

      gsap.set(captions, { autoAlpha: 0 });
      gsap.set(captions[0], { autoAlpha: 1 });

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: track,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
          invalidateOnRefresh: true,
          onRefresh: headerRoom,
          onUpdate: (self) => {
            root.dataset.progress = self.progress.toFixed(4);
            const active = Math.min(7, Math.floor(self.progress * 8));
            root.dataset.stage = String(active + 1);
            captions.forEach((copy, index) => {
              copy.inert = index !== active;
              copy.setAttribute('aria-hidden', String(index !== active));
            });
          },
        },
      });

      // Captions fade with their own stage. Each of the eight stages owns one
      // unit of the timeline, so copy can never lag behind the visuals.
      captions.forEach((copy, index) => {
        if (index)
          tl.fromTo(
            copy,
            { autoAlpha: 0, y: 14 },
            { autoAlpha: 1, y: 0, duration: 0.14 },
            index + 0.04,
          );
        if (index < 7)
          tl.to(copy, { autoAlpha: 0, y: -10, duration: 0.1 }, index + 0.88);
      });

      /* ------------------------------------------------------------------ */
      /* Camera: one dolly move through the whole world, eight keyframes.     */
      /* ------------------------------------------------------------------ */
      const box = () => ({
        w: worldEl.offsetWidth,
        h: worldEl.offsetHeight,
        vw: stage.clientWidth,
        vh: stage.clientHeight,
      });
      // Landscape dollies along x, portrait along y. Using the width in both
      // cases would make the portrait dolly exactly zero, so the axis is explicit.
      const placeAt = (progress: number) => {
        const { w, h, vw, vh } = box();
        return mobile ? -(h - vh) * progress : -(w - vw) * progress;
      };
      // Depth planes move at different rates: the canopy barely moves, benches
      // travel with the camera, foreground props move slightly faster.
      // The world translation itself is a single scrubbed tween so reverse
      // scrolling retraces exactly the same path.
      tl.fromTo(
        worldEl,
        { x: () => placeAt(0) },
        {
          x: () => (mobile ? 0 : placeAt(1)),
          y: () => (mobile ? placeAt(1) : 0),
          duration: 8,
          immediateRender: false,
        },
        0,
      );
      // Canopy drift and light travel slower than the camera (parallax).
      // A slow, continuous push-in: the camera creeps forward through the world
      // while it dollies, so the scene keeps opening rather than sliding flatly.
      const zoomFrom = camera[0]!.zoom;
      const zoomTo = camera[camera.length - 1]!.zoom;
      tl.fromTo(
        worldEl,
        { scale: zoomFrom },
        { scale: zoomTo, duration: 8, transformOrigin: '50% 50%' },
        0,
      );
      tl.fromTo(
        q('.botanical-canopy'),
        { scale: 1.12, xPercent: mobile ? 0 : 4, yPercent: mobile ? 4 : 0 },
        { scale: 1.02, xPercent: mobile ? 0 : -4, duration: 8 },
        0,
      );
      tl.fromTo(
        q('.botanical-grove'),
        { xPercent: mobile ? 0 : 2 },
        { xPercent: 0, duration: 4 },
        0,
      );
      tl.fromTo(
        q('.botanical-light'),
        { xPercent: -8, opacity: 0.35 },
        { xPercent: 12, opacity: 0.62, duration: 8 },
        0,
      );
      tl.fromTo(
        q('.botanical-haze'),
        { opacity: 0.85 },
        { opacity: 0.35, duration: 6 },
        0,
      );
      tl.fromTo(
        q('.botanical-progress i'),
        { scaleX: 0 },
        { scaleX: 1, duration: 8 },
        0,
      );

      /* ------------------------------------------------------------------ */
      /* Stage 1–2: botanical material arrives on its own trajectories.       */
      /* ------------------------------------------------------------------ */
      studies.forEach((study) => {
        const el = q<HTMLElement>(`[data-study="${study.id}"]`)!;
        // Resting position is where the study lives inside the world.
        const rest = { left: `${study.x}%`, top: `${study.y}%` };
        const entry = {
          left: `${study.enterX}%`,
          top: `${study.enterY}%`,
          scale: study.depth * 0.72,
          rotation: study.rotate - 26,
          autoAlpha: 0,
        };
        const start = 0.05 + (study.start / 1.08) * 1.9;
        tl.fromTo(
          el,
          { ...entry, xPercent: -50, yPercent: -50 },
          {
            ...rest,
            scale: study.depth,
            rotation: study.rotate,
            autoAlpha: 1,
            duration: 0.34,
          },
          start,
        );
        // Organic travel while the camera moves: each study arcs through the
        // frame rather than sitting still, and its depth decides how far.
        tl.to(
          el,
          {
            left: `${study.x + study.arc.dx}%`,
            top: `${study.y + study.arc.dy}%`,
            rotation: study.rotate + study.arc.spin,
            duration: 1.1,
            ease: 'sine.inOut',
          },
          start + 0.34,
        );
        // Stage 3: every study converges on the preparation bench, then is
        // taken up by the pestle. Nothing is faded out where it happens to sit.
        tl.to(
          el,
          {
            left: `${study.converge.x}%`,
            top: `${study.converge.y}%`,
            scale: study.depth * 0.42,
            rotation: study.rotate + 64,
            duration: 0.82,
            ease: 'power1.in',
          },
          2.55 + study.converge.delay,
        );
        tl.to(
          el,
          {
            left: `${study.converge.x + 4}%`,
            top: '46%',
            scale: 0.04,
            rotation: study.rotate + 150,
            autoAlpha: 0,
            duration: 0.5,
            ease: 'power2.in',
          },
          3.4 + study.converge.delay,
        );
      });

      /* ------------------------------------------------------------------ */
      /* Stage 4: preparation. The pestle works the material; the grinder    */
      /* receives what the pestle has finished with.                         */
      /* ------------------------------------------------------------------ */
      const mortar = q<HTMLElement>('[data-layer="mortar"]')!;
      tl.fromTo(
        mortar,
        { autoAlpha: 0, y: 40, scale: 0.9 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.5 },
        2.35,
      );
      const pestle = q<HTMLElement>('[data-layer="pestle"]')!;
      tl.fromTo(
        pestle,
        { rotation: -14, yPercent: -8 },
        {
          rotation: 10,
          yPercent: 6,
          duration: 0.26,
          repeat: 4,
          yoyo: true,
          ease: 'sine.inOut',
        },
        2.85,
      );
      const fragments = q<HTMLElement>('[data-layer="fragments"]')!;
      tl.fromTo(
        fragments,
        { autoAlpha: 0, scale: 0.4, y: -24 },
        { autoAlpha: 1, scale: 1, y: 0, duration: 0.24 },
        2.95,
      );
      const paste = q<HTMLElement>('[data-layer="paste"]')!;
      tl.fromTo(
        paste,
        { scale: 0.2, autoAlpha: 0 },
        { scale: 1, autoAlpha: 1, duration: 0.6 },
        3.25,
      );
      // The finished paste leaves the mortar and is carried to the filter.
      tl.to(
        paste,
        {
          x: () => (mobile ? 22 : 340),
          y: () => (mobile ? 260 : -40),
          scale: 0.18,
          autoAlpha: 0,
          duration: 0.75,
        },
        3.95,
      );
      // The bench must be gone before the filter's stream starts (4.35), or the
      // drifting mortar reads as a second, ghostly vessel beside the real one.
      tl.to(
        [mortar, fragments],
        {
          x: () => (mobile ? 20 : 320),
          autoAlpha: 0,
          scale: 0.86,
          duration: 0.5,
        },
        3.78,
      );

      /* ------------------------------------------------------------------ */
      /* Stage 5: extraction. Material falls into the filter; the stream is  */
      /* measured from the filter's real outlet to the kinnam's real rim.    */
      /* ------------------------------------------------------------------ */
      const station = q<HTMLElement>('[data-layer="filter-station"]')!;
      const receiver = q<HTMLElement>('[data-layer="receiver"]')!;
      const extractStream = q<HTMLElement>('[data-layer="extract-stream"]')!;
      const extractPool = q<HTMLElement>('[data-layer="extract-pool"]')!;
      // Resolved here (not further down) because the geometry pass uses them.
      const pourer = q<HTMLElement>('[data-layer="pourer"]')!;
      const stream = q<HTMLElement>('[data-layer="stream"]')!;
      const drop = q<HTMLElement>('[data-layer="drop"]')!;
      const copper = q<HTMLElement>('[data-layer="copper"]')!;
      // `fromTo` here would re-apply visibility on every frame and stomp the
      // earlier hidden state, so the start values are set once and only the
      // arrival is tweened.
      gsap.set(station, { y: 60 });
      tl.to(station, { autoAlpha: 1, y: 0, duration: 0.45 }, 4.05);
      // Physical connection, measured from the vessel geometry itself: the fine
      // stream starts at the filter's own outlet and ends on the receiving
      // surface inside the station box. Because the artwork, the liquid and the
      // stream share one box, the join survives dolly, parallax and resize.
      // Offset of `el` from `ancestor` in untransformed layout space. The camera
      // scales the whole world, the station carries its own tween transform and
      // the receiver is an animated child of the station, so getBoundingClientRect
      // is a moving target; summing offsetParent chains cancels all of it.
      const offsetWithin = (el: HTMLElement, ancestor: HTMLElement) => {
        let x = 0;
        let y = 0;
        let node: HTMLElement | null = el;
        while (node && node !== ancestor) {
          x += node.offsetLeft;
          y += node.offsetTop;
          node = node.offsetParent as HTMLElement | null;
        }
        // The walk stops at `ancestor`, so the sum is already an offset inside
        // it; deducting the ancestor's own offset would count it twice.
        return { x, y };
      };
      const extractor = q<HTMLElement>('.botanical-extractor')!;
      const aperture = q<HTMLElement>(
        '.botanical-receiver .botanical-liquid-aperture',
      )!;
      const connectExtraction = () => {
        // Everything here is resolved in the station's own untransformed layout
        // space. The camera scales the world and the station carries its own
        // tween, so viewport rects move under the measurement and the stream
        // length would change with the scroll position.
        const outletY =
          offsetWithin(extractor, station).y + extractor.offsetHeight;
        // The stream lands inside the bowl's mouth: a third of the way down the
        // aperture the artwork itself defines, never a guessed fraction.
        const mouth = offsetWithin(aperture, station);
        const surfaceY = mouth.y + aperture.offsetHeight * 0.35;
        extractStream.style.top = `${outletY - 4}px`;
        extractStream.style.height = `${Math.max(8, surfaceY - outletY + 6)}px`;
        extractPool.style.top = `${surfaceY - 3}px`;
        extractPool.style.left = `${mouth.x + aperture.offsetWidth * 0.34}px`;
        extractPool.style.width = `${aperture.offsetWidth * 0.32}px`;
      };
      // The pour is a *static* relationship between two vessels: the stream is a
      // child of the pourer, so its length is simply the measured gap from the
      // spout down to the uruli's receiving surface. Measured on refresh only,
      // never per scroll frame, so reverse scrolling cannot desynchronise it.
      const connectTransfer = () => {
        const p = pourer.getBoundingClientRect();
        const u = copper.getBoundingClientRect();
        const spoutY = p.top + p.height * 0.74;
        const surfaceY = u.top + u.height * 0.3;
        stream.style.height = `${Math.max(10, surfaceY - spoutY + 6)}px`;
        drop.style.top = `${Math.max(0, surfaceY - spoutY - 16)}px`;
      };
      const layout = () => {
        connectExtraction();
        connectTransfer();
      };
      ScrollTrigger.addEventListener('refreshInit', layout);
      ScrollTrigger.addEventListener('refresh', layout);
      layout();

      tl.to(
        extractStream,
        { autoAlpha: 1, scaleY: 1, duration: 0.45, ease: 'none' },
        4.35,
      );
      tl.fromTo(
        extractPool,
        { scaleX: 0.1, opacity: 0.2 },
        { scaleX: 1, opacity: 0.85, duration: 0.5 },
        4.4,
      );
      tl.fromTo(
        q('.botanical-filter-botanicals'),
        { autoAlpha: 0.2, y: -10 },
        { autoAlpha: 1, y: 0, duration: 0.4 },
        4.15,
      );
      // The kinnam fills from the stream while it flows.
      tl.fromTo(
        receiver,
        { '--collection': 0 } as never,
        { '--collection': 0.62, duration: 0.6 } as never,
        4.45,
      );
      tl.to(extractStream, { scaleY: 0, duration: 0.18 }, 5.02);
      tl.to(extractStream, { autoAlpha: 0, duration: 0.18 }, 5.02);

      /* ------------------------------------------------------------------ */
      /* Stage 6: the extract becomes deep herbal oil in the larger uruli.   */
      /* ------------------------------------------------------------------ */
      const uruliFill = q<HTMLElement>('[data-layer="uruli-fill"]')!;
      const ripples = q<HTMLElement>('[data-layer="ripples"]')!;
      gsap.set(copper, { y: 70, scale: 0.94 });
      tl.to(copper, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5 }, 4.95);
      tl.to(
        [receiver, station],
        { x: mobile ? -28 : -420, autoAlpha: 0, duration: 0.62 },
        5.05,
      );
      // The kinnam leaves with its measured contents, so the material is
      // visibly carried from the filter bench into the uruli rather than reset.
      tl.fromTo(
        uruliFill,
        {
          '--collection': 0,
          backgroundColor: '#244a31',
          '--liquid-surface': '#244a31',
          '--liquid-edge': '#123827',
        } as never,
        {
          '--collection': 0.86,
          backgroundColor: '#071a13',
          '--liquid-surface': '#123827',
          '--liquid-edge': '#020a06',
          duration: 0.95,
          ease: 'sine.inOut',
        } as never,
        5.1,
      );
      tl.fromTo(
        ripples,
        { rotation: -12, scale: 0.8, opacity: 0.12 },
        { rotation: 42, scale: 1.06, opacity: 0.72, duration: 0.9 },
        5.25,
      );

      /* ------------------------------------------------------------------ */
      /* Stage 7: the pour. The stream starts at the pourer's own spout and   */
      /* lands on the uruli's real receiving surface.                         */
      /* ------------------------------------------------------------------ */
      gsap.set(pourer, {
        x: mobile ? -40 : -260,
        y: -30,
        rotation: -8,
      });
      tl.to(
        pourer,
        {
          autoAlpha: 1,
          x: 0,
          y: 0,
          rotation: 0,
          duration: 0.5,
          ease: 'power1.out',
        },
        5.85,
      );
      tl.to(pourer, { rotation: -6, y: -6, duration: 0.18 }, 6.3);
      tl.to(stream, { autoAlpha: 1, scaleY: 1, duration: 0.42 }, 6.34);
      tl.fromTo(
        uruliFill,
        { '--collection': 0.86 } as never,
        { '--collection': 1, duration: 0.5 } as never,
        6.4,
      );
      tl.fromTo(
        drop,
        { autoAlpha: 0, yPercent: 0 },
        { autoAlpha: 1, yPercent: 40, duration: 0.2 },
        6.5,
      );
      tl.to(drop, { yPercent: 140, autoAlpha: 0, duration: 0.3 }, 6.72);
      tl.to(stream, { scaleY: 0, duration: 0.2 }, 6.9);
      tl.to(stream, { autoAlpha: 0, duration: 0.2 }, 6.9);
      tl.to(
        [pourer, copper, ripples],
        { autoAlpha: 0, scale: 0.94, duration: 0.42 },
        6.92,
      );

      /* ------------------------------------------------------------------ */
      /* Stage 8: the authentic bottle, the claim and the approved CTA.       */
      /* ------------------------------------------------------------------ */
      const product = q<HTMLElement>('[data-layer="product"]')!;
      gsap.set(product, { scale: 0.9, y: 40 });
      tl.to(product, { autoAlpha: 1, scale: 1, y: 0, duration: 0.55 }, 7.02);
      const claim = root.querySelector('.botanical-claim')!;
      tl.fromTo(
        claim,
        { autoAlpha: 0, y: 24, filter: 'blur(5px)' },
        {
          autoAlpha: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: mobile ? 0.14 : 0.4,
        },
        mobile ? 7.34 : 7.12,
      );
      tl.fromTo(
        root.querySelector('.botanical-cta'),
        { autoAlpha: 0, y: 14 },
        { autoAlpha: 1, y: 0, duration: mobile ? 0.1 : 0.25 },
        mobile ? 7.6 : 7.52,
      );
      // Three of the studies return as a wreath behind the finished bottle so
      // the ingredient story closes visually as well as narratively.
      [0, 12, 24].forEach((index, order) => {
        const study = studies[index]!;
        const el = q<HTMLElement>(`[data-study="${study.id}"]`)!;
        tl.fromTo(
          el,
          {
            left: `${mobile ? [18, 78, 82][order] : [80, 92, 88][order]}%`,
            top: `${mobile ? [58, 40, 68][order] : [26, 52, 74][order]}%`,
            scale: 0.3,
            rotation: -20 + order * 14,
            autoAlpha: 0,
          },
          {
            autoAlpha: 0.9,
            scale: mobile ? 0.6 : 0.78,
            duration: 0.45,
            immediateRender: false,
          },
          7.1 + order * 0.08,
        );
      });
      // Align the last composition with the end of native document scrolling.
      tl.to({}, { duration: 0.01 }, 8);

      const stageWatchers = steps.map((step, index) =>
        ScrollTrigger.create({
          trigger: step,
          start: 'top 60%',
          end: 'bottom 60%',
          onToggle: (self) => {
            if (self.isActive) root.dataset.stage = String(index + 1);
          },
        }),
      );

      return () => {
        stageWatchers.forEach((watcher) => watcher.kill());
        ScrollTrigger.removeEventListener('refreshInit', layout);
        ScrollTrigger.removeEventListener('refresh', layout);
        captions.forEach((copy, index) => {
          steps[index]!.append(copy);
          copy.inert = false;
          copy.removeAttribute('aria-hidden');
        });
        preload.disconnect();
        captionLayer.remove();
        stage.setAttribute('aria-hidden', 'true');
        delete root.dataset.progress;
        delete root.dataset.stage;
        delete root.dataset.layout;
        gsap.set(animated, { clearProps: 'all' });
        gsap.set(worldEl, { clearProps: 'transform' });
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
