# Deploy the 3D Gallery + Payload CMS to Production

## Context

The 3D gallery with its Payload CMS layer is complete and verified locally. Deploy it to production so the artist can use it: **Vercel via GitHub integration** (repo `klavenjones/philippe-portfolio-3D` already exists, 3 commits behind local), **Neon Postgres via the Vercel Marketplace**, **Vercel Blob** for images. Launch on the `*.vercel.app` URL first; pointing philippeprevil.com is a later follow-up.

Current state: git push credentials work from this machine; no Vercel CLI needed (GitHub integration); no migration files exist yet (dev used drizzle schema push — production needs committed migrations).

## Division of labor

Account logins, dashboard clicks, and anything credential-shaped are **user steps** (exact clicks provided). Code prep, verification, and the production seed run are **Claude steps**.

## Phase 1 — Repo prep (Claude)

1. **Pin the migration directory**: in `payload.config.ts`, add `migrationDir: path.resolve(dirname, "migrations")` to the `postgresAdapter` args (default resolution already lands there, but make it explicit).
2. **Create the initial migration**: `pnpm payload migrate:create initial` → commits `migrations/` (SQL + index). Note: local dev keeps using schema push; migrations run only in the production build.
3. **vercel.json** at repo root so build config is committed rather than dashboard-configured:
   ```json
   { "buildCommand": "pnpm run ci" }
   ```
   (`ci` script already exists: `payload migrate && next build`. Use `pnpm run ci`, not `pnpm ci`.)
4. Confirm `.env` stays gitignored; `pnpm build` + `pnpm lint` pass locally.
5. Commit and **push all commits to origin/main** (repo becomes the deploy source).
6. Generate a production `PAYLOAD_SECRET` (`openssl rand -hex 32`) and hand it to the user to paste in step 2.3 — must differ from the dev secret.

## Phase 2 — Vercel setup (User, in browser; ~10 minutes)

1. **Import the repo**: vercel.com → *Add New… → Project* → Import `klavenjones/philippe-portfolio-3D` (authorize the Vercel GitHub app if prompted). Framework preset: Next.js (auto). **Skip/cancel the first deploy** if it starts before env vars exist — it will fail harmlessly without `DATABASE_URL`.
2. **Create the database**: Project → *Storage* tab → *Create Database* → **Neon** (Marketplace) → accept defaults → *Connect*. This injects `DATABASE_URL` (pooled) into the project env automatically.
3. **Set the secret**: Project → *Settings → Environment Variables* → add `PAYLOAD_SECRET` = (value from Phase 1.6), all environments.
4. **Create Blob storage**: *Storage* tab → *Create Database* → **Blob** → *Connect*. Injects `BLOB_READ_WRITE_TOKEN` automatically.
5. **Deploy**: *Deployments* tab → Redeploy (or push any commit). Build runs `payload migrate && next build` — migrations create the schema on the empty Neon DB, then the page prerenders.
6. Copy two values back to Claude for the seed: the **`DATABASE_URL`** and **`BLOB_READ_WRITE_TOKEN`** from Settings → Environment Variables (or run the seed yourself — command provided in Phase 3).

## Phase 3 — Production content (mixed)

1. **Seed production** (Claude, or user runs it): from the repo,
   `DATABASE_URL='<neon-pooled-url>' BLOB_READ_WRITE_TOKEN='<token>' pnpm seed`
   Explicit env vars override `.env` values (Node `--env-file` does not clobber existing env). Uploads the 13 images to Blob and creates all docs; aborts if artworks already exist.
2. **Create the artist's admin login** (User): visit `https://<project>.vercel.app/admin` → first-user screen → use the artist's real email + a strong password. (Do this promptly after deploy — the first-user screen is open until a user exists.)
3. **Optional**: also create a second login for yourself as maintainer (Admin → Users → Create New).

## Phase 4 — Verification (Claude, headless browser against the production URL)

1. `https://<project>.vercel.app/` renders the gallery: 13 artworks, bio panel, contact wall; **images load from `*.public.blob.vercel-storage.com`** (the Blob CORS check for Three.js TextureLoader — flagged as a risk in the CMS plan; fallback is a same-origin proxy route if it fails).
2. Scroll walkthrough + click → detail panel + close → scroll restore (reuse the existing puppeteer-core scripts in the scratchpad, pointed at the prod URL).
3. Edit test: user (or Claude via REST with the maintainer login) changes an artwork title → page updates within ~60s → revert.
4. `/admin` loads and login works.

## Follow-ups (not in this deployment)

- Point philippeprevil.com: Vercel → Settings → Domains → add domain, then update DNS at the registrar (A/CNAME per Vercel's instructions). The OtherPeoplesPixels site stops being served once DNS flips.
- After the production seed is verified: delete `LEGACY_ARTWORKS` from `lib/gallery/artworks.ts`, `scripts/seed.ts`, and `public/images/` (they exist only for seeding).
- Swap the placeholder `contact@philippeprevil.com` for the artist's real email in Site Settings via `/admin` (no code change needed).

## Risks

- **First deploy ordering**: build fails until `DATABASE_URL` exists — expected; redeploy after storage setup.
- **Neon integration env naming**: Marketplace Neon should inject `DATABASE_URL`; if it injects only `POSTGRES_URL`-style names, either rename in Vercel env settings or map it — verify in step 2.2 before deploying.
- **Migration vs pushed dev schema**: production Neon starts empty so `payload migrate` is clean; never run migrations against the local push-managed dev DB.
- **Open first-user screen** between deploy and admin creation — mitigated by doing Phase 3.2 immediately.
