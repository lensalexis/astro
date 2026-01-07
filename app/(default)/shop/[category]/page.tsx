// app/(default)/shop/[category]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import productService from "@/lib/productService";
import ProductCard from "@/components/ui/ProductCard";
import FilterNav from "@/components/ui/FilterNav";
import AIProductSearch from "@/components/AIProductSearch";

const categories = [
  { name: "Flower", slug: "flower", id: "1af917cd40ce027b", icon: "/images/icon-cannabis-flower.png" },
  { name: "Vaporizers", slug: "vaporizers", id: "ba607fa13287b679", icon: "/images/icon-cannabis-vape.png", synonyms: ["vapes"] },
  { name: "Pre Rolls", slug: "pre-rolls", id: "873e1156bc94041e", icon: "/images/icon-cannabis-preroll.png", synonyms: ["prerolls", "pre rolls"] },
  { name: "Concentrates", slug: "concentrates", id: "dd753723f6875d2e", icon: "/images/icon-cannabis-concentrate.png" },
  { name: "Edibles", slug: "edibles", id: "2f2c05a9bbb5fd43", icon: "/images/icon-cannabis-edibles.png" },
  { name: "Beverages", slug: "beverages", id: "45d32b3453f51209", icon: "/images/icon-cannabis-beverage.png" },
  { name: "Tinctures", slug: "tinctures", id: "4b9c5820c59418fa", icon: "/images/icon-cannabis-tinctures.png" },
];

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

// --- helper for weight formatting ---
function normalizeWeight(weight: string | undefined | null): string | null {
  if (!weight) return null;
  return weight.replace(/\s+/g, "").toLowerCase(); // "3.5 g" → "3.5g"
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
  const [filters, setFilters] = useState({
    categories: [] as string[],
    brands: [] as string[],
    strains: [] as string[],
    terpenes: [] as string[],
    weights: [] as string[],
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

  // Apply filters client-side
  const filteredProducts = products.filter((p) => {
    if (filters.categories.length && selectedCategory && !filters.categories.includes(selectedCategory.name)) {
      return false
    }
    if (filters.brands.length && !filters.brands.includes(p.brand?.name)) {
      return false;
    }
    if (filters.strains.length && !filters.strains.includes(p.strain || p.cannabisType)) {
      return false;
    }
    if (filters.terpenes.length) {
      const terpeneList = p.labs?.terpenes || [];
      if (!filters.terpenes.some((t) => terpeneList.includes(t))) {
        return false;
      }
    }
    if (filters.weights.length) {
      const productWeights = [
        normalizeWeight(p.size),
        ...(p.tiers?.map((t: any) => normalizeWeight(t.weightFormatted)) || []),
        p.weightFormatted,
      ].filter(Boolean) as string[];

      if (!filters.weights.some((w) => productWeights.includes(w))) {
        return false;
      }
    }
    if (filters.saleOnly && !p.discounts?.length) {
      return false;
    }
    return true;
  });

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

  // ✅ Collect options dynamically
  const categoryOptions = categories.map((c) => c.name)
  const brandOptions = Array.from(new Set(products.map((p) => p.brand?.name).filter(Boolean))) as string[];
  const strainOptions = Array.from(new Set(products.map((p) => p.strain || p.cannabisType).filter(Boolean))) as string[];
  const terpeneOptions = Array.from(
    new Set(products.flatMap((p) => p.labs?.terpenes || []).filter(Boolean))
  ) as string[];
  const weightOptions = Array.from(
    new Set(
      products.flatMap((p) => {
        const weights: string[] = [];
        if (p.weightFormatted) weights.push(p.weightFormatted);
        if (p.size) weights.push(p.size);
        if (Array.isArray(p.tiers)) {
          p.tiers.forEach((t: any) => {
            if (t.weightFormatted) weights.push(t.weightFormatted);
          });
        }
        return weights;
      }).filter(Boolean)
    )
  ) as string[];

  // ✅ Build counts dynamically
  const counts = {
    categories: { [selectedCategory.name]: products.length },
    brands: products.reduce((acc, p) => {
      if (p.brand?.name) acc[p.brand.name] = (acc[p.brand.name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    strains: products.reduce((acc, p) => {
      const strain = p.strain || p.cannabisType;
      if (strain) acc[strain] = (acc[strain] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    terpenes: products.reduce((acc, p) => {
      if (Array.isArray(p.labs?.terpenes)) {
        p.labs.terpenes.forEach((t: string) => {
          acc[t] = (acc[t] || 0) + 1;
        });
      }
      return acc;
    }, {} as Record<string, number>),
    weights: products.reduce((acc, p) => {
      const weights: string[] = [];
      if (p.weightFormatted) weights.push(p.weightFormatted);
      if (p.size) weights.push(p.size);
      if (Array.isArray(p.tiers)) {
        p.tiers.forEach((t: any) => {
          if (t.weightFormatted) weights.push(t.weightFormatted);
        });
      }
      weights.forEach((w) => {
        acc[w] = (acc[w] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>),
  };

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
        counts={counts}
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