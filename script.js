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
const motionToggle = document.querySelector('.motion-toggle');
let motionPreference = null;
try {
  const saved = localStorage.getItem('portfolio-motion');
  if (saved === 'on' || saved === 'off') motionPreference = saved;
} catch { /* Storage can be unavailable in private browsing. */ }
let removePointerEffects = () => {};

function animatePortrait() {
  const scene = document.querySelector('.ascii-scene');
  const source = scene.querySelector('pre');
  const canvas = scene.querySelector('canvas');
  const context = canvas.getContext('2d');
  if (!context) return () => {};
  const base = document.createElement('canvas');
  const baseContext = base.getContext('2d');
  const wake = document.createElement('canvas');
  const wakeContext = wake.getContext('2d');
  if (!baseContext || !wakeContext) return () => {};
  const rows = source.textContent.split('\n');
  const columns = Math.max(...rows.map(row => row.length));
  let width, height, cellWidth, cellHeight, font, ink, pixelRatio;
  let frame = 0;
  let x = 0, y = 0, targetX = 0, targetY = 0;
  let strength = 0, targetStrength = 0, lastMove = 0;

  function drawBase() {
    context.clearRect(0, 0, width, height);
    // Copy at the native pixel scale to preserve the glyphs' antialiasing.
    context.drawImage(base, 0, 0, base.width / pixelRatio, base.height / pixelRatio);
  }

  function resize() {
    reset();
    const bounds = source.getBoundingClientRect();
    const style = getComputedStyle(source);
    width = bounds.width;
    height = bounds.height;
    cellWidth = width / columns;
    cellHeight = height / rows.length;
    font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    ink = style.color;
    pixelRatio = 2;
    for (const surface of [canvas, base, wake]) {
      surface.width = Math.ceil(width * pixelRatio);
      surface.height = Math.ceil(height * pixelRatio);
    }
    for (const ctx of [context, baseContext, wakeContext]) {
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      ctx.font = font;
      ctx.textBaseline = 'top';
      ctx.fillStyle = ink;
    }
    baseContext.globalAlpha = .9;
    // Use the same glyph positioning for the resting portrait and the ripple.
    rows.forEach((row, index) => {
      [...row].forEach((glyph, col) => {
        if (glyph !== ' ') baseContext.fillText(glyph, col * cellWidth, index * cellHeight);
      });
    });
    drawBase();
    scene.classList.add('is-animated');
  }

  function draw(now) {
    frame = 0;
    x += (targetX - x) * .16;
    y += (targetY - y) * .16;
    strength += (targetStrength - strength) * .12;
    drawBase();
    if (strength > .01) {
      const radius = 88;
      const firstRow = Math.max(0, Math.floor((y - radius - 8) / cellHeight));
      const lastRow = Math.min(rows.length - 1, Math.ceil((y + radius + 8) / cellHeight));
      const firstCol = Math.max(0, Math.floor((x - radius - 8) / cellWidth));
      const lastCol = Math.min(columns - 1, Math.ceil((x + radius + 8) / cellWidth));
      wakeContext.clearRect(0, 0, width, height);
      for (let row = firstRow; row <= lastRow; row++) {
        for (let col = firstCol; col <= lastCol; col++) {
          const glyph = rows[row][col];
          if (!glyph || glyph === ' ') continue;
          const gx = col * cellWidth, gy = row * cellHeight;
          const dx = gx - x, dy = gy - y;
          const distance = Math.hypot(dx, dy);
          const influence = Math.max(0, 1 - distance / radius) ** 2 * strength;
          const wave = Math.sin(distance / 12 - now / 130) * 6 * influence;
          wakeContext.globalAlpha = .9 + .1 * influence;
          wakeContext.fillText(glyph, gx + dx / (distance || 1) * wave,
            gy + dy / (distance || 1) * wave);
        }
      }
      // Feather both layers with the same circular mask; no rectangular seam.
      const blend = wakeContext.createRadialGradient(x, y, 0, x, y, radius);
      blend.addColorStop(0, '#000');
      blend.addColorStop(.45, '#000');
      blend.addColorStop(1, 'transparent');
      wakeContext.globalAlpha = 1;
      wakeContext.globalCompositeOperation = 'destination-in';
      wakeContext.fillStyle = blend;
      wakeContext.fillRect(0, 0, width, height);
      wakeContext.globalCompositeOperation = 'source-over';
      wakeContext.fillStyle = ink;
      context.globalCompositeOperation = 'destination-out';
      context.fillStyle = blend;
      context.fillRect(0, 0, width, height);
      // Add the complementary alpha weights without darkening the overlap.
      context.globalCompositeOperation = 'lighter';
      context.drawImage(wake, 0, 0, wake.width / pixelRatio, wake.height / pixelRatio);
      context.globalCompositeOperation = 'source-over';
      context.fillStyle = ink;
    }
    // Let the wake settle, then stop drawing until the next pointer movement.
    if (now - lastMove > 900) targetStrength = 0;
    if (targetStrength || strength > .01) frame = requestAnimationFrame(draw);
    else drawBase();
  }

  function move(event) {
    if (event.pointerType === 'touch') return;
    const bounds = scene.getBoundingClientRect();
    targetX = event.clientX - bounds.left;
    targetY = event.clientY - bounds.top;
    if (!frame && strength < .01) { x = targetX; y = targetY; }
    lastMove = performance.now();
    targetStrength = 1;
    if (!frame) frame = requestAnimationFrame(draw);
  }

  function leave() { targetStrength = 0; }
  function reset() {
    cancelAnimationFrame(frame);
    frame = 0;
    strength = targetStrength = 0;
    if (width) drawBase();
  }

  resize();
  const observer = new ResizeObserver(resize);
  observer.observe(source);
  scene.addEventListener('pointermove', move, { passive: true });
  scene.addEventListener('pointerleave', leave);
  window.addEventListener('scroll', reset, { passive: true });
  window.addEventListener('blur', reset);
  document.addEventListener('visibilitychange', reset);
  return () => {
    reset();
    observer.disconnect();
    scene.classList.remove('is-animated');
    scene.removeEventListener('pointermove', move);
    scene.removeEventListener('pointerleave', leave);
    window.removeEventListener('scroll', reset);
    window.removeEventListener('blur', reset);
    document.removeEventListener('visibilitychange', reset);
  };
}

function syncPointerEffects() {
  removePointerEffects();
  removePointerEffects = () => {};
  const enabled = finePointer.matches && motionPreference !== 'off';
  motionToggle.hidden = !finePointer.matches;
  motionToggle.setAttribute('aria-pressed', String(enabled));
  motionToggle.querySelector('.pressable-face').textContent = enabled ? 'MOTION ON' : 'MOTION OFF';
  document.documentElement.classList.toggle('pointer-motion-on', enabled);
  if (!enabled) return;

  const removePortraitAnimation = animatePortrait();
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
    removePortraitAnimation();
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
motionToggle.addEventListener('click', () => {
  motionPreference = motionToggle.getAttribute('aria-pressed') === 'true' ? 'off' : 'on';
  try { localStorage.setItem('portfolio-motion', motionPreference); } catch { /* The toggle still works without storage. */ }
  syncPointerEffects();
});
syncPointerEffects();
