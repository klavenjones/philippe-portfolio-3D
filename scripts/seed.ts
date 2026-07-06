/**
 * One-shot migration of the legacy hardcoded gallery content into Payload.
 * Run with: pnpm seed   (alias for: payload run scripts/seed.ts)
 *
 * Uploads each image from public/images/... (to Vercel Blob when
 * BLOB_READ_WRITE_TOKEN is set, otherwise to ./media on disk) and creates the
 * artwork documents in the current walk-through order, plus Site Settings.
 */
import path from "path";
import { getPayload } from "payload";
import config from "@payload-config";
import {
  ARTIST_NAME,
  BIO_TEXT,
  CONTACT_EMAIL,
  LEGACY_ARTWORKS,
} from "../lib/gallery/artworks";

// Skip revalidatePath in hooks — next/cache isn't available outside Next.
const context = { disableRevalidate: true };

async function seed() {
  const payload = await getPayload({ config });

  const existing = await payload.count({ collection: "artworks" });
  if (existing.totalDocs > 0) {
    console.log(
      `Aborting: ${existing.totalDocs} artwork(s) already exist. Seed only runs on an empty CMS.`,
    );
    process.exit(1);
  }

  console.log("Seeding site settings…");
  await payload.updateGlobal({
    slug: "site-settings",
    data: {
      artistName: ARTIST_NAME,
      bioText: BIO_TEXT,
      contactEmail: CONTACT_EMAIL,
    },
    context,
  });

  // Sequential creates so Payload's _order matches the current slot order.
  for (const artwork of LEGACY_ARTWORKS) {
    console.log(`Seeding "${artwork.title}"…`);
    const media = await payload.create({
      collection: "media",
      data: { alt: `${artwork.title}, ${artwork.year}, ${artwork.medium}` },
      filePath: path.resolve(process.cwd(), "public", artwork.src.slice(1)),
      context,
    });

    await payload.create({
      collection: "artworks",
      data: {
        title: artwork.title,
        image: media.id,
        year: artwork.year,
        medium: artwork.medium,
        dimensions: artwork.dimensions,
        category: artwork.category,
        wall: "auto",
        // The landscape Family Portrait hangs wider than the category default.
        displayMaxDim: artwork.id === "family-portrait" ? 1.4 : undefined,
      },
      context,
    });
  }

  console.log(`Done: seeded ${LEGACY_ARTWORKS.length} artworks + site settings.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
