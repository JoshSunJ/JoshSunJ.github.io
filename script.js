// Small enhancements; the site works with JavaScript disabled.
document.getElementById('year').textContent = new Date().getFullYear();
const cards = document.querySelectorAll('details.project');
cards.forEach((card) => {
  card.addEventListener('toggle', () => {
    if (!card.open) return;
    cards.forEach((other) => { if (other !== card) other.open = false; });
  });
});

// Pointer effects run only with a mouse or trackpad and the user's motion preference.
const finePointer = window.matchMedia('(any-hover: hover) and (any-pointer: fine)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const motionToggle = document.querySelector('.motion-toggle');
let motionPreference = null;
try {
  const saved = localStorage.getItem('portfolio-motion');
  if (saved === 'on' || saved === 'off') motionPreference = saved;
} catch { /* Storage can be unavailable in private browsing. */ }
let removePointerEffects = () => {};

function syncPointerEffects() {
  removePointerEffects();
  removePointerEffects = () => {};
  const enabled = finePointer.matches && (motionPreference ? motionPreference === 'on' : !reducedMotion.matches);
  motionToggle.hidden = !finePointer.matches;
  motionToggle.setAttribute('aria-pressed', String(enabled));
  motionToggle.textContent = enabled ? 'MOTION ON' : 'MOTION OFF';
  document.documentElement.classList.toggle('pointer-motion-on', enabled);
  if (!enabled) return;

  const hero = document.querySelector('.hero');
  let frame = 0;
  let x = 0;
  let y = 0;
  let targetX = 0;
  let targetY = 0;

  function draw() {
    frame = 0;
    x += (targetX - x) * .18;
    y += (targetY - y) * .18;
    hero.style.setProperty('--pointer-x', `${x}px`);
    hero.style.setProperty('--pointer-y', `${y}px`);
    if (Math.abs(targetX - x) + Math.abs(targetY - y) > .5) {
      frame = requestAnimationFrame(draw);
    }
  }

  function move(event) {
    if (event.pointerType === 'touch') return;
    const bounds = hero.getBoundingClientRect();
    targetX = event.clientX - bounds.left;
    targetY = event.clientY - bounds.top;
    if (!hero.classList.contains('has-pointer')) {
      x = targetX;
      y = targetY;
      hero.classList.add('has-pointer');
    }
    if (!frame) frame = requestAnimationFrame(draw);
  }

  function reset() {
    hero.classList.remove('has-pointer');
    cancelAnimationFrame(frame);
    frame = 0;
  }

  function ripple(event) {
    if (event.pointerType === 'touch' || event.button !== 0) return;
    const previous = document.querySelectorAll('.pointer-ripple');
    if (previous.length >= 6) previous[0].remove();
    const ring = document.createElement('span');
    ring.className = 'pointer-ripple';
    ring.setAttribute('aria-hidden', 'true');
    ring.style.left = `${event.clientX}px`;
    ring.style.top = `${event.clientY}px`;
    ring.addEventListener('animationend', () => ring.remove(), { once: true });
    document.body.append(ring);
  }

  hero.addEventListener('pointermove', move, { passive: true });
  hero.addEventListener('pointerleave', reset);
  document.addEventListener('pointerdown', ripple, { passive: true });
  document.addEventListener('visibilitychange', reset);
  window.addEventListener('blur', reset);
  window.addEventListener('scroll', reset, { passive: true });
  window.addEventListener('resize', reset);

  removePointerEffects = () => {
    reset();
    hero.style.removeProperty('--pointer-x');
    hero.style.removeProperty('--pointer-y');
    hero.removeEventListener('pointermove', move);
    hero.removeEventListener('pointerleave', reset);
    document.removeEventListener('pointerdown', ripple);
    document.removeEventListener('visibilitychange', reset);
    window.removeEventListener('blur', reset);
    window.removeEventListener('scroll', reset);
    window.removeEventListener('resize', reset);
    document.querySelectorAll('.pointer-ripple').forEach((ring) => ring.remove());
  };
}

finePointer.addEventListener('change', syncPointerEffects);
reducedMotion.addEventListener('change', syncPointerEffects);
motionToggle.addEventListener('click', () => {
  motionPreference = motionToggle.getAttribute('aria-pressed') === 'true' ? 'off' : 'on';
  try { localStorage.setItem('portfolio-motion', motionPreference); } catch { /* The toggle still works without storage. */ }
  syncPointerEffects();
});
syncPointerEffects();
