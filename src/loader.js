// Startup: the FF Dev Studio lockup builds itself while the grid loads — slashes slice up, the Fs rise,
// the mark steps aside for the divider and DEV STUDIO — with a counter that chases the real progress.
// When everything is ready the black splits along the slash's own angle and parts over the grid.
import gsap from 'gsap';

export function loaderIntro({ reduced, titles, quick = false }) {
  const root = document.getElementById('loader');
  const $ = (s) => root.querySelector(s);
  const $$ = (s) => [...root.querySelectorAll(s)];
  const num = $('.ld-num'), bar = $('.loader-bar'), tick = $('.ld-tick');
  const all = $('.ld-all'), slashes = $$('.ld-s'), efs = $$('.ld-f'), div = $('.ld-div'), letters = $$('.ld-l');
  const chrome = $$('.ld-corner, .ld-count, .ld-ticker');

  // the seam runs at the slash's slope: 16 across for every 72 up
  const seam = () => root.style.setProperty('--seam', `${(((16 / 72) * innerHeight) / 2 / innerWidth) * 100}%`);
  seam(); addEventListener('resize', seam);

  // the counter chases the real progress, never jumps, and never outruns the build — both land together
  const shown = { p: 0 }; let target = 0;
  const build = gsap.timeline({ paused: true });
  const paint = () => { num.textContent = String(Math.round(shown.p * 100)).padStart(3, '0'); bar.style.transform = `scaleX(${shown.p})`; };
  const chase = () => { const goal = reduced ? target : Math.min(target, build.progress()); shown.p += Math.max(0, goal - shown.p) * 0.08; paint(); };
  gsap.ticker.add(chase);

  // project names flicker past while it loads
  let k = 0;
  const ticker = setInterval(() => { tick.textContent = titles[k++ % titles.length]; }, reduced ? 1e9 : 95);

  if (!reduced) {
    gsap.set(all, { x: 68 }); // the mark alone, centred in the lockup's box
    gsap.set([...slashes, ...efs], { y: 80 }); // below the viewBox, so clipped out
    gsap.set(div, { scaleY: 0, transformOrigin: '50% 50%' });
    gsap.set(letters, { y: 16 });
    gsap.set(chrome, { opacity: 0, y: 10 });
    build
      .to(chrome, { opacity: 1, y: 0, duration: 0.9, stagger: 0.05, ease: 'power3.out' }, 0)
      .to(slashes, { y: 0, duration: 0.95, stagger: 0.13, ease: 'expo.out' }, 0.1)
      .to(efs, { y: 0, duration: 0.95, stagger: 0.1, ease: 'expo.out' }, 0.38)
      .to(all, { x: 0, duration: 1.0, ease: 'expo.inOut' }, 0.95)
      .to(div, { scaleY: 1, duration: 0.6, ease: 'expo.out' }, 1.4)
      .to(letters, { y: 0, duration: 0.6, stagger: 0.04, ease: 'expo.out' }, 1.45);
    build.timeScale(quick ? 1.8 : 1.25);
  }
  root.classList.add('ld-go'); // initial states are set: show the pieces (CSS hides them until now, so nothing flashes)
  build.play();

  return {
    progress(p) { target = Math.max(target, Math.min(1, p)); },
    // wait for the build and the counter, then part the panels; onReveal fires as the lockup leaves
    async finish(onReveal) {
      target = 1;
      await build;
      await gsap.to(shown, { p: 1, duration: reduced ? 0 : 0.3, ease: 'power2.out', onUpdate: paint });
      gsap.ticker.remove(chase); clearInterval(ticker);
      tick.textContent = `${titles.length} projects`;
      if (reduced) {
        onReveal?.();
        await gsap.to(root, { opacity: 0, duration: 0.3 });
      } else {
        await new Promise((r) => setTimeout(r, quick ? 120 : 220));
        const out = gsap.timeline();
        out
          .to(letters, { y: -16, duration: 0.5, stagger: 0.025, ease: 'expo.in' }, 0)
          .to(div, { scaleY: 0, duration: 0.45, ease: 'expo.in' }, 0.1)
          .to([...efs].reverse(), { y: -80, duration: 0.55, stagger: 0.06, ease: 'expo.in' }, 0.15)
          .to([...slashes].reverse(), { y: -80, duration: 0.55, stagger: 0.06, ease: 'expo.in' }, 0.25)
          .to(chrome, { opacity: 0, duration: 0.4, ease: 'power2.in' }, 0.2)
          .add(() => onReveal?.(), 0.05) // the grid starts its own intro under the panels, so they part onto it
          .to('.ld-panel--a', { xPercent: -102, duration: 1.2, ease: 'expo.inOut' }, 0.55)
          .to('.ld-panel--b', { xPercent: 102, duration: 1.2, ease: 'expo.inOut' }, 0.55);
        await out;
      }
      removeEventListener('resize', seam);
      root.classList.add('is-done');
      root.remove();
    },
  };
}
