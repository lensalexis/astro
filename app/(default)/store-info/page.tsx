import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import JsonLd from "@/components/seo/JsonLd";
import { buildMetadata } from "@/lib/seo";
import { localBusinessJsonLd, organizationJsonLd } from "@/lib/jsonld";
import { site } from "@/lib/site";
import RelatedLinks from "@/components/related/RelatedLinks";
import BrowseNext from "@/components/BrowseNext";

export const metadata: Metadata = buildMetadata({
  pathname: "/store-info",
  title: "Store info",
  description:
    "Store information for Kine Buds Dispensary in Maywood, NJ: address, contact, directions, parking, and what to expect.",
});

export default function StoreInfoPage() {
  return (
    <PageShell
      h1="Kine Buds Dispensary Store Info"
      crumbs={[{ name: "Store info", href: "/store-info" }]}
      intro="Everything you need for a smooth visit—hours, directions, parking, and contact info for our Maywood, NJ dispensary."
      askAstro
      related={
        <RelatedLinks
          title="Plan your visit"
          links={[
            { href: "/hours", title: "Hours" },
            { href: "/directions", title: "Directions" },
            { href: "/parking", title: "Parking" },
            { href: "/first-time-visitors", title: "First-time visitors" },
            { href: "/faq", title: "FAQ" },
            { href: "/contact", title: "Contact" },
          ]}
        />
      }
      browseNext={
        <BrowseNext
          cards={[
            { href: "/shop", title: "Shop (content hub)", kicker: "Shop" },
            { href: "/brands", title: "Brands at Kine Buds", kicker: "Brands" },
            { href: "/strains", title: "Strain guides", kicker: "Strains" },
            { href: "/terpenes", title: "Terpene knowledge base", kicker: "Terpenes" },
            { href: "/formats", title: "Formats deep dives", kicker: "Formats" },
            { href: "/resources", title: "Resources Center", kicker: "Resources" },
          ]}
        />
      }
    >
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={localBusinessJsonLd()} />

      <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-white">Contact & address</h2>
        <div className="mt-3 grid gap-2 text-indigo-200/80">
          <div>
            <span className="font-semibold text-white">Address:</span>{" "}
            {site.address.streetAddress}, {site.address.addressLocality},{" "}
            {site.address.addressRegion} {site.address.postalCode}
          </div>
          <div>
            <span className="font-semibold text-white">Phone:</span>{" "}
            {site.contact.phone}
          </div>
          <div>
            <span className="font-semibold text-white">Email:</span>{" "}
            {site.contact.email}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-white">Map (placeholder)</h2>
        <p className="mt-2 text-indigo-200/70">
          Map embed will go here. This page is scaffolded for Local SEO and can
          be upgraded with a real embed + driving directions widget.
        </p>
        <div className="mt-4 aspect-[16/9] w-full rounded-2xl bg-black/30" />
      </section>
    </PageShell>
  );
}

