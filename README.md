# Vice Cover Studio

[![make.fun](https://img.shields.io/badge/make.fun-bounty-blue)](https://make.fun)
[![make.fun](https://img.shields.io/badge/make.fun-gta6--cover--art--01-purple)](https://make.fun/c/gta6-cover-art-01)
[![make.fun](https://img.shields.io/badge/make.fun-adhiejoey-orange)](https://make.fun/r/mcpf7r82)

**Try it with my referral link: https://make.fun/r/mcpf7r82**

## What it does

Vice Cover Studio turns your photo and a caption into GTA-style cover art, right in your browser — no upload, no account, no network. Photos are read on your machine and never leave it.

- **Multi-panel posters** — four layouts: Hero + 3, Four panels, Big + strip, and Tilted snapshots. Fill several panels with one photo or give each panel its own.
- **Any photo, cropped your way** — click a panel to select it, drag to reposition the photo inside, scroll or slide to zoom. Every panel keeps its own crop and zoom.
- **Vice City grades** — Sunset, Neon night, Golden hour, Teal + pink, and Noir colour grades, plus film grain and a vignette finish.
- **Bold poster lettering** — a big Anton title with a sunset gradient and a neon Pacifico subtitle, both editable. All lettering is original; no Rockstar logo, artwork or font is used. Fonts ship under `app/fonts/` under the SIL Open Font License.
- **Fast and easy** — photo → cover in a few clicks, with undo/redo and a shuffle button. Export a PNG in **1080 × 1080**, **1080 × 1350**, or **1920 × 1080**.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

`app/` is plain static files — serve it with any static file server and `app/index.html` works offline in desktop Chrome.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library.

## License

MIT — see [LICENSE](LICENSE). Fonts in `app/fonts/` are under the SIL Open Font License 1.1 (see `app/fonts/OFL.txt`).
