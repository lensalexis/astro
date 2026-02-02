import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import RelatedLinks from "@/components/related/RelatedLinks";
import BrowseNext from "@/components/BrowseNext";
import { buildMetadata } from "@/lib/seo";
import { terpenes, pickSome } from "@/lib/kb-data";

export const metadata: Metadata = buildMetadata({
  pathname: "/terpenes",
  title: "Terpenes",
  description:
    "Terpene knowledge base for Kine Buds Dispensary: aroma, flavor, and where terpenes commonly appear.",
});

export default function TerpenesHubPage() {
  const featured = pickSome(terpenes, 6);

  return (
    <PageShell
      h1="Terpenes: aroma, flavor, and experience"
      crumbs={[{ name: "Terpenes", href: "/terpenes" }]}
      intro="Terpenes are aromatic compounds that help explain why strains smell different. Explore terpene pages and then follow links to strains and formats."
      askAstro
      related={
        <RelatedLinks
          title="Explore next"
          links={[
            { href: "/strains", title: "Strains hub" },
            { href: "/brands", title: "Brands hub" },
            { href: "/formats", title: "Formats hub" },
            { href: "/resources", title: "Resource Library" },
            { href: "/use-cases", title: "Use-cases hub" },
            { href: "/shop", title: "Shop hub" },
          ]}
        />
      }
      browseNext={
        <BrowseNext
          cards={[
            { href: "/terpenes/myrcene", title: "Myrcene", kicker: "Terpene" },
            { href: "/terpenes/limonene", title: "Limonene", kicker: "Terpene" },
            { href: "/strains", title: "Strain guides", kicker: "Strains" },
            { href: "/formats", title: "Formats deep dives", kicker: "Formats" },
            { href: "/resources", title: "Resource Library", kicker: "Resources" },
            { href: "/shop/flower", title: "Shop Flower", kicker: "Shop" },
          ]}
        />
      }
    >
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-white">Popular terpenes</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((t) => (
            <Link
              key={t.slug}
              href={`/terpenes/${t.slug}`}
              className="rounded-2xl border border-white/10 bg-black/20 p-4 hover:bg-white/5"
            >
              <div className="text-sm font-semibold text-white">{t.name}</div>
              <p className="mt-1 text-sm text-indigo-200/70">{t.aroma}</p>
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

