# 3D Virtual Art Gallery — Philippe Previl Portfolio

## Context

Redesign philippeprevil.com as a single-page 3D virtual art gallery (Three.js + GSAP ScrollTrigger), styled after the Exhibbit-style museum walkthrough in the reference video: a realistic hall with white walls and framed artworks, camera glides through as the user scrolls, clicking an artwork focuses it and shows its info. Replaces the create-next-app boilerplate entirely.

**Confirmed with user:** one continuous gallery hall grouped by category with wall labels; self-portrait + drafted bio first; detail view shows title/year/medium only (no invented descriptions); single-page experience with contact at the end of the gallery.

## Assets (public/images/)

- `splash.jpg` 480×480 — self-portrait (oil)
- `oils/Papa_m_koupe_fre_m_2012.jpg` 362×480
- `food_and_shoes/Flaming_Hot_Cheetos_and_Red_Soda_2013.jpg` 480×480
- `drawings/` — 10 files, mostly portrait ~300×480; `Family_Portrait_2010.jpg` is landscape 640×381

Images are small (≤640px): hang them small (max dimension 1.2–1.4 m), clamp camera min distance ~1.6 m, enable anisotropy + mipmaps.

## Next.js 16.2.10 constraints (verified in node_modules/next/dist/docs/)

- Turbopack is the default bundler; config is a top-level `turbopack` key; custom webpack config breaks the build. No loaders needed for this plan.
- `dynamic(..., { ssr: false })` is only allowed **inside a Client Component**. Pattern: `app/page.tsx` stays a Server Component (exports metadata), renders a `"use client"` shell; all Three.js/GSAP work happens in effects, never at module scope during render.
- `metadata` exports only in Server Components — update the placeholder title/description in `app/layout.tsx`.
- Next 16 no longer overrides `scroll-behavior`; we rely on native scroll + ScrollTrigger `scrub`, so do NOT set `scroll-behavior: smooth`.
- Tailwind v4 CSS-first config (`@theme` in `app/globals.css`); lint is plain `eslint`.
- Three.js `TextureLoader` loads images straight from `/images/...` static URLs (no next/image on the canvas path).

## Stack

Vanilla Three.js (no react-three-fiber — static geometry + one animated camera; React is only a shell for lifecycle and DOM overlays). `pnpm add three gsap && pnpm add -D @types/three`.

At implementation start, invoke the `3d-web-experience` and `gsap-framer-scroll-animation` skills for current API guidance.

## File structure

```
app/
  layout.tsx                (existing — update metadata, keep font setup)
  page.tsx                  (Server Component: renders <GalleryShell/>)
  globals.css               (existing — body bg, overlay styles)
components/
  GalleryShell.tsx          ("use client": canvas mount, scroll spacer, lifecycle effect, WebGL detect)
  OverlayUI.tsx             (artist name, scroll hint, progress bar — fixed DOM, pointer-events-none)
  DetailPanel.tsx           (title/year/medium card + close button, React state)
  FallbackGallery.tsx       (semantic <ul> of artworks; rendered when no WebGL; also sr-only always)
lib/gallery/
  artworks.ts               (hand-written data for all 14 entries + BIO_TEXT, ARTIST_NAME, CONTACT, SECTIONS)
  constants.ts              (all scene numbers in one place)
  experience.ts             (GalleryExperience class: init(canvas, callbacks) / dispose(); only module React touches)
  scene.ts                  (renderer, camera, resize + DPR)
  room.ts                   (floor/walls/ceiling/lighting)
  frames.ts                 (framed-artwork factory + CanvasTexture wall labels/bio/contact planes)
  scrollCamera.ts           (camera path timeline + ScrollTrigger)
  interactions.ts           (raycaster clicks + detail-view state machine)
```

`Artwork` shape: `{ id, src, title, year, medium, category, px: [w,h], wall: "left"|"right", slot }`.

## Layering (GalleryShell)

1. `fixed inset-0 z-0` div with the canvas (`touch-action: pan-y`, no preventDefault — native mobile scroll passes through).
2. `height: 1500vh` scroll spacer div (`aria-hidden`) — the ScrollTrigger trigger, `start: "top top", end: "bottom bottom", scrub: 1, invalidateOnRefresh: true`.
3. `fixed inset-0 z-10 pointer-events-none` overlay; interactive children opt into `pointer-events-auto`.

Artwork clicks: pointerdown/up on canvas with <8 px movement threshold so scroll-drags never count as clicks.

## Scene (concrete numbers, meters)

Straight hall along −Z. Hall width 6 (walls x = ±3), height 4, length 82 (z +4 → −78). Camera: y 1.6, FOV 55, near 0.1, far 120. Artwork centers at y 1.6 (museum standard). 15 slots at `z_i = −i·5`:

- **Slot 0 (left wall)**: self-portrait hung 1.2×1.2 m + bio panel (1.4×1.0 m CanvasTexture, ~100-word bio) 1.8 m further down the same wall. Initial camera look-at points here — first thing seen, with a longer dwell (~first 12% of timeline).
- **Slot 1 (right)**: "Oils" label + *Papa m koupe fre m* (1.06×1.4 m).
- **Slot 2 (left)**: "Food and Shoes" label + *Flaming Hot Cheetos and Red Soda* (1.3×1.3 m).
- **Slots 3–12**: 10 drawings alternating right/left, "Drawings and Sketches" label at slot 3. Portrait pieces 1.2 m tall; the landscape one 1.4 m wide.
- **End wall (z −78)**: "Get in touch" — name + email as CanvasTexture scenery; a DOM `mailto:` link fades in over the last 10% of scroll (DOM handles the actual click).

Category labels: 0.5×0.25 m planes, CanvasTexture drawn at 4× resolution, mounted y 2.6.

**Draft bio (editable placeholder, goes in artworks.ts):**
> Philippe Previl is an experienced Graphic Artist with a demonstrated history of working in the food & beverages industry. Strong arts and design professional skilled in Photography, Printmaking, Graphics, Painting, and Murals.

## Frames & materials

- Art planes: `MeshBasicMaterial({ map })` — **unlit** for color fidelity; `SRGBColorSpace`, anisotropy `min(8, max)`, mipmaps.
- Drawings get a white mat plane (8 cm larger, 1 cm proud); every piece gets a dark-walnut `BoxGeometry` frame (w+0.12, h+0.12, 0.05) 2.5 cm off the wall. One shared frame material + one shared mat material.
- `userData.artworkId` on each group; flat `clickTargets: Mesh[]` (~14 meshes) for the raycaster. Total ≈50 draw calls.

## Lighting (cheap gallery look)

HemisphereLight (#ffffff / #b0aca4, 0.9) + one DirectionalLight (0.6, pos (2,6,2)), **no shadows, no per-artwork spotlights** (art is unlit). Walls `MeshStandardMaterial` #f4f2ee roughness 0.95; floor #c9b18a roughness 0.8; ceiling #ffffff. Optional polish: fake radial-gradient "spotlight pool" planes behind frames.

## Scroll camera

One GSAP timeline scrubbed by one ScrollTrigger. Two tweened proxy objects (`camPos`, `target`); render loop applies `camera.position.copy(camPos); camera.lookAt(target)`.

- Position: centerline x 0, y 1.6, z +4 → −74, one `ease: "none"` segment per slot (scrub 1 supplies the glide).
- Look-at: per slot, tween `target` to the artwork position — start turning ~4 m before the piece, hold ~1.5 m, then turn to the next. Opposite-wall alternation produces natural head-turns.
- Report `timeline.progress()` to React (throttled) for the progress bar. `prefers-reduced-motion`: `scrub: true` (no smoothing).

## Detail view (interactions.ts)

State machine `idle → focusing → detail → returning → idle`; clicks only in `idle`, close only in `detail`.

Open: save `scrollY` + camera transform → `scrollTrigger.disable(false)` + `body.overflow = "hidden"` → tween camera to artwork center + wall-normal × 1.9 m (clamp ≥1.6 m), 1.0 s `power2.inOut` → notify React → DetailPanel fades in (side card desktop, bottom sheet mobile; title, year, medium, category).

Close (button / backdrop / Escape): tween camera back (0.8 s) → restore overflow, `window.scrollTo(0, savedY)` **before** re-enabling ScrollTrigger, then `ScrollTrigger.update()` → idle. Desktop hover: pointermove raycast → `cursor: pointer`.

## Resize / DPR / cleanup

- DPR `min(devicePixelRatio, 2)`, cap 1.5 on coarse pointers.
- Debounced resize (~150 ms): camera aspect, renderer size, `ScrollTrigger.refresh()`; ignore height-only resizes on iOS (URL-bar collapse).
- `dispose()`: kill timeline/ScrollTrigger, cancel rAF, remove listeners, dispose geometries/materials/textures/renderer. Must be idempotent — React 19 StrictMode double-runs effects in dev.

## Accessibility / fallback

WebGL2 detect at init; on failure render `FallbackGallery` (semantic image list grouped by section, reuses artworks.ts). Same list always rendered `sr-only`; canvas `aria-hidden`. DetailPanel: focus close button on open, Escape closes.

## Implementation sequence (commits)

1. Deps + skeleton: artworks.ts, GalleryShell with canvas + spacer + colored-clear scene; strip boilerplate page; update metadata.
2. Room + lighting (temporary OrbitControls debug flag to inspect).
3. Frames + labels: all 14 works hung, section labels, bio panel, contact end wall.
4. Scroll camera: full scrubbed walkthrough, tune dwell timings.
5. Detail view: click/close/scroll-lock/restore.
6. Overlay UI + fallback + a11y + progress + scroll hint.
7. Polish: DPR caps, mobile touch pass, reduced-motion.

## Verification

- `pnpm dev` + browser (claude-in-chrome tools): scroll the full hall; camera faces each piece; click 2–3 artworks incl. the landscape drawing; close and confirm scroll position restores exactly; no console errors; resize mid-scroll.
- Mobile emulation: touch scroll moves camera, tap opens detail, no scroll bleed while detail open.
- Perf: 60 fps desktop scroll; StrictMode remount leaks nothing (dispose works).
- `pnpm build` passes (catches server-side `window` access under the modified Next.js).

## Risks

- Modified Next.js is the main unknown — mitigated by a tiny framework surface (one client component, static assets) and the doc findings above.
- 480px textures stay acceptable via small hung sizes + 1.6 m min distance; mild softness in detail view is accepted.
- Scroll-lock restore is the fiddliest part (ScrollTrigger re-enable ordering, iOS URL bar) — isolated in interactions.ts as its own commit.
