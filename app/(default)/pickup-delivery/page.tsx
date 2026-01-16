import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import RelatedLinks from "@/components/related/RelatedLinks";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  pathname: "/pickup-delivery",
  title: "Pickup & delivery",
  description:
    "Pickup details for Kine Buds in Maywood, NJ—what to bring, how pickup works, and delivery availability.",
});

export default function PickupDeliveryPage() {
  return (
    <PageShell
      h1="Pickup & delivery"
      crumbs={[{ name: "Pickup & delivery", href: "/pickup-delivery" }]}
      intro="Pickup is designed to be fast and friendly. Delivery availability varies—check back for updates."
      related={
        <RelatedLinks
          title="Plan your visit"
          links={[
            { href: "/directions", title: "Directions" },
            { href: "/parking", title: "Parking" },
            { href: "/hours", title: "Hours" },
            { href: "/faq", title: "FAQ" },
          ]}
        />
      }
    >
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-white">Pickup checklist</h2>
        <ul className="mt-3 list-disc pl-5 text-indigo-200/80 space-y-2">
          <li>Bring a valid ID (21+ required).</li>
          <li>Have your order details ready (if ordering ahead).</li>
          <li>Ask a budtender if you want quick recommendations.</li>
        </ul>
      </section>

      <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-white">Delivery status</h2>
        <p className="mt-2 text-indigo-200/70">
          Delivery is not guaranteed and may be introduced later. For now, the fastest way to shop is to browse{" "}
          <Link className="text-white underline hover:no-underline" href="/shop">
            the shop hub
          </Link>{" "}
          and plan a quick pickup.
        </p>
      </section>
    </PageShell>
  );
}

