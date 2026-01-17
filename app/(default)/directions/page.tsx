import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import { buildMetadata } from "@/lib/seo";
import RelatedLinks from "@/components/related/RelatedLinks";
import BrowseNext from "@/components/BrowseNext";
import { site } from "@/lib/site";

export const metadata: Metadata = buildMetadata({
  pathname: "/directions",
  title: "Directions",
  description: "Directions to Kine Buds Dispensary in Maywood, NJ.",
});

export default function DirectionsPage() {
  return (
    <PageShell
      h1="Directions to Kine Buds (Maywood, NJ)"
      crumbs={[
        { name: "Store info", href: "/store-info" },
        { name: "Directions", href: "/directions" },
      ]}
      intro="Use these directions to find us quickly. This page is scaffolded for Local SEO and can be expanded with route links and a map embed."
      askAstro
      related={
        <RelatedLinks
          title="Visit planning"
          links={[
            { href: "/location", title: "Location" },
            { href: "/parking", title: "Parking" },
            { href: "/hours", title: "Hours" },
            { href: "/near-me", title: "Dispensary near me" },
            { href: "/store-info", title: "Store info" },
            { href: "/contact", title: "Contact" },
          ]}
        />
      }
      browseNext={
        <BrowseNext
          cards={[
            { href: "/shop/flower", title: "Shop Flower", kicker: "Shop" },
            { href: "/shop/edibles", title: "Shop Edibles", kicker: "Shop" },
            { href: "/resources", title: "Resources Center", kicker: "Resources" },
            { href: "/brands", title: "Brands", kicker: "Brands" },
            { href: "/strains", title: "Strains", kicker: "Strains" },
            { href: "/terpenes", title: "Terpenes", kicker: "Terpenes" },
          ]}
        />
      }
    >
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-white">Destination</h2>
        <p className="mt-2 text-indigo-200/80">
          {site.address.streetAddress}, {site.address.addressLocality},{" "}
          {site.address.addressRegion} {site.address.postalCode}
        </p>
      </section>

      <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-white">Map (placeholder)</h2>
        <p className="mt-2 text-indigo-200/70">
          Add a map embed + a “Get directions” link here.
        </p>
        <div className="mt-4 aspect-[16/9] w-full rounded-2xl bg-black/30" />
      </section>
    </PageShell>
  );
}

