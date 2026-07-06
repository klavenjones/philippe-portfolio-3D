import type { GlobalConfig } from "payload";
import { revalidateGallery } from "../hooks/revalidateGallery";

export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  label: "Site Settings",
  admin: {
    description: "Your name, bio, and contact info shown in the gallery.",
  },
  fields: [
    {
      name: "artistName",
      type: "text",
      required: true,
    },
    {
      name: "bioText",
      type: "textarea",
      required: true,
      admin: {
        description: "Shown on the bio panel next to your self-portrait at the gallery entrance.",
      },
    },
    {
      name: "contactEmail",
      type: "email",
      required: true,
      admin: {
        description: "Shown on the end wall and used for the Get in Touch button.",
      },
    },
  ],
  hooks: {
    afterChange: [revalidateGallery],
  },
};
