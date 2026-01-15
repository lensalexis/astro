import brandsJson from "@/data/brands.json";
import strainsJson from "@/data/strains.json";
import terpenesJson from "@/data/terpenes.json";
import formatsJson from "@/data/formats.json";
import learnPostsJson from "@/data/learn-posts.json";
import locationsJson from "@/data/locations.json";

import type {
  Brand,
  Format,
  LearnPost,
  NearMeLocation,
  Strain,
  Terpene,
} from "@/types/kb";

export const brands = brandsJson as Brand[];
export const strains = strainsJson as Strain[];
export const terpenes = terpenesJson as Terpene[];
export const formats = formatsJson as Format[];
export const learnPosts = learnPostsJson as LearnPost[];
export const nearMeLocations = locationsJson as NearMeLocation[];

export const formatStarterSlugs = [
  "flower",
  "pre-rolls",
  "vapes",
  "edibles",
  "nano-powders",
  "concentrates",
  "topicals",
  "tinctures",
] as const;

export const shopCategorySlugs = [
  "flower",
  "pre-rolls",
  "vapes",
  "edibles",
  "concentrates",
  "topicals",
  "tinctures",
  "accessories",
] as const;

export const learnCategorySlugs = [
  "beginners",
  "effects",
  "how-it-works",
  "industry",
] as const;

export const useCaseSlugs = ["relaxation", "creativity", "focus", "sleep"] as const;

export function bySlug<T extends { slug: string }>(items: T[], slug: string) {
  return items.find((i) => i.slug === slug) ?? null;
}

export function pickSome<T>(items: T[], count: number, seed?: string) {
  if (items.length <= count) return items;
  // Simple deterministic-ish pick based on seed string.
  const start = seed
    ? Math.abs(
        seed.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
      ) % items.length
    : 0;
  const out: T[] = [];
  for (let i = 0; i < Math.min(count, items.length); i++) {
    out.push(items[(start + i) % items.length]);
  }
  return out;
}

