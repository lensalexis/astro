"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import productService from "@/lib/productService";
import cartService from "@/app/api/cartService";
import type { Product } from "@/types/product";
import { ProductType } from "@/types/product";
import ProductCard, {
  pickPrimaryImage,
  pickDisplayNode,
  computeFinalPrice,
  formatStrainType,
  getStrainIcon,
  getCannabinoidLabel,
  getTopTerpenes,
} from "@/components/ui/ProductCard";
import { CATEGORY_DEFS } from "@/lib/catalog";

type TierOption = {
  id?: string;
  weightFormatted?: string;
  price?: number | null;
  discountTypeFinal?: "FLAT" | "PERCENT" | null;
  discountAmountFinal?: number | null;
  discountValueFinal?: number | null;
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const categorySlug = Array.isArray(params?.category) ? params?.category[0] : (params?.category as string) || "";
  const productId = Array.isArray(params?.productId) ? params?.productId[0] : (params?.productId as string) || "";

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);

  const venueId = process.env.NEXT_PUBLIC_DISPENSE_VENUE_ID!;

  useEffect(() => {
    let mounted = true;

    const fetchProduct = async () => {
      if (!productId) return;
      setLoading(true);
      try {
        const data = await productService.getById({ id: productId, venueId });
        if (!mounted) return;
        setProduct(data);
        if (data?.tiers?.length) {
          const firstPricedTier = data.tiers.find((t) => typeof t.price === "number");
          if (firstPricedTier?.id) {
            setSelectedTierId(firstPricedTier.id);
          }
        }
      } catch (error) {
        console.error("Failed to load product", error);
        setProduct(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProduct();
    return () => {
      mounted = false;
    };
  }, [productId, venueId]);

  useEffect(() => {
    const loadRelated = async () => {
      if (!product) return;
      const matchingCategory =
        CATEGORY_DEFS.find((c) => c.slug === categorySlug)?.id || (product as any)?.categoryId;
      if (!matchingCategory) return;

      try {
        const res = await productService.list({
          venueId,
          categoryId: matchingCategory,
          limit: 8,
          quantityMin: 1,
          enable: true,
        });
        const items = (res.data || []).filter((p) => p.id !== product.id).slice(0, 4);
        setRelated(items);
      } catch (error) {
        console.warn("Failed to load related products", error);
      }
    };

    loadRelated();
  }, [product, categorySlug, venueId]);

  const tierOptions: TierOption[] = useMemo(() => {
    if (!product?.tiers?.length) return [];
    return product.tiers
      .filter((tier) => typeof tier.price === "number")
      .map((tier) => ({
        id: tier.id,
        weightFormatted: tier.weightFormatted,
        price: tier.price,
        discountTypeFinal: tier.discountTypeFinal,
        discountAmountFinal: tier.discountAmountFinal,
        discountValueFinal: tier.discountValueFinal,
      }));
  }, [product]);

  const selectedTier = tierOptions.find((tier) => tier.id === selectedTierId) || tierOptions[0];

  const pricingInfo = useMemo(() => {
    if (!product) return null;
    if (selectedTier) {
      const basePrice = selectedTier.price ?? 0;
      const finalPrice = computeFinalPrice(
        basePrice,
        selectedTier.discountTypeFinal,
        selectedTier.discountAmountFinal,
        selectedTier.discountValueFinal,
        product.discounts
      );
      return {
        basePrice,
        finalPrice,
        hasDiscount: finalPrice < basePrice - 0.001,
      };
    }
    const node = pickDisplayNode(product);
    const finalPrice = computeFinalPrice(
      node.basePrice,
      node.discountType,
      node.discountAmountFinal,
      node.discountValueFinal,
      node.discounts
    );
    return {
      basePrice: node.basePrice,
      finalPrice,
      hasDiscount: finalPrice < node.basePrice - 0.001,
    };
  }, [product, selectedTier]);

  const handleAddToCart = async () => {
    if (!product) return;
    setAdding(true);
    try {
      const priceTierData =
        product.priceType &&
        (product.priceType === "PRICE_TIER" || product.priceType === "WEIGHT_TIER") &&
        selectedTier
          ? {
              priceType: product.priceType,
              type: product.type || ProductType.FLOWER,
              weight: product.tiers?.find((t) => t.id === selectedTier.id)?.weight,
            }
          : undefined;

      await cartService.addProduct({
        venueId,
        productId: product.id,
        quantity: 1,
        purchaseWeight: product.weight,
        priceTierData,
      });
      window.dispatchEvent(new CustomEvent("cartUpdated"));
    } catch (error) {
      console.error("Failed to add to cart", error);
      alert("Unable to add this item to your cart. Please try again.");
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <section className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading product…</p>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-gray-200">We couldn’t find that product.</p>
        <button
          onClick={() => router.push(`/shop/${categorySlug || "flower"}`)}
          className="rounded-full bg-white px-6 py-2 text-black font-semibold"
        >
          Back to menu
        </button>
      </section>
    );
  }

  const heroImage = pickPrimaryImage(product);
  const strain = formatStrainType(product.strain || product.cannabisType);
  const strainIcon = getStrainIcon(product.strain || product.cannabisType);
  const thcLabel = getCannabinoidLabel(product, "thc");
  const cbdLabel = getCannabinoidLabel(product, "cbd");
  const topTerpenes = getTopTerpenes(product, 3);

  return (
    <section className="py-10 px-4 sm:px-6 max-w-6xl mx-auto text-black">
      <button
        onClick={() => router.back()}
        className="mb-6 rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
      >
        ← Back
      </button>

      <div className="grid gap-8 lg:grid-cols-[3fr,2fr] bg-white rounded-3xl p-6 shadow-md">
        <div className="space-y-6">
          <div className="relative w-full overflow-hidden rounded-2xl bg-gray-100 aspect-[4/3]">
            <Image src={heroImage} alt={product.name} fill className="object-cover" />
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Product details</h2>
            <p className="text-gray-600 whitespace-pre-line">{product.description || "No description provided."}</p>

            {product.effects && product.effects.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Effects</h3>
                <div className="flex flex-wrap gap-2">
                  {product.effects.map((effect) => (
                    <span key={effect} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                      {effect}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {topTerpenes.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Top Terpenes</h3>
                <div className="flex flex-wrap gap-2">
                  {topTerpenes.map((terp) => (
                    <span key={terp} className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
                      {terp}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl bg-gray-50 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Lab results</h3>
              <div className="flex gap-6 text-sm text-gray-700">
                {thcLabel && <span>🔥 {thcLabel}</span>}
                {cbdLabel && <span>💧 {cbdLabel}</span>}
                {!thcLabel && !cbdLabel && <span>Not provided</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {product.brand?.name && (
            <p className="text-sm uppercase tracking-wide text-gray-500">{product.brand.name}</p>
          )}
          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>

          {strain && (
            <div className="flex items-center gap-2 text-gray-600">
              {strainIcon && <Image src={strainIcon} alt={strain} width={20} height={20} />}
              <span>{strain}</span>
            </div>
          )}

          {pricingInfo && (
            <div className="flex items-baseline gap-3">
              {pricingInfo.hasDiscount && (
                <span className="text-lg text-gray-400 line-through">
                  ${pricingInfo.basePrice.toFixed(2)}
                </span>
              )}
              <span className="text-3xl font-bold text-purple-600">
                ${pricingInfo.finalPrice.toFixed(2)}
              </span>
            </div>
          )}

          {tierOptions.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-2">Select size</p>
              <div className="grid grid-cols-2 gap-3">
                {tierOptions.map((tier) => (
                  <button
                    key={tier.id}
                    onClick={() => setSelectedTierId(tier.id || null)}
                    className={`rounded-2xl border px-3 py-2 text-sm font-medium transition ${
                      selectedTierId === tier.id
                        ? "border-purple-600 bg-purple-50 text-purple-700"
                        : "border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <div>{tier.weightFormatted || "Each"}</div>
                    {tier.price && (
                      <div className="text-xs text-gray-500">${tier.price.toFixed(2)}</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleAddToCart}
            disabled={adding}
            className="w-full rounded-full bg-purple-600 px-6 py-3 text-white font-semibold hover:bg-purple-700 disabled:opacity-50"
          >
            {adding ? "Adding..." : "Add to Cart"}
          </button>

          <button
            onClick={() =>
              window.open(
                `https://www.kinebudsdispensary.com/menu/${categorySlug || "flower"}/${product.id}`,
                "_blank"
              )
            }
            className="w-full rounded-full border border-gray-200 px-6 py-3 text-gray-700 font-semibold hover:bg-gray-50"
          >
            View live menu listing
          </button>

          {related.length > 0 && (
            <div className="mt-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">You might also like</h3>
                <button
                  onClick={() => router.push(`/shop/${categorySlug || "flower"}`)}
                  className="text-sm font-medium text-purple-600 hover:text-purple-700"
                >
                  View all
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {related.map((item) => (
                  <ProductCard key={item.id} product={item} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
