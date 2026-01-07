// app/api/products/route.ts
import { NextResponse } from "next/server";
import productService from "@/lib/productService";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const discounted = searchParams.get("discounted");
    const limit = Number(searchParams.get("limit")) || 3;

    const res = await productService.list({
      venueId: process.env.NEXT_PUBLIC_DISPENSE_VENUE_ID!,
      discounted: discounted === "true",
      limit,
    });

    const products = (res.data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      discountAmountFinal: p.discountAmountFinal,
      brand: p.brand,
      strain: p.strain,
      labs: p.labs,
      image: p.image,
      // take the first tier as the default for upsell
      tierId: p.tiers?.[0]?.id || null,
    }));

    return NextResponse.json(products);
  } catch (err) {
    console.error("Error fetching products:", err);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}