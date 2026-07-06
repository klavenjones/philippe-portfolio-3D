# Managing the Gallery — CMS Guide

The site's content is managed with [Payload CMS](https://payloadcms.com), which runs inside this app. There is nothing to install for editors — everything happens in the browser.

## For the artist

Go to **`<your-site>/admin`** and log in.

### Artworks

Click **Artworks** in the sidebar to see every piece in the gallery.

- **Add a piece**: click *Create New*, upload the image, and fill in the title, year, and medium. Dimensions (e.g. `12 × 16 in`) are optional and appear in the pop-up when a visitor clicks the piece.
- **Change the walk-through order**: drag the rows in the list — visitors walk past the artworks in this order. The self-portrait ("About the Artist" category) is always shown first regardless of position.
- **Choose a wall**: normally pieces alternate left/right automatically. To force a side, open the piece and set **Wall** in the sidebar.
- **Frame color**: each piece can have its own frame color (a hex code like `#3d2b1f`). Leave it empty for the default — black frames for drawings, walnut for paintings.
- **Delete a piece**: open it and use the delete option in the three-dot menu. It disappears from the gallery and the hall shortens automatically.

### Site Settings

Click **Site Settings** to edit:

- **Artist Name** — shown in the top corner, on the bio panel, and the end wall.
- **Bio Text** — the panel next to the self-portrait at the gallery entrance.
- **Contact Email** — the "Get in touch" wall and button.

### Publishing

Just click **Save**. Changes appear on the live site within about a minute — no other steps.

## For developers

### Stack

- **Payload 3** mounted in `app/(payload)` (admin at `/admin`, REST at `/api`).
- **Postgres** via `@payloadcms/db-postgres` — Neon in production, Homebrew/local Postgres in dev.
- **Vercel Blob** for uploaded images in production; without a token, uploads fall back to disk in `./media` (gitignored).
- The site page (`app/(site)/page.tsx`) fetches through the Payload **local API** (`lib/cms/getGalleryData.ts`) and is statically prerendered; every content change triggers `revalidatePath('/')` via hooks in `lib/cms/hooks/revalidateGallery.ts`.
- `lib/cms/mapArtworks.ts` converts CMS docs into the 3D gallery's shape: slot order, wall alternation, hung sizes from image aspect ratio, and hall/scroll length from the artwork count.

### Environment

Copy `.env.example` to `.env`:

| Var | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string. Production: Neon **pooled** string (`...-pooler...?sslmode=require`). |
| `PAYLOAD_SECRET` | Auth token signing secret — `openssl rand -hex 32`. |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token. Optional in dev (disk fallback). |

Local Postgres (macOS): `brew install postgresql@17 && brew services start postgresql@17 && createdb philippe_portfolio`, then `DATABASE_URL=postgresql://<you>@localhost:5432/philippe_portfolio`.

### First run

1. `pnpm install`
2. `pnpm dev` — Payload pushes the schema to the database automatically in dev.
3. Visit `/admin` — on an empty database you'll get the **create first user** screen.
4. `pnpm seed` — one-shot migration of the original hardcoded artworks (reads images from `public/images/`, only runs when the Artworks collection is empty).

Keep `lib/gallery/artworks.ts`'s `LEGACY_ARTWORKS` and `public/images/` until the **production** database has been seeded; they can be deleted after.

### Codegen

- `pnpm generate:types` — regenerate `payload-types.ts` after schema changes.
- `pnpm generate:importmap` — regenerate the admin import map after adding admin components.

### Deploying to Vercel

1. Create a Neon Postgres database and a Vercel Blob store; set the three env vars in Vercel (all environments — `DATABASE_URL` is needed at build time because the page prerenders).
2. Before the first deploy, create the initial migration: `pnpm payload migrate:create initial`, and set the Vercel build command to `pnpm payload migrate && pnpm build` (the `ci` script).
3. Deploy, then visit `/admin` to create the artist's login, and run the seed against production: `NODE_ENV=production DATABASE_URL=<neon-url> BLOB_READ_WRITE_TOKEN=<token> pnpm seed`. **`NODE_ENV=production` matters**: without it, Payload treats the database as dev-push-managed (adds a `dev` row to `payload_migrations`), which makes the next `payload migrate` in CI hang on an interactive prompt. If that ever happens, delete the row: `delete from payload_migrations where name = 'dev';`.
4. The Vercel Blob store must be created with **public** access — the Payload adapter and the Three.js texture loader both require public URLs. Access is set at store creation and can't be changed after.
4. Verify an edit in `/admin` shows up on the site within a minute.

Note: dev mode uses drizzle schema push (no migration files); production uses committed migrations from `payload migrate:create`.
