"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import productService from "@/lib/productService";
import ShopProductCard from "@/components/ui/ShopProductCard";

// Map step-1 slugs to category IDs from API
const categoryMap: Record<string, string> = {
  flower: "1af917cd40ce027b",
  "pre-rolls": "873e1156bc94041e",
  vaporizers: "ba607fa13287b679",
  concentrates: "dd753723f6875d2e",
  edibles: "2f2c05a9bbb5fd43",
  beverages: "45d32b3453f51209",
  tinctures: "4b9c5820c59418fa",
};

// Map step-2 effects → strain/cannabisType
const effectToStrainMap: Record<string, string> = {
  happy: "SATIVA",
  euphoric: "SATIVA",
  uplifted: "SATIVA",
  focused: "HYBRID_SATIVA",
  calm: "INDICA",
  sleepy: "INDICA",
  "pain relief": "INDICA",
};

export default function ShopResults() {
  const params = useSearchParams();
  const router = useRouter();

  const category = params.get("category")?.toLowerCase();
  const effect = params.get("effect")?.toLowerCase();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      if (!category) return;
      setLoading(true);

      try {
        const strainFilter = effect ? effectToStrainMap[effect] : null;

        const res = await productService.list({
          venueId: process.env.NEXT_PUBLIC_DISPENSE_VENUE_ID!,
          categoryId: categoryMap[category] || "",
          limit: 20,
          quantityMin: 1, // ✅ only show in-stock
          strain: strainFilter || undefined, // ✅ filter by effect/strain
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
  }, [category, effect]);

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl md:text-2xl font-bold">
          {effect
            ? `${category} for "${effect}"`
            : `Showing ${category} products`}
        </h2>

        {/* Edit button → back to Step 1 */}
        <button
          onClick={() => router.push("/shop")}
          className="px-4 py-2 rounded-full bg-black text-white hover:bg-gray-800 transition cursor-pointer"
        >
          New Search
        </button>
      </div>

      {/* Products */}
      {loading ? (
        <p className="text-gray-500">Loading products...</p>
      ) : products.length === 0 ? (
        <p className="text-gray-500">No products found. Try a different filter.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product: any) => (
            <ShopProductCard key={product.id} product={product} effect={effect || null} />
          ))}
        </div>
      )}
    </section>
  );
}