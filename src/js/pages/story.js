import '../main.js';
import { gsap, $, onReady, reducedMotion } from '../core.js';
import { heroParticles } from '../three/gate.js';

heroParticles($('[data-particles]'), { beans: 10, leaves: 14, palette: ['#5f6b3d', '#a7b98d', '#c27a2c'] });

// Desktop: the timeline scrolls sideways while the section is pinned.
onReady(() => {
  if (reducedMotion) return;
  const mm = gsap.matchMedia();
  mm.add('(min-width: 900px)', () => {
    const section = $('[data-timeline]');
    const track = $('[data-timeline-track]');
    const bar = $('[data-timeline-progress]');
    const distance = () => Math.max(0, track.scrollWidth - innerWidth);
    gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${distance()}`,
        pin: true,
        scrub: 0.6,
        invalidateOnRefresh: true,
        onUpdate: (st) => (bar.style.transform = `scaleX(${st.progress})`),
      },
    });
    gsap.from('.t-card', { y: 60, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: section, start: 'top 70%' } });
  });
});
