export type Category = "intro" | "oils" | "food-and-shoes" | "drawings";

export interface Artwork {
  id: string;
  src: string;
  title: string;
  year: number;
  medium: string;
  /** Physical canvas/paper dimensions, e.g. "12 × 16 in" — undefined if not listed. */
  dimensions?: string;
  category: Category;
  /** Source image pixel dimensions [w, h] */
  px: [number, number];
  /** Hung size in meters [w, h] */
  size: [number, number];
  wall: "left" | "right";
  slot: number;
}

export const ARTIST_NAME = "Philippe Previl";

// Placeholder — swap in the artist's real contact email.
export const CONTACT_EMAIL = "contact@philippeprevil.com";

export const BIO_TEXT =
  "Philippe is an experienced Graphic Artist with a demonstrated history of working in the " +
  "food & beverages industry. Strong arts and design professional skilled in Photography, " +
  "Printmaking, Graphics, Painting, and Murals.";

export const CATEGORY_LABELS: Record<Category, string> = {
  intro: "About the Artist",
  oils: "Oils",
  "food-and-shoes": "Food & Shoes",
  drawings: "Drawings & Sketches",
};

export const ARTWORKS: Artwork[] = [
  {
    id: "self-portrait",
    src: "/images/splash.jpg",
    title: "Self Portrait",
    year: 2013,
    medium: "Oil on canvas",
    category: "intro",
    // Dimensions not listed on the original site.
    px: [480, 480],
    size: [1.2, 1.2],
    wall: "left",
    slot: 0,
  },
  {
    id: "papa-m-koupe-fre-m",
    src: "/images/oils/Papa_m_koupe_fre_m_2012.jpg",
    title: "Papa m koupe fre m",
    year: 2012,
    medium: "Oil on wood",
    dimensions: "12 × 16 in",
    category: "oils",
    px: [362, 480],
    size: [1.06, 1.4],
    wall: "right",
    slot: 1,
  },
  {
    id: "flaming-hot-cheetos",
    src: "/images/food_and_shoes/Flaming_Hot_Cheetos_and_Red_Soda_2013.jpg",
    title: "Flaming Hot Cheetos and Red Soda",
    year: 2013,
    medium: "Acrylic",
    dimensions: "6 × 6 in",
    category: "food-and-shoes",
    px: [480, 480],
    size: [1.3, 1.3],
    wall: "left",
    slot: 2,
  },
  {
    id: "nyron-study",
    src: "/images/drawings/Nyron_Study_2007.jpg",
    title: "Nyron Study",
    year: 2007,
    medium: "Graphite on paper",
    category: "drawings",
    px: [349, 480],
    size: [0.87, 1.2],
    wall: "right",
    slot: 3,
  },
  {
    id: "artist-mask",
    src: "/images/drawings/Artist_mask_2008.jpg",
    title: "Artist Mask",
    year: 2008,
    medium: "Graphite on paper",
    dimensions: "9 × 12 in",
    category: "drawings",
    px: [358, 480],
    size: [0.9, 1.2],
    wall: "left",
    slot: 4,
  },
  {
    id: "basquiat-study",
    src: "/images/drawings/Basquiat_Study_2009.jpg",
    title: "Basquiat Study",
    year: 2009,
    medium: "Graphite on paper",
    dimensions: "5 × 7 in",
    category: "drawings",
    px: [316, 480],
    size: [0.79, 1.2],
    wall: "right",
    slot: 5,
  },
  {
    id: "sabrina",
    src: "/images/drawings/Sabrina_2009.jpg",
    title: "Sabrina",
    year: 2009,
    medium: "Graphite on paper",
    dimensions: "8 × 8 in",
    category: "drawings",
    px: [490, 480],
    size: [1.2, 1.18],
    wall: "left",
    slot: 6,
  },
  {
    id: "alex",
    src: "/images/drawings/Alex_2010.jpg",
    title: "Alex",
    year: 2010,
    medium: "Graphite on paper",
    dimensions: "5 × 7 in",
    category: "drawings",
    px: [289, 480],
    size: [0.72, 1.2],
    wall: "right",
    slot: 7,
  },
  {
    id: "family-portrait",
    src: "/images/drawings/Family_Portrait_2010.jpg",
    title: "Family Portrait",
    year: 2010,
    medium: "Graphite on paper",
    dimensions: "22 × 30 in",
    category: "drawings",
    px: [640, 381],
    size: [1.4, 0.83],
    wall: "left",
    slot: 8,
  },
  {
    id: "untitled-1",
    src: "/images/drawings/Untitled_1_2010.jpg",
    title: "Untitled 1",
    year: 2010,
    medium: "Graphite on paper",
    category: "drawings",
    px: [347, 480],
    size: [0.87, 1.2],
    wall: "right",
    slot: 9,
  },
  {
    id: "untitled-2",
    src: "/images/drawings/Untitled_2_2010.jpg",
    title: "Untitled 2",
    year: 2010,
    medium: "Graphite on paper",
    category: "drawings",
    px: [308, 480],
    size: [0.77, 1.2],
    wall: "left",
    slot: 10,
  },
  {
    id: "untitled-3",
    src: "/images/drawings/Untitled_3_2010.jpg",
    title: "Untitled 3",
    year: 2010,
    medium: "Graphite on paper",
    category: "drawings",
    px: [307, 480],
    size: [0.77, 1.2],
    wall: "right",
    slot: 11,
  },
  {
    id: "ray-mask",
    src: "/images/drawings/Ray_Mask_2012.jpg",
    title: "Ray Mask",
    year: 2012,
    medium: "Graphite on paper",
    dimensions: "9 × 12 in",
    category: "drawings",
    px: [280, 401],
    size: [0.84, 1.2],
    wall: "left",
    slot: 12,
  },
];

/** Sections that get an in-world wall label above their first artwork. */
export const SECTIONS: { category: Category; label: string; firstSlot: number }[] = [
  { category: "oils", label: "Oils", firstSlot: 1 },
  { category: "food-and-shoes", label: "Food & Shoes", firstSlot: 2 },
  { category: "drawings", label: "Drawings & Sketches", firstSlot: 3 },
];

export const artworkById = (id: string): Artwork | undefined =>
  ARTWORKS.find((a) => a.id === id);
