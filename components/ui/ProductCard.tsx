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

export default function ProductCard({ product }: { product: Product }) {
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
  const strainIcon = getStrainIcon(rawStrain)

  const thc = getCannabinoidLabel(product, "thc")
  const cbd = getCannabinoidLabel(product, "cbd")
  const terpenes = getTopTerpenes(product)

  return (
    <div className="bg-white rounded-2xl p-3 md:p-4 shadow-md hover:shadow-lg transition text-black flex flex-col gap-2 md:gap-3 h-full relative">
      {/* Image with Add to Cart button */}
      <div className="w-full h-48 flex rounded-2xl items-center justify-center overflow-hidden relative bg-gray-100">
        <Link href={`/shop/${getCategorySlug(product)}/${product.id}`}>
          <Image 
            src={image} 
            alt={product.name} 
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
            loading="lazy"
            unoptimized={image.startsWith('http')}
          />
        </Link>

        {/* Add to Cart */}
        {/* <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            addToCart({ id: product.id, name: product.name, price: finalPrice, quantity: 1 })
          }}
          className="absolute top-2 right-2 bg-indigo-600 text-white p-2 rounded-full shadow hover:bg-indigo-700"
        >
          🛒
        </button> */}
      </div>

      {/* Brand */}
      {product.brand?.name && (
        <p className="text-xs uppercase text-gray-500 font-semibold">{product.brand.name}</p>
      )}

      {/* Name */}
      <h3 className="text-sm md:text-base font-semibold leading-tight line-clamp-2">{product.name}</h3>

      {/* Size */}
      {product.size && <p className="text-xs md:text-sm text-gray-500">{product.size}</p>}

      {/* Strain + Cannabinoids */}
      {(strain || thc || cbd) && (
        <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm font-medium flex-wrap">
          {strain && (
            <div className="flex items-center gap-1.5 md:gap-2">
              {strainIcon && <Image src={strainIcon} width={16} height={16} alt={strain} className="md:w-5 md:h-5" />}
              <span className="capitalize text-gray-600">{strain}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm font-medium">
            {thc && <span className="text-gray-600">{thc}</span>}
            {cbd && <span className="text-gray-600">{cbd}</span>}
          </div>
        </div>
      )}

      {/* Terpenes */}
      {/* {terpenes.length > 0 && (
        <div className="flex gap-2 flex-wrap text-xs text-gray-500">
          {terpenes.map((t) => (
            <span key={t} className="bg-gray-100 px-2 py-1 rounded-full">
              {t}
            </span>
          ))}
        </div>
      )} */}

      {/* Price */}
      <div className="mt-auto">
        {hasDiscount ? (
          <div className="flex items-center gap-1.5 md:gap-2">
            <span className="text-xs md:text-sm text-gray-400 line-through">${basePrice.toFixed(2)}</span>
            <span className="text-red-500 font-bold text-base md:text-lg">${finalPrice.toFixed(2)}</span>
          </div>
        ) : (
          <p className="text-indigo-600 font-bold text-base md:text-lg">${basePrice.toFixed(2)}</p>
        )}
      </div>
    </div>
  )
}
