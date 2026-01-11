"use client"

import Link from "next/link"
import Image from "next/image"
import type { Product } from "@/types/product"
import {
  ProductType,
  ProductWeightUnit,
  ProductPriceType,
  CannabisContentUnit,
} from "@/types/product"

// ----------------------
// Types (from boilerplate)
// ----------------------

export const ProductDefaultImage =
  "https://imgix.dispenseapp.com/default-image.png"

// ----------------------
// Helpers
// ----------------------

export function pickPrimaryImage(p: Product) {
  return (
    p.image ||
    p.primary_image_url ||
    p.imageUrls?.[0] ||
    p.images?.[0]?.url ||
    ProductDefaultImage
  )
}

export function pickDisplayNode(p: Product): {
  basePrice: number
  discountType?: "FLAT" | "PERCENT" | null
  discountAmountFinal?: number | null
  discountValueFinal?: number | null
  discounts?: Product["discounts"]
} {
  if (
    (p.priceType === "WEIGHT_TIER" || p.priceType === "PRICE_TIER") &&
    p.tiers?.length
  ) {
    const tiers = p.tiers.filter((t) => typeof t.price === "number")
    if (tiers.length) {
      const t = tiers.reduce((best, cur) =>
        (cur.price ?? Infinity) < (best.price ?? Infinity) ? cur : best
      )
      return {
        basePrice: t.price ?? 0,
        discountType: t.discountTypeFinal,
        discountAmountFinal: t.discountAmountFinal,
        discountValueFinal: t.discountValueFinal,
        discounts: p.discounts,
      }
    }
  }

  if (p.variants?.length) {
    const priced = p.variants.filter((v) => typeof v.price === "number")
    if (priced.length) {
      const v = priced.reduce((best, cur) =>
        (cur.price ?? Infinity) < (best.price ?? Infinity) ? cur : best
      )
      return {
        basePrice: v.price ?? 0,
        discountType: v.discountTypeFinal,
        discountAmountFinal: v.discountAmountFinal,
        discountValueFinal: v.discountValueFinal,
        discounts: p.discounts,
      }
    }
  }

  return {
    basePrice: p.price ?? 0,
    discountType: p.discountTypeFinal,
    discountAmountFinal: p.discountAmountFinal,
    discountValueFinal: p.discountValueFinal,
    discounts: p.discounts,
  }
}

export function computeFinalPrice(
  basePrice: number,
  discountType?: "FLAT" | "PERCENT" | null,
  discountAmountFinal?: number | null,
  discountValueFinal?: number | null,
  discounts?: Product["discounts"]
) {
  let final = basePrice

  if (discounts && discounts.length > 0) {
    const d = discounts[0]
    if (d.type === "FLAT" && d.amount) {
      return Math.max(0, basePrice - d.amount)
    } else if (d.type === "PERCENT" && d.value) {
      return Math.max(0, basePrice * (1 - d.value))
    }
  }

  if (discountType === "FLAT" && discountAmountFinal && discountAmountFinal > 0) {
    final = Math.max(0, basePrice - discountAmountFinal)
  } else if (discountType === "PERCENT" && discountValueFinal && discountValueFinal > 0) {
    final = Math.max(0, basePrice * (1 - discountValueFinal))
  }

  return final
}

export function formatStrainType(type?: string | null) {
  const t = (type ?? "").toUpperCase()
  if (t === "SATIVA") return "Sativa"
  if (t === "INDICA") return "Indica"
  if (t === "HYBRID_SATIVA" || t === "SATIVA_HYBRID") return "Sativa Hybrid"
  if (t === "HYBRID_INDICA" || t === "INDICA_HYBRID") return "Indica Hybrid"
  if (t === "HYBRID") return "Hybrid"
  return null
}

export function getStrainIcon(type?: string | null) {
  const t = (type ?? "").toUpperCase()
  if (t === "SATIVA") return "/icons/sativa.svg"
  if (t === "INDICA") return "/icons/indica.svg"
  if (t === "HYBRID_SATIVA" || t === "SATIVA_HYBRID") return "/icons/sativa-hybrid.svg"
  if (t === "HYBRID_INDICA" || t === "INDICA_HYBRID") return "/icons/indica-hybrid.svg"
  if (t === "HYBRID") return "/icons/hybrid.svg"
  return null
}

export function getCannabinoidLabel(p: Product, key: "thc" | "cbd"): string | null {
  const val =
    p.labs?.[`${key}Max` as keyof typeof p.labs] ??
    p.labs?.[key as keyof typeof p.labs] ??
    null
  if (!val) return null
  const unit = (key === "thc" ? p.labs?.thcContentUnit : p.labs?.cbdContentUnit) ?? "%"
  return `${key.toUpperCase()} ${val}${unit}`
}

export function getTopTerpenes(p: Product, limit = 2): string[] {
  if (!p.labs) return []

  if (Array.isArray(p.labs.terpenes) && p.labs.terpenes.length > 0) {
    return p.labs.terpenes.slice(0, limit)
  }

  const entries = Object.entries(p.labs)
    .filter(([key, value]) => typeof value === "number" && value > 0)
    .map(([key, value]) => ({ key, value: value as number }))

  entries.sort((a, b) => b.value - a.value)

  const terpeneNames: Record<string, string> = {
    alphaPinene: "Alpha Pinene",
    betaCaryophyllene: "Beta Caryophyllene",
    betaMyrcene: "Beta Myrcene",
    betaPinene: "Beta Pinene",
    humulene: "Humulene",
    limonene: "Limonene",
    linalool: "Linalool",
    ocimene: "Ocimene",
    terpinene: "Terpinene",
    terpinolene: "Terpinolene",
    threeCarene: "3-Carene",
    transNerolidol: "Trans-Nerolidol",
    bisabolol: "Bisabolol",
    guaiol: "Guaiol",
    caryophylleneOxide: "Caryophyllene Oxide",
  }

  return entries.slice(0, limit).map((e) => terpeneNames[e.key] || e.key)
}

function getCategorySlug(p: Product) {
  const typeSlugMap: Partial<Record<ProductType, string>> = {
    [ProductType.FLOWER]: "flower",
    [ProductType.PRE_ROLLS]: "pre-rolls",
    [ProductType.VAPORIZERS]: "vaporizers",
    [ProductType.CONCENTRATES]: "concentrates",
    [ProductType.EDIBLES]: "edibles",
    [ProductType.BEVERAGES]: "beverages",
    [ProductType.TINCTURES]: "tinctures",
  }
  if (p.type && typeSlugMap[p.type]) {
    return typeSlugMap[p.type] as string
  }
  if (p.category) {
    return p.category.toLowerCase().replace(/\s+/g, "-")
  }
  return "flower"
}

// ----------------------
// Component
// ----------------------

export default function ProductCard({
  product,
  imageHeight,
}: {
  product: Product
  /** Optional fixed image height (px) for masonry layouts */
  imageHeight?: number
}) {
  const image = pickPrimaryImage(product)

  const { basePrice, discountType, discountAmountFinal, discountValueFinal, discounts } =
    pickDisplayNode(product)
  const finalPrice = computeFinalPrice(
    basePrice,
    discountType,
    discountAmountFinal,
    discountValueFinal,
    discounts
  )
  const hasDiscount = finalPrice < basePrice - 0.001

  const rawStrain = product.strain ?? product.cannabisType
  const strain = formatStrainType(rawStrain)

  const thc = getCannabinoidLabel(product, "thc")
  const cbd = getCannabinoidLabel(product, "cbd")
  const metaLabel = product.brand?.name || (product.category as any) || null
  const imgH = imageHeight ?? 192

  return (
    <Link
      href={`/shop/${getCategorySlug(product)}/${product.id}`}
      className="block rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition border border-gray-200 text-black"
    >
      <div
        className="relative w-full bg-gray-100 overflow-hidden"
        style={{ height: `${imgH}px`, width: "100%", contain: "layout style paint" }}
      >
        <Image
          src={image}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover"
          loading="lazy"
          unoptimized={image.startsWith("http")}
        />
      </div>

      <div className="p-3">
        {metaLabel ? (
          <div className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold truncate">
            {metaLabel}
          </div>
        ) : null}

        <div className="mt-0.5 text-sm font-semibold text-gray-900 truncate leading-tight">
          {product.name}
        </div>

        {(strain || thc || cbd) ? (
          <div className="mt-0.5 flex items-center gap-1.5 min-w-0">
            {strain ? (
              <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-700">
                {strain}
              </span>
            ) : null}
            {thc || cbd ? (
              <span className="min-w-0 truncate text-[11px] text-gray-600 leading-tight">
                {thc ? thc : "THC —"}
                <span className="mx-1 text-gray-400">|</span>
                {cbd ? cbd : "CBD —"}
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="mt-1.5 flex items-baseline gap-2">
          {hasDiscount ? (
            <>
              <span className="text-xs text-gray-400 line-through">
                ${basePrice.toFixed(2)}
              </span>
              <span className="text-sm font-bold text-red-500">
                ${finalPrice.toFixed(2)}
              </span>
            </>
          ) : (
            <span className="text-sm font-bold text-indigo-600">
              ${basePrice.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
