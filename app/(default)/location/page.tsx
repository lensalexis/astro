import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import JsonLd from "@/components/seo/JsonLd";
import { buildMetadata } from "@/lib/seo";
import { localBusinessJsonLd } from "@/lib/jsonld";
import { site } from "@/lib/site";
import RelatedLinks from "@/components/related/RelatedLinks";
import BrowseNext from "@/components/BrowseNext";

export const metadata: Metadata = buildMetadata({
  pathname: "/location",
  title: "Location",
  description:
    "Find Kine Buds Dispensary in Maywood, NJ. Address, nearby towns, and visit planning links.",
});

export default function LocationPage() {
  return (
    <PageShell
      h1="Kine Buds Dispensary Location (Maywood, NJ)"
      crumbs={[{ name: "Location", href: "/location" }]}
      intro="We’re located in Maywood, NJ—easy to reach from across Bergen County. Use the links below for directions, parking, and hours."
      askAstro
      related={
        <RelatedLinks
          title="Visit details"
          links={[
            { href: "/directions", title: "Directions" },
            { href: "/parking", title: "Parking" },
            { href: "/hours", title: "Hours" },
            { href: "/near-me", title: "Dispensary near me", description: "Local area pages" },
            { href: "/store-info", title: "Store info" },
            { href: "/faq", title: "FAQ" },
          ]}
        />
      }
      browseNext={
        <BrowseNext
          cards={[
            { href: "/shop/flower", title: "Shop Flower in Maywood, NJ", kicker: "Shop" },
            { href: "/shop/pre-rolls", title: "Shop Pre-Rolls in Maywood, NJ", kicker: "Shop" },
            { href: "/shop/vapes", title: "Shop Vapes in Maywood, NJ", kicker: "Shop" },
            { href: "/use-cases/relaxation", title: "Relaxation guide", kicker: "Use-cases" },
            { href: "/learn/beginners", title: "Beginner guides", kicker: "Learn" },
            { href: "/terpenes", title: "Terpene knowledge base", kicker: "Terpenes" },
          ]}
        />
      }
    >
      <JsonLd data={localBusinessJsonLd()} />

      <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-white">Address</h2>
        <p className="mt-2 text-indigo-200/80">
          {site.address.streetAddress}, {site.address.addressLocality},{" "}
          {site.address.addressRegion} {site.address.postalCode}
        </p>
      </section>

      <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-white">Map (placeholder)</h2>
        <p className="mt-2 text-indigo-200/70">
          Add a Google Maps embed here with driving / walking directions.
        </p>
        <div className="mt-4 aspect-[16/9] w-full rounded-2xl bg-black/30" />
      </section>
    </PageShell>
  );
}

