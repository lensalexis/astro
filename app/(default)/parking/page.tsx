import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import { buildMetadata } from "@/lib/seo";
import RelatedLinks from "@/components/related/RelatedLinks";
import BrowseNext from "@/components/BrowseNext";

export const metadata: Metadata = buildMetadata({
  pathname: "/parking",
  title: "Parking",
  description: "Parking info for Kine Buds Dispensary in Maywood, NJ.",
});

export default function ParkingPage() {
  return (
    <PageShell
      h1="Parking at Kine Buds (Maywood, NJ)"
      crumbs={[
        { name: "Store info", href: "/store-info" },
        { name: "Parking", href: "/parking" },
      ]}
      intro="Find the easiest place to park for a quick in-and-out visit. This page is scaffolded and can be updated with exact lot details."
      askAstro
      related={
        <RelatedLinks
          title="Visit planning"
          links={[
            { href: "/directions", title: "Directions" },
            { href: "/location", title: "Location" },
            { href: "/hours", title: "Hours" },
            { href: "/first-time-visitors", title: "First-time visitors" },
            { href: "/faq", title: "FAQ" },
            { href: "/contact", title: "Contact" },
          ]}
        />
      }
      browseNext={
        <BrowseNext
          cards={[
            { href: "/shop/pre-rolls", title: "Shop Pre-Rolls", kicker: "Shop" },
            { href: "/shop/vapes", title: "Shop Vapes", kicker: "Shop" },
            { href: "/formats/pre-rolls", title: "Pre-Rolls guide", kicker: "Formats" },
            { href: "/formats/vapes", title: "Vapes guide", kicker: "Formats" },
            { href: "/use-cases/relaxation", title: "Relaxation guide", kicker: "Use-cases" },
            { href: "/resources", title: "Resources Center", kicker: "Resources" },
          ]}
        />
      }
    >
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-white">Parking notes</h2>
        <ul className="mt-3 list-disc pl-5 text-indigo-200/80">
          <li>Placeholder: on-site parking availability and signage notes.</li>
          <li>Placeholder: nearby street parking guidance (if applicable).</li>
          <li>Placeholder: accessibility and entrance notes.</li>
        </ul>
      </section>
    </PageShell>
  );
}

