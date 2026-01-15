import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import RelatedLinks from "@/components/related/RelatedLinks";
import BrowseNext from "@/components/BrowseNext";
import { buildMetadata } from "@/lib/seo";
import { nearMeLocations } from "@/lib/kb-data";

export const metadata: Metadata = buildMetadata({
  pathname: "/near-me",
  title: "Dispensary near me",
  description:
    "Local pages for people searching for a dispensary near Maywood and nearby Bergen County towns.",
});

export default function NearMeHubPage() {
  return (
    <PageShell
      h1="Dispensary near me (local pages)"
      crumbs={[{ name: "Near me", href: "/near-me" }]}
      intro="Browse local pages for nearby towns. These are informational pages designed to help people find Kine Buds in Maywood, NJ."
      askAstro
      related={
        <RelatedLinks
          title="Local visit pages"
          links={[
            { href: "/location", title: "Location" },
            { href: "/directions", title: "Directions" },
            { href: "/parking", title: "Parking" },
            { href: "/hours", title: "Hours" },
            { href: "/store-info", title: "Store info" },
            { href: "/contact", title: "Contact" },
          ]}
        />
      }
      browseNext={
        <BrowseNext
          cards={[
            { href: "/near-me/maywood-nj", title: "Maywood, NJ", kicker: "Near me" },
            { href: "/near-me/hackensack-nj", title: "Hackensack, NJ", kicker: "Near me" },
            { href: "/shop", title: "Shop hub", kicker: "Shop" },
            { href: "/learn", title: "Learn hub", kicker: "Learn" },
            { href: "/brands", title: "Brands", kicker: "Brands" },
            { href: "/strains", title: "Strains", kicker: "Strains" },
          ]}
        />
      }
    >
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-white">Nearby locations</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {nearMeLocations.map((l) => (
            <Link
              key={l.slug}
              href={`/near-me/${l.slug}`}
              className="rounded-2xl border border-white/10 bg-black/20 p-4 hover:bg-white/5"
            >
              <div className="text-sm font-semibold text-white">{l.name}</div>
              <p className="mt-1 text-sm text-indigo-200/70">{l.intro}</p>
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

