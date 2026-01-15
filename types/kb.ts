export type Brand = {
  name: string;
  slug: string;
  description: string;
  website?: string;
  socials?: Record<string, string>;
  carriedFormats: string[];
  featuredStrains: string[];
  featuredTerpenes: string[];
};

export type Strain = {
  name: string;
  slug: string;
  genetics?: string;
  description: string;
  dominantTerpenes: string[];
  commonUseCases: string[];
  relatedBrands: string[];
};

export type Terpene = {
  name: string;
  slug: string;
  aroma: string;
  description: string;
  commonInStrains: string[];
};

export type Format = {
  name: string;
  slug: string;
  description: string;
  typicalOnset?: string;
  duration?: string;
  bestForUseCases?: string[];
};

export type LearnPost = {
  title: string;
  slug: string;
  categorySlug: string;
  excerpt: string;
  content: string;
  relatedStrains: string[];
  relatedTerpenes: string[];
  relatedBrands: string[];
  publishedAt: string;
};

export type NearMeLocation = {
  name: string;
  slug: string;
  intro: string;
  distanceNotes?: string;
  nearbyTowns?: string[];
};

