"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ShopProductCard from "@/components/ui/ShopProductCard";
import { listDispenseProducts } from "@/utils/dispenseClient";

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

function ShopResultsContent() {
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

        const res = await listDispenseProducts({
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5 md:gap-2 lg:gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={`skeleton-${i}`} className="bg-white rounded-2xl p-3 md:p-4 shadow-md flex flex-col gap-2 md:gap-3">
              <div className="w-full rounded-2xl bg-gray-200 animate-pulse" style={{ height: '192px' }} />
              <div className="h-3 w-1/3 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
              <div className="h-5 w-1/2 bg-gray-200 rounded animate-pulse mt-auto" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="text-gray-500">No products found. Try a different filter.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5 md:gap-2 lg:gap-3">
          {products.map((product: any) => (
            <ShopProductCard key={product.id} product={product} effect={effect || null} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function ShopResults() {
  return (
    <Suspense fallback={<section className="py-12 text-center text-gray-500">Loading products…</section>}>
      <ShopResultsContent />
    </Suspense>
  );
}
