"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

// 🎨 Effect text colors
const effectColors: Record<string, string> = {
  Happy: "text-[#FFC107]",        // Yellow
  Energetic: "text-[#FF5722]",    // Orange
  Creative: "text-[#9C27B0]",     // Purple
  Relaxed: "text-[#009688]",      // Teal
  Sleepy: "text-[#3F51B5]",       // Indigo
  "Pain Relief": "text-[#4CAF50]" // Green
}

const effects = [
  { label: "Happy", strain: "hybrid-sativa" },
  { label: "Energetic", strain: "sativa" },
  { label: "Creative", strain: "sativa" },
  { label: "Relaxed", strain: "hybrid-indica" },
  { label: "Sleepy", strain: "indica" },
  { label: "Pain Relief", strain: "indica" },
]

function ShopStep2Content() {
  const router = useRouter();
  const params = useSearchParams();
  const category = params.get("category");

  const handleSelect = (effect: { label: string; strain: string }) => {
    router.push(
      `/shop/results?category=${category}&effect=${effect.label}&strain=${effect.strain}`
    )
  };

  const handleSkip = () => {
    // Skip straight to the category page
    router.push(`/shop/${category}`);
  };

  return (
    <section className="min-h-screen flex flex-col justify-center items-center px-6">
      {/* Logo fixed at top */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 md:hidden">
        <img
          src="/images/kine-buds-logo.png"
          alt="Kine Buds Dispensary"
          className="h-16 w-auto"
        />
      </div>

      <h2 className="text-2xl font-bold mb-8">How Do You Want to Feel?</h2>

      <div className="grid grid-cols-2 gap-4 w-full max-w-md mb-6">
        {effects.map((e) => (
          <button
            key={e.label}
            onClick={() => handleSelect(e)}
            className={`px-6 py-3 rounded-full bg-white border border-gray-200 font-bold transition cursor-pointer hover:shadow-md ${
              effectColors[e.label] || "text-gray-700"
            }`}
          >
            {e.label}
          </button>
        ))}
      </div>

      {/* Skip button */}
      <button
        onClick={handleSkip}
        className="mt-4 px-6 py-3 rounded-full bg-gray-200 text-gray-800 border-gray-800 font-semibold hover:bg-gray-300 cursor-pointer transition"
      >
        Skip
      </button>
    </section>
  )
}

export default function ShopStep2() {
  return (
    <Suspense fallback={<section className="py-12 text-center text-gray-500">Loading filters…</section>}>
      <ShopStep2Content />
    </Suspense>
  );
}
