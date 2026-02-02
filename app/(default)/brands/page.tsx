import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import RelatedLinks from "@/components/related/RelatedLinks";
import BrowseNext from "@/components/BrowseNext";
import { buildMetadata } from "@/lib/seo";
import { brands, pickSome } from "@/lib/kb-data";

export const metadata: Metadata = buildMetadata({
  pathname: "/brands",
  title: "Brands",
  description:
    "Explore cannabis brands carried at Kine Buds Dispensary in Maywood, NJ. Browse A–Z or jump into a brand profile.",
});

export default function BrandsHubPage() {
  const featured = pickSome(brands, 6);

  return (
    <PageShell
      h1="Brands at Kine Buds"
      crumbs={[{ name: "Brands", href: "/brands" }]}
      intro="Browse brand profiles to learn what we carry, what formats are common, and which strains or terpenes show up frequently."
      askAstro
      related={
        <RelatedLinks
          title="Explore by"
          links={[
            { href: "/brands/a-z", title: "Brands A–Z" },
            { href: "/strains", title: "Strains hub" },
            { href: "/terpenes", title: "Terpenes hub" },
            { href: "/formats", title: "Formats hub" },
            { href: "/shop", title: "Shop hub" },
            { href: "/resources", title: "Resource Library" },
          ]}
        />
      }
      browseNext={
        <BrowseNext
          cards={[
            { href: "/brands/a-z", title: "Browse brands A–Z", kicker: "Brands" },
            { href: "/strains/a-z", title: "Browse strains A–Z", kicker: "Strains" },
            { href: "/terpenes", title: "Terpenes hub", kicker: "Terpenes" },
            { href: "/formats", title: "Formats hub", kicker: "Formats" },
            { href: "/resources", title: "Resource Library", kicker: "Resources" },
            { href: "/shop/flower", title: "Shop Flower", kicker: "Shop" },
          ]}
        />
      }
    >
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-white">Featured brands</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((b) => (
            <Link
              key={b.slug}
              href={`/brands/${b.slug}`}
              className="rounded-2xl border border-white/10 bg-black/20 p-4 hover:bg-white/5"
            >
              <div className="text-sm font-semibold text-white">{b.name}</div>
              <p className="mt-1 text-sm text-indigo-200/70">{b.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

