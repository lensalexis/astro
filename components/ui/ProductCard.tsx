"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import cartService from "@/app/api/cartService"
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

function pickPrimaryImage(p: Product) {
  return (
    p.image ||
    p.primary_image_url ||
    p.imageUrls?.[0] ||
    p.images?.[0]?.url ||
    ProductDefaultImage
  )
}

function pickDisplayNode(p: Product): {
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

function computeFinalPrice(
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

function formatStrainType(type?: string | null) {
  const t = (type ?? "").toUpperCase()
  if (t === "SATIVA") return "Sativa"
  if (t === "INDICA") return "Indica"
  if (t === "HYBRID_SATIVA" || t === "SATIVA_HYBRID") return "Sativa Hybrid"
  if (t === "HYBRID_INDICA" || t === "INDICA_HYBRID") return "Indica Hybrid"
  if (t === "HYBRID") return "Hybrid"
  return null
}

function getStrainIcon(type?: string | null) {
  const t = (type ?? "").toUpperCase()
  if (t === "SATIVA") return "/icons/sativa.svg"
  if (t === "INDICA") return "/icons/indica.svg"
  if (t === "HYBRID_SATIVA" || t === "SATIVA_HYBRID") return "/icons/sativa-hybrid.svg"
  if (t === "HYBRID_INDICA" || t === "INDICA_HYBRID") return "/icons/indica-hybrid.svg"
  if (t === "HYBRID") return "/icons/hybrid.svg"
  return null
}

function getCannabinoidLabel(p: Product, key: "thc" | "cbd"): string | null {
  const val =
    p.labs?.[`${key}Max` as keyof typeof p.labs] ??
    p.labs?.[key as keyof typeof p.labs] ??
    null
  if (!val) return null
  const unit = (key === "thc" ? p.labs?.thcContentUnit : p.labs?.cbdContentUnit) ?? "%"
  return `${key.toUpperCase()} ${val}${unit}`
}

function getTopTerpenes(p: Product, limit = 2): string[] {
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

// ----------------------
// Component
// ----------------------

export default function ProductCard({ product }: { product: Product }) {
  const [isAdding, setIsAdding] = useState(false)
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

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isAdding) return
    
    setIsAdding(true)
    try {
      const venueId = process.env.NEXT_PUBLIC_DISPENSE_VENUE_ID!
      
      // Determine price tier data if applicable
      const priceTierData = 
        (product.priceType === ProductPriceType.PRICE_TIER || product.priceType === ProductPriceType.WEIGHT_TIER) &&
        product.tiers && product.tiers.length > 0
          ? {
              priceType: product.priceType,
              type: product.type || ProductType.FLOWER,
              weight: product.tiers[0]?.weight,
            }
          : undefined

      await cartService.addProduct({
        venueId,
        productId: product.id,
        quantity: 1,
        purchaseWeight: product.weight,
        priceTierData,
      })

      // Trigger a custom event to update the floating cart
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cartUpdated'))
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      alert('Failed to add product to cart. Please try again.')
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition text-black flex flex-col gap-3 h-full relative">
      {/* Image with Add to Cart button */}
      <div className="w-full h-48 flex rounded-2xl items-center justify-center overflow-hidden relative">
        <Link
          href={`https://www.kinebudsdispensary.com/menu/${product.category}/${product.id}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <img src={image} alt={product.name} className="w-full h-full object-cover" />
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
      <h3 className="text-base font-semibold leading-tight">{product.name}</h3>

      {/* Size */}
      {product.size && <p className="text-sm text-gray-500">{product.size}</p>}

      {/* Strain + Cannabinoids */}
      {(strain || thc || cbd) && (
        <div className="flex items-center gap-4 text-sm font-medium flex-wrap">
          {strain && (
            <div className="flex items-center gap-2">
              {strainIcon && <Image src={strainIcon} width={20} height={20} alt={strain} />}
              <span className="capitalize text-gray-600">{strain}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm font-medium">
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
      <div className="mt-1">
        {hasDiscount ? (
          <div className="flex items-center gap-2">
            <span className="text-gray-400 line-through">${basePrice.toFixed(2)}</span>
            <span className="text-red-500 font-bold text-lg">${finalPrice.toFixed(2)}</span>
          </div>
        ) : (
          <p className="text-indigo-600 font-bold text-lg">${basePrice.toFixed(2)}</p>
        )}
      </div>

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        disabled={isAdding}
        className="mt-3 w-full rounded-lg bg-purple-600 text-white py-2 px-4 font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isAdding ? 'Adding...' : 'Add to Cart'}
      </button>
    </div>
  )
}
