// app/(default)/shop/[category]/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import productService from "@/lib/productService";
import ProductCard from "@/components/ui/ProductCard";
import FilterNav from "@/components/ui/FilterNav";
import AIProductSearch from "@/components/AIProductSearch";
import {
  CATEGORY_DEFS,
  applyProductFilters,
  buildFacetCounts,
  buildFacetOptions,
  type FacetedFilters,
} from "@/lib/catalog";

const CATEGORY_ICONS: Record<string, string> = {
  "flower": "/images/icon-cannabis-flower.png",
  "vaporizers": "/images/icon-cannabis-vape.png",
  "pre-rolls": "/images/icon-cannabis-preroll.png",
  "concentrates": "/images/icon-cannabis-concentrate.png",
  "edibles": "/images/icon-cannabis-edibles.png",
  "beverages": "/images/icon-cannabis-beverage.png",
  "tinctures": "/images/icon-cannabis-tinctures.png",
};

const CATEGORY_SYNONYMS: Record<string, string[]> = {
  "vaporizers": ["vapes"],
  "pre-rolls": ["prerolls", "pre rolls"],
};

const categories = CATEGORY_DEFS.map((cat) => ({
  ...cat,
  icon: CATEGORY_ICONS[cat.slug] || "/images/icon-cannabis-flower.png",
  synonyms: CATEGORY_SYNONYMS[cat.slug] || [],
}));

function normalizeSlug(slug: string) {
  return slug.toLowerCase().replace(/\s+/g, "-").replace(/_/g, "-").trim();
}

function findCategory(raw: string | undefined) {
  if (!raw) return null;
  const norm = normalizeSlug(raw);
  let found = categories.find((c) => c.slug === norm);
  if (found) return found;
  return categories.find((c) =>
    c.synonyms?.some((syn) => normalizeSlug(syn) === norm)
  );
}

export default function CategoryPage() {
  const params = useParams();
  const rawCategory = (params as any)?.category;
  const slug = Array.isArray(rawCategory) ? rawCategory[0] : rawCategory || "";
  const selectedCategory = findCategory(slug);

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiResultsVisible, setAiResultsVisible] = useState(false);

  // Filters state
  const [filters, setFilters] = useState<FacetedFilters>({
    categories: [],
    brands: [],
    strains: [],
    terpenes: [],
    weights: [],
    effects: [],
    saleOnly: false,
  });

  useEffect(() => {
    async function fetchProducts() {
      if (!selectedCategory) return;
      setLoading(true);
      try {
        const res = await productService.list({
          venueId: process.env.NEXT_PUBLIC_DISPENSE_VENUE_ID!,
          categoryId: selectedCategory.id,
          limit: 100,
          quantityMin: 1,
        });
        setProducts(res.data || []);
      } catch (err) {
        console.error("Error fetching products:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [selectedCategory]);

  const normalizedFilters = useMemo<FacetedFilters>(() => {
    const base: FacetedFilters = {
      ...filters,
    }
    if ((!base.categories || base.categories.length === 0) && selectedCategory) {
      base.categories = [selectedCategory.name]
    }
    return base
  }, [filters, selectedCategory])

  const filteredProducts = useMemo(() => {
    return applyProductFilters(products, normalizedFilters)
  }, [products, normalizedFilters]);

  if (!selectedCategory) {
    return (
      <section className="min-h-screen px-6 py-12">
        <h2 className="text-2xl font-bold mb-4">Category not found</h2>
        <p className="text-gray-600">
          Try: {categories.map((c) => c.slug).join(", ")}.
        </p>
      </section>
    );
  }

  const facets = useMemo(() => buildFacetOptions(products), [products]);
  const facetCounts = useMemo(() => buildFacetCounts(products), [products]);

  const categoryOptions = categories.map((c) => c.name);
  const brandOptions = facets.brands;
  const strainOptions = facets.strains;
  const terpeneOptions = facets.terpenes;
  const weightOptions = facets.weights;
  const effectOptions = facets.effects;

  return (
    <>
      <div className="py-6 px-4 sm:px-6 max-w-6xl mx-auto">
        <AIProductSearch onResultsVisibleChange={setAiResultsVisible} />
      </div>

      {!aiResultsVisible && (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
      <div className="flex items-center gap-3 mb-6">
        <Image
          src={selectedCategory.icon}
          alt={selectedCategory.name}
          width={32}
          height={32}
        />
        <h2 className="text-2xl font-bold">{selectedCategory.name}</h2>
      </div>

      <FilterNav
        categories={categoryOptions}
        brands={brandOptions}
        strains={strainOptions}
        terpenes={terpeneOptions}
        weights={weightOptions}
        effects={effectOptions}
        counts={facetCounts}
        initialFilters={filters}
        onChange={(newFilters) => setFilters(newFilters)}
      />

      {loading ? (
        <p className="text-gray-500">Loading products...</p>
      ) : filteredProducts.length === 0 ? (
        <p className="text-gray-500">No products found with these filters.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
      )}
    </>
  );
}
