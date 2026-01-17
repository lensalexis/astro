import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import { buildMetadata } from "@/lib/seo";
import RelatedLinks from "@/components/related/RelatedLinks";
import BrowseNext from "@/components/BrowseNext";

export const metadata: Metadata = buildMetadata({
  pathname: "/hours",
  title: "Hours",
  description: "Store hours for Kine Buds Dispensary in Maywood, NJ.",
});

export default function HoursPage() {
  return (
    <PageShell
      h1="Dispensary Hours (Maywood, NJ)"
      crumbs={[
        { name: "Store info", href: "/store-info" },
        { name: "Hours", href: "/hours" },
      ]}
      intro="Check current store hours before you visit. This page is scaffolded for strong Local SEO and can be updated anytime."
      askAstro
      related={
        <RelatedLinks
          title="More visit planning"
          links={[
            { href: "/location", title: "Location" },
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
            { href: "/shop", title: "Shop hub", kicker: "Shop" },
            { href: "/resources", title: "Resources Center", kicker: "Resources" },
            { href: "/use-cases/sleep", title: "Sleep use-case guide", kicker: "Use-cases" },
            { href: "/formats/edibles", title: "Edibles guide", kicker: "Formats" },
            { href: "/formats/vapes", title: "Vapes guide", kicker: "Formats" },
            { href: "/terpenes/myrcene", title: "Myrcene guide", kicker: "Terpenes" },
          ]}
        />
      }
    >
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-white">Today’s hours</h2>
        <p className="mt-2 text-indigo-200/70">
          Placeholder. Add weekly hours, holiday notes, and “open now” logic if
          desired.
        </p>
        <div className="mt-4 grid gap-2 text-indigo-200/80">
          <div>Mon: 10:00am – 9:00pm</div>
          <div>Tue: 10:00am – 9:00pm</div>
          <div>Wed: 10:00am – 9:00pm</div>
          <div>Thu: 10:00am – 9:00pm</div>
          <div>Fri: 10:00am – 10:00pm</div>
          <div>Sat: 10:00am – 10:00pm</div>
          <div>Sun: 11:00am – 8:00pm</div>
        </div>
      </section>
    </PageShell>
  );
}

