import type { Artwork as CMSArtwork, Media, SiteSetting } from "@/payload-types";
import type {
  Artwork,
  Category,
  GalleryData,
  GalleryLayout,
  GallerySettings,
} from "@/lib/gallery/artworks";
import { CAMERA, SLOT_SPACING } from "@/lib/gallery/constants";

const DEFAULT_MAX_DIM: Record<Category, number> = {
  intro: 1.2,
  oils: 1.4,
  "food-and-shoes": 1.3,
  drawings: 1.2,
};

const DEFAULT_FRAME_COLOR: Record<Category, string> = {
  intro: "#3d2b1f",
  oils: "#3d2b1f",
  "food-and-shoes": "#3d2b1f",
  drawings: "#000000",
};

/** Reference pace: the original 13-artwork hall used 1500vh over 78m of travel. */
const VH_PER_METER = 1500 / 78;

export function computeLayout(artworkCount: number): GalleryLayout {
  const slotCount = artworkCount + 2;
  const hallEndZ = -(slotCount * SLOT_SPACING + 3);
  const cameraEndZ = hallEndZ + 4;
  const spacerVh = Math.round((CAMERA.startZ - cameraEndZ) * VH_PER_METER);
  return { slotCount, hallEndZ, cameraEndZ, spacerVh };
}

function hungSize(doc: CMSArtwork, image: Media, category: Category): [number, number] {
  const maxDim = doc.displayMaxDim ?? DEFAULT_MAX_DIM[category];
  const w = image.width ?? 1;
  const h = image.height ?? 1;
  const aspect = w / h;
  const size: [number, number] =
    aspect >= 1 ? [maxDim, maxDim / aspect] : [maxDim * aspect, maxDim];
  return [Math.round(size[0] * 100) / 100, Math.round(size[1] * 100) / 100];
}

/**
 * Maps Payload docs (sorted by _order, image populated at depth 1) into the
 * shape the 3D gallery consumes. Self-portrait ("intro") pieces are pinned to
 * the front; walls alternate left/right unless overridden per piece.
 */
export function mapGalleryData(
  docs: CMSArtwork[],
  settings: Partial<SiteSetting> | null,
): GalleryData {
  const withImages = docs.filter(
    (doc): doc is CMSArtwork & { image: Media } =>
      typeof doc.image === "object" && doc.image !== null,
  );

  const ordered = [
    ...withImages.filter((d) => d.category === "intro"),
    ...withImages.filter((d) => d.category !== "intro"),
  ];

  const artworks: Artwork[] = ordered.map((doc, slot) => {
    const category = doc.category as Category;
    return {
      id: String(doc.id),
      src: doc.image.url ?? "",
      title: doc.title,
      year: doc.year,
      medium: doc.medium,
      dimensions: doc.dimensions ?? undefined,
      category,
      px: [doc.image.width ?? 1, doc.image.height ?? 1],
      size: hungSize(doc, doc.image, category),
      wall:
        doc.wall && doc.wall !== "auto"
          ? doc.wall
          : slot % 2 === 0
            ? "left"
            : "right",
      slot,
      frameColor: doc.frameColor || DEFAULT_FRAME_COLOR[category],
    };
  });

  const gallerySettings: GallerySettings = {
    artistName: settings?.artistName ?? "",
    bioText: settings?.bioText ?? "",
    contactEmail: settings?.contactEmail ?? "",
  };

  return {
    artworks,
    settings: gallerySettings,
    layout: computeLayout(artworks.length),
  };
}
