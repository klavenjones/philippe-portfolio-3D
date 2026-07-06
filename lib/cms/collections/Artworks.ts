import type { CollectionConfig } from "payload";
import { revalidateGallery, revalidateGalleryAfterDelete } from "../hooks/revalidateGallery";

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export const Artworks: CollectionConfig = {
  slug: "artworks",
  access: {
    read: () => true, // artwork metadata is public site content
  },
  orderable: true,
  defaultSort: "_order",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "category", "year"],
    description:
      "The pieces hanging in the gallery. Drag rows to change the order visitors walk past them.",
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
      required: true,
    },
    {
      name: "year",
      type: "number",
      required: true,
    },
    {
      name: "medium",
      type: "text",
      required: true,
      admin: {
        description: "e.g. Oil on wood, Graphite on paper, Acrylic",
      },
    },
    {
      name: "dimensions",
      type: "text",
      admin: {
        description: "Physical size as shown on the label, e.g. 12 × 16 in. Leave empty if unknown.",
      },
    },
    {
      name: "category",
      type: "select",
      required: true,
      defaultValue: "drawings",
      options: [
        { label: "About the Artist (self-portrait)", value: "intro" },
        { label: "Oils", value: "oils" },
        { label: "Food & Shoes", value: "food-and-shoes" },
        { label: "Drawings & Sketches", value: "drawings" },
      ],
    },
    {
      name: "wall",
      type: "select",
      defaultValue: "auto",
      options: [
        { label: "Auto", value: "auto" },
        { label: "Left wall", value: "left" },
        { label: "Right wall", value: "right" },
      ],
      admin: {
        position: "sidebar",
        description: "Auto alternates left/right down the hall.",
      },
    },
    {
      name: "frameColor",
      type: "text",
      validate: (value: string | null | undefined) =>
        !value || HEX_COLOR.test(value) || "Use a hex color like #3d2b1f",
      admin: {
        position: "sidebar",
        description:
          "Hex color for this piece's frame, e.g. #3d2b1f. Leave empty for the default (black for drawings, walnut for paintings).",
      },
    },
    {
      name: "displayMaxDim",
      type: "number",
      admin: {
        position: "sidebar",
        description:
          "Advanced: hung size in meters for the longest side. Leave empty for the default by category.",
      },
    },
  ],
  hooks: {
    afterChange: [revalidateGallery],
    afterDelete: [revalidateGalleryAfterDelete],
  },
};
