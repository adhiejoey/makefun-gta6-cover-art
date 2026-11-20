// Vice Cover Studio cover engine: turns photos + a caption into a multi-panel
// GTA-style poster cover on a 2D canvas. All art is drawn here from scratch —
// panels, sunset/neon grades, Anton title lettering with a Pacifico subtitle,
// grain and vignette. No Rockstar artwork, logo or font is used anywhere.

export const LAYOUTS = ['hero3', 'grid4', 'strip', 'tilted'];
export const GRADES = ['sunset', 'neon', 'gold', 'teal', 'noir'];
export const SIZES = { '1080x1080': [1080, 1080], '1080x1350': [1080, 1350], '1920x1080': [1920, 1080] };
export const PANEL_COUNT = { hero3: 4, grid4: 4, strip: 4, tilted: 3 };

export const GRADE_STYLE = {
  sunset: { top: '#ff9a3c', mid: '#ff5e62', deep: '#c2187b', wash: '#ff2e88', accent: '#ffd76a', sky: ['#2b1055', '#ff7a18', '#ff2e88'] },
  neon: { top: '#ff2ea6', mid: '#7a2eff', deep: '#12082e', wash: '#00e5ff', accent: '#00e5ff', sky: ['#0b0616', '#3b0a6e', '#ff2ea6'] },
  gold: { top: '#ffd76a', mid: '#ff9a3c', deep: '#7a2e00', wash: '#ffb347', accent: '#fff3c4', sky: ['#3a1c00', '#ff7a18', '#ffd76a'] },
  teal: { top: '#2affd5', mid: '#00b3c8', deep: '#ff4d6d', wash: '#2affd5', accent: '#2affd5', sky: ['#062a33', '#00b3c8', '#ff4d6d'] },
  noir: { top: '#e8e8e8', mid: '#9a9ab0', deep: '#14141f', wash: '#8a8aa0', accent: '#ffffff', sky: ['#000000', '#2a2a3a', '#55556e'] },
};

/** Panel rectangles (cover coordinates) for a layout at W x H. Title band height is H * 0.2. */
export function layoutPanels(layout, W, H) {
  const g = Math.max(4, Math.round(W * 0.012));
  const titleH = H * 0.2;
  const bodyH = H - titleH;
  if (layout === 'hero3') {
    const heroW = Math.round(W * 0.6);
    const colX = heroW + g;
    const colW = W - colX - g;
    const cellH = (bodyH - 4 * g) / 3;
    return [
      { x: g, y: g, w: heroW - g, h: bodyH - 2 * g, rot: 0 },
      { x: colX, y: g, w: colW, h: cellH, rot: 0 },
      { x: colX, y: g + cellH + g, w: colW, h: cellH, rot: 0 },
      { x: colX, y: g + 2 * (cellH + g), w: colW, h: cellH, rot: 0 },
    ];
  }
  if (layout === 'grid4') {
    const cellW = (W - 3 * g) / 2;
    const cellH = (bodyH - 3 * g) / 2;
    return [
      { x: g, y: g, w: cellW, h: cellH, rot: 0 },
      { x: g + cellW + g, y: g, w: cellW, h: cellH, rot: 0 },
      { x: g, y: g + cellH + g, w: cellW, h: cellH, rot: 0 },
      { x: g + cellW + g, y: g + cellH + g, w: cellW, h: cellH, rot: 0 },
    ];
  }
  if (layout === 'strip') {
    const heroH = (bodyH - 3 * g) * 0.64;
    const stripY = g + heroH + g;
    const stripH = bodyH - stripY - g;
    const cellW = (W - 4 * g) / 3;
    return [
      { x: g, y: g, w: W - 2 * g, h: heroH, rot: 0 },
      { x: g, y: stripY, w: cellW, h: stripH, rot: 0 },
      { x: g + cellW + g, y: stripY, w: cellW, h: stripH, rot: 0 },
      { x: g + 2 * (cellW + g), y: stripY, w: cellW, h: stripH, rot: 0 },
    ];
  }
  // tilted: three overlapping snapshots on a sunset sky, title across the top.
  const pw = W * 0.34;
  const ph = H * 0.56;
  const cy = H * 0.36;
  return [
    { x: W * 0.06, y: cy - ph * 0.06, w: pw, h: ph, rot: -0.1 },
    { x: W * 0.33, y: cy, w: pw, h: ph, rot: 0.03 },
    { x: W * 0.6, y: cy - ph * 0.04, w: pw, h: ph, rot: 0.09 },
  ];
}

/** Draws one photo into a panel rect, cover-fit, with per-panel zoom and pan. */
export function drawPhotoInto(ctx, img, rect, panel) {
  const zoom = panel.zoom ?? 1;
  const scale = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight) * zoom;
  const pw = img.naturalWidth * scale;
  const ph = img.naturalHeight * scale;
  const dx = rect.x + (rect.w - pw) / 2 + (panel.ox ?? 0) * rect.w;
  const dy = rect.y + (rect.h - ph) / 2 + (panel.oy ?? 0) * rect.h;
  ctx.drawImage(img, dx, dy, pw, ph);
}

/** Sunset / neon colour grade over one panel rect. */
export function applyGrade(ctx, rect, gradeName) {
  const g = GRADE_STYLE[gradeName] ?? GRADE_STYLE.sunset;
  const tint = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  tint.addColorStop(0, 'rgba(255, 154, 60, 0)');
  tint.addColorStop(0.55, g.mid + '22');
  tint.addColorStop(1, g.deep + '66');
  ctx.fillStyle = tint;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = g.wash;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
  const glow = ctx.createRadialGradient(
    rect.x + rect.w * 0.7, rect.y + rect.h * 0.15, 0,
    rect.x + rect.w * 0.7, rect.y + rect.h * 0.15, rect.w * 0.9,
  );
  glow.addColorStop(0, g.top + '30');
  glow.addColorStop(1, g.top + '00');
  ctx.fillStyle = glow;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
}

let noiseCanvas = null;
/** A reusable film-grain tile, drawn with low alpha over the finished cover. */
export function grainTile() {
  if (noiseCanvas) return noiseCanvas;
  noiseCanvas = document.createElement('canvas');
  noiseCanvas.width = 128;
  noiseCanvas.height = 128;
  const nctx = noiseCanvas.getContext('2d');
  const data = nctx.createImageData(128, 128);
  let seed = 20261120;
  const next = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let i = 0; i < data.data.length; i += 4) {
    const v = Math.floor(next() * 255);
    data.data[i] = v; data.data[i + 1] = v; data.data[i + 2] = v; data.data[i + 3] = 255;
  }
  nctx.putImageData(data, 0, 0);
  return noiseCanvas;
}

/** Big Anton title + Pacifico subtitle over a dark scrim at the foot (or top for tilted). */
export function drawTitleBlock(ctx, W, H, title, subtitle, gradeName, layout) {
  const g = GRADE_STYLE[gradeName] ?? GRADE_STYLE.sunset;
  const titleH = H * 0.2;
  const top = layout === 'tilted' ? 0 : H - titleH;
  const scrim = ctx.createLinearGradient(0, top - H * 0.06, 0, top + titleH);
  scrim.addColorStop(0, 'rgba(12, 4, 24, 0)');
  scrim.addColorStop(0.45, 'rgba(12, 4, 24, 0.72)');
  scrim.addColorStop(1, 'rgba(12, 4, 24, 0.92)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, Math.max(0, top - H * 0.06), W, titleH + H * 0.06);

  const text = (title || 'UNTITLED').trim().toUpperCase();
  let size = titleH * 0.58;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const fit = () => {
    ctx.font = `${size}px Anton, sans-serif`;
    return ctx.measureText(text).width <= W * 0.92;
  };
  while (!fit() && size > 14) size -= 2;
  const cy = layout === 'tilted' ? titleH * 0.52 : H - titleH * 0.42;
  const grad = ctx.createLinearGradient(0, cy - size * 0.55, 0, cy + size * 0.55);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.55, '#ffd76a');
  grad.addColorStop(1, g.mid);
  ctx.save();
  ctx.translate(W / 2, cy);
  ctx.transform(1, 0, -0.06, 1, 0, 0);
  ctx.lineWidth = Math.max(2, size * 0.07);
  ctx.strokeStyle = '#160a26';
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(255, 46, 136, 0.55)';
  ctx.shadowBlur = size * 0.18;
  ctx.strokeText(text, 0, 0);
  ctx.fillStyle = grad;
  ctx.fillText(text, 0, 0);
  ctx.restore();

  const sub = (subtitle || '').trim();
  if (sub) {
    const subSize = Math.max(12, titleH * 0.2);
    ctx.font = `${subSize}px Pacifico, cursive`;
    ctx.fillStyle = g.accent;
    ctx.shadowColor = g.wash;
    ctx.shadowBlur = subSize * 0.5;
    const sy = layout === 'tilted' ? titleH * 0.92 : H - titleH * 0.86;
    ctx.fillText(sub, W / 2, sy);
    ctx.shadowBlur = 0;
  }
}

/** Draws the whole cover for a state onto a canvas of its own size. */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const grade = GRADE_STYLE[state.grade] ?? GRADE_STYLE.sunset;
  ctx.save();
  ctx.clearRect(0, 0, W, H);

  if (state.layout === 'tilted') {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, grade.sky[0]);
    sky.addColorStop(0.55, grade.sky[1]);
    sky.addColorStop(1, grade.sky[2]);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 4; i++) {
      ctx.save();
      ctx.translate(W * (0.15 + i * 0.22), 0);
      ctx.rotate(0.35);
      ctx.fillRect(0, -H * 0.2, W * 0.05, H * 1.4);
      ctx.restore();
    }
    ctx.restore();
    const sun = ctx.createRadialGradient(W * 0.5, H * 0.42, 0, W * 0.5, H * 0.42, W * 0.22);
    sun.addColorStop(0, '#fff3c4ee');
    sun.addColorStop(0.5, grade.top + 'aa');
    sun.addColorStop(1, grade.top + '00');
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, W, H);
  } else {
    ctx.fillStyle = '#160a26';
    ctx.fillRect(0, 0, W, H);
  }

  const panels = layoutPanels(state.layout, W, H);
  const border = Math.max(3, Math.round(W * 0.004));
  panels.forEach((orig, i) => {
    const panel = state.panels[i] ?? { photo: -1, zoom: 1, ox: 0, oy: 0 };
    const img = panel.photo >= 0 ? state.photos[panel.photo] : null;
    const rect = { ...orig };
    ctx.save();
    if (rect.rot) {
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate(rect.rot);
      ctx.translate(-rect.w / 2, -rect.h / 2);
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = W * 0.02;
      ctx.shadowOffsetY = W * 0.008;
      rect.x = 0;
      rect.y = 0;
    }
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    if (img) {
      if (state.grade === 'noir') ctx.filter = 'grayscale(1) contrast(1.12) brightness(1.05)';
      drawPhotoInto(ctx, img, rect, panel);
      ctx.filter = 'none';
      applyGrade(ctx, rect, state.grade);
    } else {
      const ph = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
      ph.addColorStop(0, grade.sky[1]);
      ph.addColorStop(1, grade.sky[2]);
      ctx.fillStyle = ph;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = `${Math.max(14, rect.w * 0.07)}px Anton, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ADD PHOTO', rect.x + rect.w / 2, rect.y + rect.h / 2);
    }
    ctx.restore();
    // White poster border, drawn in the panel's own (possibly rotated) frame.
    ctx.save();
    if (orig.rot) {
      ctx.translate(orig.x + orig.w / 2, orig.y + orig.h / 2);
      ctx.rotate(orig.rot);
      ctx.translate(-orig.w / 2, -orig.h / 2);
    }
    ctx.lineWidth = border;
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(
      (orig.rot ? 0 : orig.x) + border / 2,
      (orig.rot ? 0 : orig.y) + border / 2,
      orig.w - border,
      orig.h - border,
    );
    ctx.restore();
  });

  drawTitleBlock(ctx, W, H, state.title, state.subtitle, state.grade, state.layout);

  // Poster frame, grain and vignette finish the print.
  ctx.lineWidth = Math.max(3, W * 0.005);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.strokeRect(W * 0.008, H * 0.008, W * 0.984, H * 0.984);
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = ctx.createPattern(grainTile(), 'repeat');
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.38)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

/** Renders a state to a fresh canvas at the named export size. */
export function renderCoverToCanvas(state, sizeName) {
  const [w, h] = SIZES[sizeName] ?? SIZES['1080x1080'];
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  drawCover(canvas, state);
  return canvas;
}

/** Exports a state as a PNG blob at the named size. */
export function exportCoverPng(state, sizeName) {
  return new Promise((resolve) => {
    renderCoverToCanvas(state, sizeName).toBlob(resolve, 'image/png');
  });
}
