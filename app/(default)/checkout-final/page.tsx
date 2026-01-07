"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/ui/ProductCard";
import productService from "@/lib/productService";

const FLOWER_CATEGORY = {
  name: "Flower",
  slug: "flower",
  id: "1af917cd40ce027b",
};

export default function CheckoutFinal() {
  const [products, setProducts] = useState<any[]>([]);
  const [showStatus, setShowStatus] = useState(false);
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const params = useSearchParams();
  const cartId = params.get("cartId"); // ✅ from checkout redirect

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  // Fetch first 3 discounted Flower products
  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await productService.list({
          venueId: process.env.NEXT_PUBLIC_DISPENSE_VENUE_ID!,
          categoryId: FLOWER_CATEGORY.id,
          limit: 3,
          quantityMin: 1,
          discounted: true,
        });
        setProducts(res.data || []);
      } catch (err) {
        console.error("Error fetching Flower products:", err);
      }
    }
    fetchProducts();
  }, []);

  // Format countdown time
  const minutes = Math.floor(timeLeft / 60);
  const seconds = (timeLeft % 60).toString().padStart(2, "0");

  // Handle upsell add-to-cart
  const handleUpsell = async (productId: string) => {
    try {
      setLoadingId(productId);

      const res = await fetch("/api/add-upsell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cartId: cartId || undefined, // ✅ update existing cart if available
          prospectId: cartId ? undefined : "upsell-" + Date.now(), // ✅ fallback
          items: [{ productId, quantity: 1 }],
        }),
      });

      if (!res.ok) throw new Error("Upsell failed");
      alert("Added to your order!");
    } catch (err) {
      console.error("Upsell error:", err);
      alert("Could not add item to order");
    } finally {
      setLoadingId(null);
    }
  };

  if (showStatus) {
    // Step 2: Show Dispense checkout-complete iframe
    return (
      <section className="py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h1 className="text-3xl font-semibold text-center mb-6">
            Order Status
          </h1>
          <iframe
            src="https://kinebudsdispensary.com/menu/cart"
            style={{ width: "100%", height: "90vh", border: "none" }}
          />
        </div>
      </section>
    );
  }

  // Step 1: Upsell UI
  return (
    <section className="py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 text-center">
        {/* Countdown */}
        {timeLeft > 0 && (
          <p className="text-red-600 font-bold mb-4">
            LIMITED TIME OFFER ENDS IN {minutes}:{seconds}
          </p>
        )}

        <h1 className="text-2xl font-bold mb-4">🎉 Your order is confirmed!</h1>
        <p className="text-gray-600 mb-10">
          While you wait, grab one of these exclusive discounted add-ons:
        </p>

        {/* Product cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-20 text-left">
          {products.map((product) => (
            <div key={product.id} className="relative">
              <ProductCard
                product={product}
                categorySlug={FLOWER_CATEGORY.slug}
              />
              <button
                onClick={() => handleUpsell(product.id)}
                disabled={loadingId === product.id}
                className="mt-3 w-full rounded-lg bg-green-600 text-white py-2 font-semibold hover:bg-green-700 disabled:opacity-50"
              >
                {loadingId === product.id ? "Adding..." : "Add to Order"}
              </button>
            </div>
          ))}
        </div>

        {/* Continue button */}
        <button
          onClick={() => setShowStatus(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-indigo-700"
        >
          View Order Status
        </button>
      </div>
    </section>
  );
}