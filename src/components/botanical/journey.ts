import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { studies } from './motion.mjs';
gsap.registerPlugin(ScrollTrigger);

export function mountBotanicalJourney(root: HTMLElement) {
  const media = gsap.matchMedia();
  const track = root.querySelector<HTMLElement>('.botanical-track')!;
  const steps = [
    ...root.querySelectorAll<HTMLElement>('[data-botanical-step]'),
  ];
  const layer = (name: string) =>
    root.querySelector<HTMLElement>(`[data-layer="${name}"]`)!;
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
      const mobile = context.conditions?.mobile;
      root.dataset.motion = reduced ? 'reduced' : 'scroll';
      if (reduced) return;
      const elements = root.querySelectorAll(
        '.botanical-study,.botanical-apparatus,.botanical-fragments,.botanical-stream,.botanical-drop,.botanical-product,.botanical-pourer',
      );
      gsap.set(elements, { autoAlpha: 0 });
      const stage = root.querySelector<HTMLElement>('.botanical-stage')!;
      const captions = steps.map((step) =>
        step.querySelector<HTMLElement>('.botanical-copy')!,
      );
      const captionLayer = document.createElement('div');
      captionLayer.className = 'botanical-caption-layer';
      captions.forEach((copy) => captionLayer.append(copy));
      stage.append(captionLayer);
      stage.removeAttribute('aria-hidden');
      const preload = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            stage
              .querySelectorAll('img')
              .forEach((img) => (img.loading = 'eager'));
            preload.disconnect();
          }
        },
        { rootMargin: '700px' },
      );
      preload.observe(root);
      gsap.set(captions, { autoAlpha: 0, yPercent: mobile ? 0 : -50 });
      gsap.set(captions[0], { autoAlpha: 1 });
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: track,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            root.dataset.progress = self.progress.toFixed(4);
            const active = Math.min(7, Math.floor(self.progress * 8));
            captions.forEach((copy, index) => {
              copy.inert = index !== active;
              copy.setAttribute('aria-hidden', String(index !== active));
            });
          },
        },
      });
      captions.forEach((copy, index) => {
        if (index)
          tl.fromTo(
            copy,
            { autoAlpha: 0, y: 16 },
            { autoAlpha: 1, y: 0, duration: 0.15 },
            index + 0.03,
          );
        if (index < 7)
          tl.to(copy, { autoAlpha: 0, y: -12, duration: 0.12 }, index + 0.86);
      });
      // One persistent environment, independent object paths, no autoplay or wheel interception.
      tl.to(
        root.querySelector('.botanical-environment'),
        { scale: 1.08, yPercent: -3, duration: 8 },
        0,
      );
      tl.to(
        root.querySelector('.botanical-light'),
        { opacity: 0.6, xPercent: 8, duration: 8 },
        0,
      );
      tl.fromTo(
        root.querySelector('.botanical-progress i'),
        { scaleX: 0 },
        { scaleX: 1, duration: 8 },
        0,
      );
      studies.forEach((study) => {
        const el = root.querySelector<HTMLElement>(
          `[data-study="${study.id}"]`,
        )!;
        // Short progressive group windows keep mobile density below ten studies.
        const start = 0.05 + (study.start / 1.08) * 1.8;
        const visible = mobile ? 0.25 : 0.43;
        const x = mobile ? 50 + Math.cos(study.slot * 1.3) * 30 : study.x;
        const y = mobile ? 43 + Math.sin(study.slot * 1.3) * 19 : study.y;
        tl.fromTo(
          el,
          {
            left: `${study.enterX}%`,
            top: `${study.enterY}%`,
            xPercent: -50,
            yPercent: -50,
            scale: 0.25,
            rotation: study.rotate - 30,
            autoAlpha: 0,
          },
          {
            left: `${x}%`,
            top: `${y}%`,
            scale: study.depth,
            rotation: study.rotate,
            autoAlpha: 1,
            duration: 0.2,
          },
          start,
        ).to(
          el,
          {
            left: mobile ? '50%' : '64%',
            top: '60%',
            scale: 0.1,
            rotation: study.rotate + 40,
            autoAlpha: 0,
            duration: 0.18,
          },
          start + visible,
        );
      });
      [0, 6, 11, 17, 22, 27].forEach((index, order) => {
        const study = studies[index];
        const el = root.querySelector<HTMLElement>(
          `[data-study="${study.id}"]`,
        )!;
        tl.fromTo(
          el,
          {
            left: `${mobile ? 15 + order * 14 : 43 + order * 9}%`,
            top: '32%',
            scale: 0.55,
            rotation: -24 + order * 9,
            autoAlpha: 0,
          },
          { autoAlpha: 1, duration: 0.18, immediateRender: false },
          2.35 + order * 0.03,
        ).to(
          el,
          {
            left: mobile ? '50%' : '69%',
            top: '62%',
            scale: 0.08,
            rotation: 30,
            autoAlpha: 0,
            duration: 0.5,
          },
          2.8 + order * 0.04,
        );
      });
      const reveal = (name: string, start: number, duration: number) =>
        tl.fromTo(
          layer(name),
          { autoAlpha: 0, yPercent: 12, scale: 0.86 },
          { autoAlpha: 1, yPercent: 0, scale: 1, duration },
          start,
        );
      reveal('mortar', 2.1, 0.6);
      tl.to(
        layer('pestle'),
        { yPercent: 20, rotation: -12, duration: 0.22, repeat: 3, yoyo: true },
        3.05,
      );
      reveal('fragments', 3.25, 0.2);
      tl.to(
        layer('fragments'),
        { yPercent: 110, scale: 0.3, autoAlpha: 0, duration: 0.65 },
        3.7,
      );
      tl.to(
        layer('mortar'),
        { autoAlpha: 0, yPercent: -12, duration: 0.4 },
        3.9,
      );
      reveal('receiver', 4.0, 0.4);
      reveal('pourer', 4.0, 0.4);
      reveal('stream', 4.15, 0.3);
      tl.fromTo(
        layer('fill'),
        { height: '8%', backgroundColor: '#244a31' },
        {
          height: '56%',
          backgroundColor: '#071a13',
          duration: 0.85,
        },
        4.2,
      );
      tl.to(
        layer('stream'),
        { autoAlpha: 0, scaleY: 0.1, duration: 0.22 },
        4.85,
      );
      tl.fromTo(
        layer('stream'),
        { height: mobile ? '30.5%' : '46.6%' },
        {
          height: mobile ? '17.1%' : '27.4%',
          duration: 0.85,
          immediateRender: false,
        },
        4.2,
      );
      tl.to(
        [layer('receiver'), layer('pourer')],
        { autoAlpha: 0, duration: 0.35 },
        4.95,
      );
      reveal('copper', 5.0, 0.4);
      tl.fromTo(
        layer('ripples'),
        { rotation: 0, scale: 0.85, opacity: 0.1 },
        { rotation: 65, scale: 1.04, opacity: 0.7, duration: 0.9 },
        5.2,
      );
      tl.to(layer('copper'), { autoAlpha: 0, scale: 0.9, duration: 0.3 }, 6.0);
      reveal('pourer', 6.1, 0.25);
      reveal('receiver', 6.1, 0.25);

      reveal('stream', 6.2, 0.2);
      tl.fromTo(
        layer('fill'),
        { height: '8%' },
        { height: '50%', duration: 0.65 },
        6.2,
      );
      tl.fromTo(
        layer('stream'),
        { height: mobile ? '30.5%' : '46.6%' },
        {
          height: mobile ? '18.9%' : '30.2%',
          duration: 0.65,
          immediateRender: false,
        },
        6.2,
      );
      reveal('drop', 6.6, 0.1);
      tl.to(
        layer('drop'),
        { yPercent: 100, autoAlpha: 0, duration: 0.25 },
        6.7,
      );
      tl.to(
        [layer('receiver'), layer('stream'), layer('copper'), layer('pourer')],
        { autoAlpha: 0, duration: 0.32 },
        6.95,
      );
      reveal('product', 7.05, 0.6);
      const claim = root.querySelector('.botanical-claim')!;
      tl.fromTo(
        claim,
        { opacity: 0, y: 24, filter: 'blur(5px)' },
        { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.45 },
        7.25,
      );
      tl.fromTo(
        root.querySelector('.botanical-cta'),
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.25 },
        7.65,
      );
      [0, 5, 20].forEach((index, order) => {
        const study = studies[index];
        const el = root.querySelector<HTMLElement>(
          `[data-study="${study.id}"]`,
        )!;
        const x = mobile ? [25, 76, 80][order] : [61, 84, 88][order];
        tl.fromTo(
          el,
          {
            left: `${x}%`,
            top: '85%',
            scale: 0.25,
            rotation: -15 + order * 13,
            autoAlpha: 0,
          },
          {
            autoAlpha: 1,
            scale: mobile ? 0.62 : 0.8,
            duration: 0.4,
            immediateRender: false,
          },
          7.22 + order * 0.08,
        );
      });
      // Explicit duration aligns the last composition with the end of natural document scrolling.
      tl.to({}, { duration: 0.01 }, 8);
      steps.forEach((step, index) =>
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
        captions.forEach((copy, index) => {
          steps[index].append(copy);
          copy.inert = false;
          copy.removeAttribute('aria-hidden');
        });
        preload.disconnect();
        captionLayer.remove();
        stage.setAttribute('aria-hidden', 'true');
        delete root.dataset.progress;
        gsap.set(elements, { clearProps: 'all' });
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
