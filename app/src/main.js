// Vice Cover Studio editor wiring: photos, panels, layouts, grades, lettering,
// undo/redo, drag-to-pan and PNG export. Photos are read on this machine only
// and never uploaded anywhere.
import { drawCover, exportCoverPng, layoutPanels, PANEL_COUNT, SIZES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('preview');
const titleInput = document.getElementById('title');
const subtitleInput = document.getElementById('subtitle');
const zoomInput = document.getElementById('zoom');
const statusEl = document.getElementById('status');

export const state = {
  layout: 'hero3',
  grade: 'sunset',
  size: '1080x1080',
  title: 'NEON SHORE',
  subtitle: 'a Vice City story',
  photos: [],
  panels: [
    { photo: -1, zoom: 1, ox: 0, oy: 0 },
    { photo: -1, zoom: 1, ox: 0, oy: 0 },
    { photo: -1, zoom: 1, ox: 0, oy: 0 },
    { photo: -1, zoom: 1, ox: 0, oy: 0 },
  ],
  selected: 0,
};

const undoStack = [];
const redoStack = [];
let fontsReady = false;

function snapshot() {
  return JSON.stringify({
    layout: state.layout, grade: state.grade, title: state.title,
    subtitle: state.subtitle, panels: state.panels, selected: state.selected,
  });
}
function restore(json) {
  const s = JSON.parse(json);
  Object.assign(state, s);
  titleInput.value = state.title;
  subtitleInput.value = state.subtitle;
  zoomInput.value = Math.round((state.panels[state.selected]?.zoom ?? 1) * 100);
  syncButtons();
}
/** Pushes the current state onto the undo stack before a change. */
export function commitChange() {
  undoStack.push(snapshot());
  if (undoStack.length > 40) undoStack.shift();
  redoStack.length = 0;
}
export function undo() {
  if (!undoStack.length) return;
  redoStack.push(snapshot());
  restore(undoStack.pop());
  redraw();
}
export function redo() {
  if (!redoStack.length) return;
  undoStack.push(snapshot());
  restore(redoStack.pop());
  redraw();
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}
export async function loadImageFile(file) {
  return loadImage(URL.createObjectURL(file));
}

/** Redraws the live preview at the current aspect, keeping the canvas sharp. */
export function redraw() {
  const [w, h] = SIZES[state.size] ?? SIZES['1080x1080'];
  const scale = Math.min(1080 / w, 1080 / h);
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  drawCover(canvas, state);
  const n = state.photos.length;
  const filled = state.panels.filter((p) => p.photo >= 0).length;
  statusEl.textContent = n === 0
    ? 'Load a photo to begin — or try a sample.'
    : `${n} photo${n > 1 ? 's' : ''} loaded · ${filled} of ${PANEL_COUNT[state.layout]} panels filled · panel ${state.selected + 1} selected`;
}

function syncButtons() {
  document.querySelectorAll('#layouts button').forEach((b) => b.classList.toggle('on', b.dataset.layout === state.layout));
  document.querySelectorAll('#grades button').forEach((b) => b.classList.toggle('on', b.dataset.grade === state.grade));
  document.querySelectorAll('#sizes button').forEach((b) => b.classList.toggle('on', b.dataset.size === state.size));
}

/** Assigns a photo to a panel, or to every panel when index is -1. */
export function assignPhoto(photoIndex, panelIndex = -1) {
  commitChange();
  if (panelIndex === -1) {
    state.panels.forEach((p) => { p.photo = photoIndex; });
  } else {
    state.panels[panelIndex] = { ...state.panels[panelIndex], photo: photoIndex };
  }
  redraw();
}

async function addFiles(files) {
  const fresh = [];
  for (const file of files) {
    try { fresh.push(await loadImageFile(file)); } catch { /* skip unreadable files */ }
  }
  if (!fresh.length) { statusEl.textContent = 'That file could not be read as a photo.'; return; }
  const firstIndex = state.photos.length;
  state.photos.push(...fresh);
  if (state.panels.every((p) => p.photo < 0)) {
    state.panels.forEach((p) => { p.photo = firstIndex; });
  }
  redraw();
}

async function addSample(name) {
  const img = await loadImage(`./samples/${name}.jpg`);
  const firstIndex = state.photos.length;
  state.photos.push(img);
  if (state.panels.every((p) => p.photo < 0)) {
    state.panels.forEach((p) => { p.photo = firstIndex; });
  } else {
    state.panels[state.selected].photo = firstIndex;
  }
  redraw();
}

document.getElementById('photos').addEventListener('change', (e) => addFiles([...e.target.files]));
document.getElementById('fillAll').addEventListener('click', () => {
  if (!state.photos.length) { statusEl.textContent = 'Add a photo first, then fill all panels with it.'; return; }
  assignPhoto(0);
  statusEl.textContent = 'All panels filled with photo 1 — click a panel to give it a different photo.';
});
document.getElementById('sampleBoulevard').addEventListener('click', () => addSample('boulevard'));
document.getElementById('samplePier').addEventListener('click', () => addSample('pier'));

document.getElementById('layouts').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-layout]');
  if (!b) return;
  commitChange();
  state.layout = b.dataset.layout;
  state.selected = 0;
  syncButtons();
  redraw();
});
document.getElementById('grades').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-grade]');
  if (!b) return;
  commitChange();
  state.grade = b.dataset.grade;
  syncButtons();
  redraw();
});
document.getElementById('sizes').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-size]');
  if (!b) return;
  state.size = b.dataset.size;
  syncButtons();
  redraw();
});
titleInput.addEventListener('input', () => { state.title = titleInput.value; redraw(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); });
titleInput.addEventListener('change', commitChange);
subtitleInput.addEventListener('change', commitChange);
zoomInput.addEventListener('input', () => {
  state.panels[state.selected].zoom = zoomInput.value / 100;
  redraw();
});
zoomInput.addEventListener('change', commitChange);
document.getElementById('undo').addEventListener('click', undo);
document.getElementById('redo').addEventListener('click', redo);
document.getElementById('shuffle').addEventListener('click', () => {
  commitChange();
  const count = PANEL_COUNT[state.layout];
  const used = state.panels.slice(0, count).map((p) => p.photo);
  for (let i = used.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [used[i], used[j]] = [used[j], used[i]];
  }
  used.forEach((photo, i) => { state.panels[i].photo = photo; });
  redraw();
});

// Drag a panel to pan its photo; wheel over a panel zooms it; click selects it.
let drag = null;
function panelAt(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = (clientX - rect.left) / rect.width * canvas.width;
  const y = (clientY - rect.top) / rect.height * canvas.height;
  const panels = layoutPanels(state.layout, canvas.width, canvas.height);
  for (let i = panels.length - 1; i >= 0; i--) {
    const p = panels[i];
    if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) return i;
  }
  return -1;
}
canvas.addEventListener('pointerdown', (e) => {
  const i = panelAt(e.clientX, e.clientY);
  if (i < 0) return;
  state.selected = i;
  zoomInput.value = Math.round((state.panels[i].zoom ?? 1) * 100);
  drag = { panel: i, x: e.clientX, y: e.clientY, committed: false };
  canvas.setPointerCapture(e.pointerId);
  redraw();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const rect = canvas.getBoundingClientRect();
  const panel = state.panels[drag.panel];
  const dx = (e.clientX - drag.x) / rect.width;
  const dy = (e.clientY - drag.y) / rect.height;
  if (!drag.committed && (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01)) { commitChange(); drag.committed = true; }
  panel.ox = Math.max(-0.6, Math.min(0.6, (panel.ox ?? 0) + dx));
  panel.oy = Math.max(-0.6, Math.min(0.6, (panel.oy ?? 0) + dy));
  drag.x = e.clientX;
  drag.y = e.clientY;
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('wheel', (e) => {
  const i = panelAt(e.clientX, e.clientY);
  if (i < 0) return;
  e.preventDefault();
  const panel = state.panels[i];
  panel.zoom = Math.max(1, Math.min(2.6, (panel.zoom ?? 1) * (e.deltaY < 0 ? 1.08 : 0.92)));
  zoomInput.value = Math.round(panel.zoom * 100);
  redraw();
}, { passive: false });

document.getElementById('export').addEventListener('click', async () => {
  statusEl.textContent = 'Exporting…';
  const blob = await exportCoverPng(state, state.size);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `vice-cover-${state.size}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  statusEl.textContent = `Saved vice-cover-${state.size}.png (${(blob.size / 1024).toFixed(0)} KiB) — share it!`;
});

// A `?shot=` query sets up a fixed scene for a screenshot instead of the editor.
const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  runShot(shot, params, { state, loadImage, addSample, redraw });
} else {
  document.fonts.load('16px Anton').then(() => document.fonts.load('16px Pacifico')).then(() => {
    fontsReady = true;
    redraw();
  });
  redraw();
}
export { fontsReady };
