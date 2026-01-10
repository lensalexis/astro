// app/api/add-upsell/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, cartId } = body; // cartId optional

    if (!items || !items.length) {
      return NextResponse.json({ error: "No items selected" }, { status: 400 });
    }

    const payload: Record<string, any> = {
      venueId: process.env.DISPENSE_VENUE_ID ?? process.env.NEXT_PUBLIC_DISPENSE_VENUE_ID!,
      items,
    };

    // ✅ if cartId provided, update existing cart instead of creating new
    if (cartId) {
      payload.cartId = cartId;
    } else {
      // optional: assign a unique prospectId if starting fresh
      payload.prospectId = "upsell-session-" + Date.now();
    }

    const res = await fetch("https://api.dispenseapp.com/2023-03/carts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-dispense-api-key": process.env.DISPENSE_ORG_API_KEY!, // ✅ Org API key
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Dispense API error:", errorText);
      return NextResponse.json(
        { error: "Dispense API request failed", details: errorText },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({ cartId: data.id, ...data });
  } catch (err: any) {
    console.error("Upsell cart creation failed:", err);
    return NextResponse.json(
      { error: "Could not create or update upsell cart" },
      { status: 500 }
    );
  }
}