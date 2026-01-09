"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import cartService from "@/app/api/cartService";
import { queryClientUtils, QueryClientKey } from "@/utils/queryClient";
import type { CartWithItemProducts } from "@/types/cart";

type FulfillmentType = "pickup" | "delivery";

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartWithItemProducts | null>(null);
  const [loading, setLoading] = useState(true);
  const [fulfillment, setFulfillment] = useState<FulfillmentType>("pickup");
  const [contact, setContact] = useState({ name: "", email: "", phone: "" });
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const queryClient = queryClientUtils.getQueryClient();
    const cartData = queryClient.getQueryData<CartWithItemProducts>(QueryClientKey.CART);
    setCart(cartData || null);
    setLoading(false);
  }, []);

  const handleCheckout = async () => {
    if (!cart || !cart.items || cart.items.length === 0) {
      alert("Your cart is empty");
      return;
    }
    setSubmitting(true);

    const openCheckout = (cartId?: string | null) => {
      const baseUrl = "https://kinebudsdispensary.com/menu/cart";
      const destination = cartId ? `${baseUrl}?cartId=${cartId}` : baseUrl;
      window.location.href = destination;
    };

    try {
      const venueId = process.env.NEXT_PUBLIC_DISPENSE_VENUE_ID!;
      const syncedCart = await cartService.create({
        venueId,
        items: cart.items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          purchaseWeight: item.purchaseWeight,
        })),
      });
      openCheckout(syncedCart?.id || cart?.id);
    } catch (error) {
      console.error("Failed to sync cart", error);
      openCheckout(cart?.id);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <section className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading checkout…</p>
      </section>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <section className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-gray-200">Your cart is empty.</p>
        <button
          className="rounded-full bg-white px-6 py-2 text-black font-semibold"
          onClick={() => router.push("/shop")}
        >
          Browse menu
        </button>
      </section>
    );
  }

  const total = cart.items.reduce((sum, item) => {
    const price = (item.product as any).price || 0;
    return sum + price * item.quantity;
  }, 0);

  return (
    <section className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600">We’ll guide you through the final steps before transferring to AIQ.</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[3fr,2fr]">
          <div className="space-y-6">
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Contact information</h2>
              <div className="mt-4 space-y-4">
                <input
                  type="text"
                  placeholder="Full name"
                  value={contact.name}
                  onChange={(e) => setContact({ ...contact, name: e.target.value })}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-200"
                />
                <input
                  type="email"
                  placeholder="Email address"
                  value={contact.email}
                  onChange={(e) => setContact({ ...contact, email: e.target.value })}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-200"
                />
                <input
                  type="tel"
                  placeholder="Phone number"
                  value={contact.phone}
                  onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-200"
                />
              </div>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">Fulfillment</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  onClick={() => setFulfillment("pickup")}
                  className={`rounded-2xl border px-4 py-3 text-left ${
                    fulfillment === "pickup"
                      ? "border-purple-600 bg-purple-50 text-purple-700"
                      : "border-gray-200 text-gray-700"
                  }`}
                >
                  <p className="font-semibold">Pickup</p>
                  <p className="text-sm text-gray-500">Free & ready in-store</p>
                </button>
                <button
                  onClick={() => setFulfillment("delivery")}
                  className={`rounded-2xl border px-4 py-3 text-left ${
                    fulfillment === "delivery"
                      ? "border-purple-600 bg-purple-50 text-purple-700"
                      : "border-gray-200 text-gray-700"
                  }`}
                >
                  <p className="font-semibold">Delivery</p>
                  <p className="text-sm text-gray-500">Available within range</p>
                </button>
              </div>
              <textarea
                placeholder="Delivery notes or requests"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-4 w-full rounded-2xl border border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-200"
                rows={3}
              />
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Items</h2>
              <div className="space-y-4">
                {cart.items.map((item) => {
                  const product = item.product as any;
                  const image = product.image || product.primary_image_url || "/images/default-product.png";
                  return (
                    <div key={item.product.id} className="flex items-center gap-4 border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-gray-100">
                        <Image src={image} alt={product.name} fill className="object-cover" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <div className="font-semibold text-gray-900">
                        ${(product.price || 0).toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order summary</h2>
              <div className="flex justify-between text-gray-600 mb-2">
                <span>Subtotal</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600 mb-2">
                <span>Estimated taxes</span>
                <span>Calculated in AIQ</span>
              </div>
              <div className="flex justify-between text-gray-900 font-bold text-lg border-t border-gray-100 pt-3">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>

              <button
                onClick={handleCheckout}
                disabled={submitting}
                className="mt-5 w-full rounded-full bg-purple-600 px-4 py-3 text-white font-semibold hover:bg-purple-700 disabled:opacity-50"
              >
                {submitting ? "Connecting to AIQ…" : "Continue to payment"}
              </button>
              <p className="mt-2 text-xs text-gray-500">
                You’ll be redirected to AIQ Dispense to securely complete your payment.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Need help?</h3>
              <p className="text-sm text-gray-600">
                Call us at <a href="tel:6464764305" className="font-semibold text-purple-600">646-476-4305</a> or chat with the concierge at the store.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
