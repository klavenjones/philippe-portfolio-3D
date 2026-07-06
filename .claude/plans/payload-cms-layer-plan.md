# Payload CMS Layer for the 3D Gallery Portfolio

## Context

The 3D virtual gallery (Three.js + GSAP) is live, but all content is hardcoded in `lib/gallery/artworks.ts`. The artist (non-technical) needs to manage content himself. Decision: **Payload CMS 3 mounted inside this Next.js app** (admin UI at `/admin`) — chosen over hosted CMSs to keep everything in this site. Stack: **Vercel + Neon Postgres + Vercel Blob**; edits go live within ~1 minute via ISR revalidation.

**Editable by the artist (confirmed):** artworks CRUD (image upload, title, year, medium, dimensions, category), Site Settings (artist name, bio, contact email), drag-to-reorder + optional left/right wall override, and **frame color per individual artwork**.

## Compatibility (investigated — main risk resolved)

- Payload **≥3.73** officially supports Next 16 incl. Turbopack dev + build; floor is Next 16.2.6 (we're on 16.2.10). Pin `payload` + all `@payloadcms/*` to the same ^3.73.
- Contingency if the modified Next rejects `withPayload()`: inspect its output; if a `webpack` key appears, drop it and replicate the rest manually (`serverExternalPackages: ['pino','pino-pretty','sharp','pg']`, etc. per `node_modules/@payloadcms/next/dist/withPayload.js`).
- This Next fork requires a 2nd arg on `revalidateTag` — avoid it; use **`revalidatePath('/')`** in Payload afterChange/afterDelete hooks.

## Dependencies

```
pnpm add payload@^3.73 @payloadcms/next@^3.73 @payloadcms/db-postgres@^3.73 \
  @payloadcms/richtext-lexical@^3.73 @payloadcms/ui@^3.73 \
  @payloadcms/storage-vercel-blob@^3.73 sharp graphql
```

`@payloadcms/db-postgres` (plain node-postgres + Neon pooled connection string) over the vercel-postgres adapter — works identically locally and on Vercel. `sharp` gives width/height on upload (feeds hung-size math).

## File changes

**New Payload scaffold** (copy from payload 3.x `templates/blank`):
- `app/(payload)/layout.tsx`, `app/(payload)/admin/[[...segments]]/page.tsx` + `not-found.tsx`, `app/(payload)/admin/importMap.js` (generated), `app/(payload)/api/[...slug]/route.ts`, `app/(payload)/custom.scss`
- `payload.config.ts` (root), `payload-types.ts` (generated)
- Skip GraphQL routes.

**Move site into a route group** (Payload's layout is a root layout):
- `app/layout.tsx` → `app/(site)/layout.tsx`, `app/page.tsx` → `app/(site)/page.tsx`, `app/globals.css` → `app/(site)/globals.css`. Delete top-level `app/layout.tsx` (two root layouts = build error otherwise). `app/favicon.ico` stays.

**New CMS glue:**
- `lib/cms/collections/{Artworks,Media,Users}.ts`, `lib/cms/globals/SiteSettings.ts`
- `lib/cms/hooks/revalidateGallery.ts` — `revalidatePath('/')` unless `req.context.disableRevalidate`
- `lib/cms/mapArtworks.ts` — CMS docs → existing `Artwork[]` shape + layout (the load-bearing math)
- `lib/cms/getGalleryData.ts` — `getPayload({config})` + find/findGlobal + map
- `scripts/seed.ts`, `docs/cms.md`, `.env.example`

**Modify:** `next.config.ts` (wrap `withPayload`), `tsconfig.json` (`"@payload-config": ["./payload.config.ts"]`), `package.json` (payload scripts; Vercel build = `payload migrate && next build`), plus the props-threading refactor below.

## Schemas (payload.config.ts)

- **Users**: `auth: true`, no extra fields; first admin via built-in first-user screen at `/admin`.
- **Media**: `upload: { mimeTypes: ['image/*'] }`, `alt` text required; width/height/url stored automatically; revalidate hook.
- **Artworks**: `orderable: true` (built-in drag-to-reorder via `_order`), `defaultSort: '_order'`, `useAsTitle: 'title'`. Fields: `title` (text, req), `image` (upload→media, req), `year` (number, req), `medium` (text, req), `dimensions` (text, opt, plain-language description), `category` (select intro/oils/food-and-shoes/drawings, default drawings), `wall` (select auto/left/right, default auto, sidebar), `frameColor` (text, opt, hex-validated — "leave empty for default: black for drawings, walnut for paintings"), `displayMaxDim` (number, opt, sidebar, advanced). Hooks: revalidateGallery on change/delete.
- **SiteSettings global**: `artistName` (req), `bioText` (textarea, req), `contactEmail` (email, req); revalidate hook.
- Blob plugin: `vercelBlobStorage({ enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN), collections: { media: true }, clientUploads: true })` — disabled token = local disk fallback for dev.

## Mapping rules (lib/cms/mapArtworks.ts)

1. **Slot**: stable-partition `intro` docs first, else keep `_order`; `slot = index`.
2. **Wall**: override if not `'auto'`, else `slot % 2 === 0 ? 'left' : 'right'` (reproduces current layout exactly).
3. **Size**: `maxDim = displayMaxDim ?? {intro:1.2, oils:1.4, 'food-and-shoes':1.3, drawings:1.2}[category]`; scale so longest side = maxDim from image aspect; round 2dp. Matches all 13 current entries (Family Portrait needs `displayMaxDim: 1.4` in seed).
4. **frameColor**: `doc.frameColor || (drawings ? '#000000' : '#3d2b1f')` — matches user's recent black-drawing-frames change.
5. **src**: `image.url` (Blob URL).
6. **Layout** (replaces hardcoded 15 slots): `slotCount = count+2`; `hallEndZ = -(slotCount*5 + 3)` (13 → −78 ✓); `cameraEndZ = hallEndZ+4` (→ −74 ✓); `spacerVh` scaled ~19.2vh/m (13 → 1500 ✓).
7. Sections computed but **not rendered** — labels stay commented out (user's choice); keep current `COLORS.mat` (0x333333) as-is.

## Data flow refactor

`app/(site)/page.tsx` becomes async → `getGalleryData()` → passes `{artworks, settings, layout}` props → `GalleryShell` → `createGalleryExperience(canvas, spacer, callbacks, data)` → threads into `buildRoom(scene, layout)`, `buildFrames(scene, renderer, data)` (per-artwork frame material, cache material per unique hex; bio/contact from settings), `createScrollCamera({spacer, artworks, layout, …})`, `createInteractions({…, artworks})` (Map from props replaces `artworkById` import; fix line-64 hardcoded `-slot*5` → `slotZ(slot)` while touching). `OverlayUI`/`DetailPanel`/`FallbackGallery` get props. `constants.ts` keeps static values; endZ/spacer move to computed layout. Add `export const revalidate = 3600` on the page as safety net.

## Seed script (scripts/seed.ts, `pnpm payload run scripts/seed.ts`)

Abort if artworks count > 0. `updateGlobal` site-settings with current values, then for each legacy `ARTWORKS` entry in slot order: `payload.create` media from `public/images/...` file (uploads to Blob, sharp records dims), then create artwork (`wall:'auto'`, Family Portrait `displayMaxDim:1.4`), all with `context: { disableRevalidate: true }`. Sequential creates preserve order.

## Env / local dev (.env.example)

```
DATABASE_URL=postgresql://...-pooler.../neondb?sslmode=require   # Neon pooled
PAYLOAD_SECRET=<openssl rand -hex 32>
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...   # optional locally (disk fallback)
```
Local dev: Neon `development` branch (free, no Docker); document local Postgres alternative. Dev uses drizzle push; before first deploy `payload migrate:create initial`; Vercel build command `pnpm payload migrate && pnpm build`; `DATABASE_URL` required at build time (prerender uses local API).

## docs/cms.md

1. Artist guide (plain language): log in at `/admin`; add/edit artworks, drag to reorder walk-through, pick frame color; Site Settings for name/bio/email; changes live within ~1 minute.
2. First admin user creation. 3. Developer setup: env, Neon branch, seed, generate:types/importmap, migrations, Vercel config.

## Commit sequence

1. Install Payload + scaffold `(payload)` group, move site to `(site)` group — **gate: `pnpm build` passes with Turbopack; /admin loads**.
2. Artworks collection + SiteSettings global + revalidation hooks + migration.
3. Gallery reads from CMS: mapArtworks + props threading through experience (big refactor).
4. Per-artwork frame color + dynamic hall length.
5. Seed script + .env.example.
6. docs/cms.md.
7. Cleanup: delete legacy ARTWORKS array (keep types); optionally remove public/images after Blob verified.

## Verification

1. `pnpm build` after commit 1 (the go/no-go gate; apply §Compatibility contingency if needed).
2. `/admin`: create first user, upload image, confirm width/height + Blob URL.
3. Post-seed: site renders pixel-identical (slots, Family Portrait 1.4m, black drawing frames, walnut elsewhere, bio/contact).
4. Edit title in admin → `/` updates within 60s; repeat for reorder + settings.
5. **Blob CORS**: Three.js TextureLoader loads from `*.public.blob.vercel-storage.com` (should send ACAO:*); fallback = same-origin proxy route.
6. Reorder → walls re-alternate, camera path rebuilds; add a 14th artwork → hall lengthens, spacer grows, contact wall reachable.
7. Headless browser walkthrough (existing puppeteer-core scripts in scratchpad), lint + generate:types clean.

## Risks

- Modified Next 16 vs withPayload — mitigated (≥3.73 + contingency), tested in commit 1 before schema work.
- Blob CORS for WebGL textures — verification step 5, proxy fallback.
- Build-time DB dependency on Vercel — document env requirement.
- Two root layouts — delete `app/layout.tsx` or build fails.
