import type { CollectionConfig } from "payload";
import { revalidateGallery, revalidateGalleryAfterDelete } from "../hooks/revalidateGallery";

export const Media: CollectionConfig = {
  slug: "media",
  upload: {
    mimeTypes: ["image/*"],
    // Local fallback when Vercel Blob is not configured (dev without token).
    staticDir: "media",
  },
  admin: {
    description: "Artwork images. Upload the highest-quality scan or photo you have.",
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
      admin: {
        description: "Short description of the image, e.g. \"Sabrina, graphite drawing\".",
      },
    },
  ],
  hooks: {
    afterChange: [revalidateGallery],
    afterDelete: [revalidateGalleryAfterDelete],
  },
};
