"use client";

import ProductCard from "@/components/ui/ProductCard";

function matchesEffect(product: any, effect: string | null) {
  if (!effect) return true;

  const effectMap: Record<string, string[]> = {
     // Uplifting / Energizing
  happy: ["SATIVA", "HYBRID_SATIVA"],
  energetic: ["SATIVA"],
  creative: ["SATIVA", "HYBRID_SATIVA"],
  
  // Relaxing / Calming
  relaxed: ["INDICA", "HYBRID_INDICA", "HYBRID"],
  sleepy: ["INDICA"],
  "pain relief": ["INDICA", "HYBRID_INDICA"],
  };

  const allowed = effectMap[effect.toLowerCase()];
  if (!allowed) return true;

  const strain = (product.strain || product.cannabisType || "").toUpperCase();
  return allowed.includes(strain);
}

export default function ShopProductCard({
  product,
  effect,
}: {
  product: any;
  effect: string | null;
}) {
  if (!matchesEffect(product, effect)) return null; // 🚫 hide mismatch

  return <ProductCard product={product} />;
}