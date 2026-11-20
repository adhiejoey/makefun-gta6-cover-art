// Fixed scenes for screenshots: ?shot=cover draws one exported cover full-frame,
// ?shot=editor opens the editor with sample photos loaded. Both use the app's own
// drawing code, so the screenshots show exactly what the app makes.
import { drawCover, exportCoverPng, layoutPanels, SIZES } from './cover.js';

/** Runs a screenshot scene. `app` carries the editor state and helpers from main.js. */
export async function runShot(shot, params, app) {
  const { state, loadImage, redraw } = app;
  const caption = params.get('caption') || 'NEON SHORE';
  const subtitle = params.get('subtitle') || 'a Vice City story';
  const layout = params.get('layout') || 'hero3';
  const grade = params.get('grade') || 'sunset';
  const sizeName = params.get('size') || '1920x1080';
  state.title = caption;
  state.subtitle = subtitle;
  state.layout = layout;
  state.grade = grade;
  state.size = sizeName;

  await document.fonts.load('16px Anton');
  await document.fonts.load('16px Pacifico');

  const names = (params.get('photos') || params.get('photo') || 'boulevard').split(',');
  const loaded = [];
  for (const name of names) {
    try { loaded.push(await loadImage(`./samples/${name}.jpg`)); } catch { /* skip missing samples */ }
  }
  state.photos = loaded;
  state.panels.forEach((p, i) => {
    p.photo = loaded.length ? i % loaded.length : -1;
    p.zoom = 1; p.ox = 0; p.oy = 0;
  });
  // The hero panel gets the first photo; the rest share the second when there is one.
  if (loaded.length > 1) state.panels[0].photo = 0;
  // Wide panels crop a portrait photo's top and bottom: bias them toward the top
  // of the photo so faces stay in frame.
  const [sw, sh] = SIZES[sizeName] ?? SIZES['1920x1080'];
  layoutPanels(layout, sw, sh).forEach((rect, i) => {
    if (rect.w > rect.h * 2) state.panels[i].oy = 0.6;
  });

  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    const canvas = document.getElementById('preview');
    const [w, h] = SIZES[sizeName] ?? SIZES['1920x1080'];
    canvas.width = w;
    canvas.height = h;
    drawCover(canvas, state);
    // Prove the real export path works at full size, and leave its size in the DOM.
    const blob = await exportCoverPng(state, sizeName);
    document.body.dataset.exportBytes = String(blob.size);
    document.body.dataset.exportSize = sizeName;
    document.title = `Vice Cover Studio — exported ${sizeName} (${blob.size} bytes)`;
    window.__shotReady = true;
  } else {
    document.body.classList.add('shot-editor');
    const title = document.getElementById('title');
    const subtitleEl = document.getElementById('subtitle');
    if (title) title.value = state.title;
    if (subtitleEl) subtitleEl.value = state.subtitle;
    document.querySelectorAll('#layouts button').forEach((b) => b.classList.toggle('on', b.dataset.layout === state.layout));
    document.querySelectorAll('#grades button').forEach((b) => b.classList.toggle('on', b.dataset.grade === state.grade));
    document.querySelectorAll('#sizes button').forEach((b) => b.classList.toggle('on', b.dataset.size === state.size));
    redraw();
    document.body.dataset.editorReady = '1';
    window.__shotReady = true;
  }
}
