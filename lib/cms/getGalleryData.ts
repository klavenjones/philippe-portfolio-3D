import { getPayload } from "payload";
import config from "@payload-config";
import type { GalleryData } from "@/lib/gallery/artworks";
import { mapGalleryData } from "./mapArtworks";

/** Server-only: fetches artworks + settings via the Payload local API. */
export async function getGalleryData(): Promise<GalleryData> {
  const payload = await getPayload({ config });
  const [artworksResult, settings] = await Promise.all([
    payload.find({
      collection: "artworks",
      sort: "_order",
      depth: 1,
      pagination: false,
      limit: 500,
    }),
    payload.findGlobal({ slug: "site-settings" }),
  ]);
  return mapGalleryData(artworksResult.docs, settings);
}
