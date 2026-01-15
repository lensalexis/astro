import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import RelatedLinks from "@/components/related/RelatedLinks";
import BrowseNext from "@/components/BrowseNext";
import { buildMetadata } from "@/lib/seo";
import { strains, pickSome } from "@/lib/kb-data";

export const metadata: Metadata = buildMetadata({
  pathname: "/strains",
  title: "Strains",
  description:
    "Explore strain guides at Kine Buds Dispensary—overview, genetics (when known), terpene profile, and related formats.",
});

export default function StrainsHubPage() {
  const featured = pickSome(strains, 6);

  return (
    <PageShell
      h1="Strain guides"
      crumbs={[{ name: "Strains", href: "/strains" }]}
      intro="Use strain pages as an educational starting point: learn the terpene profile, explore related brands, and find a format that matches your timeline."
      askAstro
      related={
        <RelatedLinks
          title="Explore by"
          links={[
            { href: "/strains/a-z", title: "Strains A–Z" },
            { href: "/terpenes", title: "Terpenes hub" },
            { href: "/formats", title: "Formats hub" },
            { href: "/brands", title: "Brands hub" },
            { href: "/use-cases", title: "Use-cases hub" },
            { href: "/learn", title: "Learn hub" },
          ]}
        />
      }
      browseNext={
        <BrowseNext
          cards={[
            { href: "/strains/a-z", title: "Browse strains A–Z", kicker: "Strains" },
            { href: "/terpenes/limonene", title: "Limonene guide", kicker: "Terpenes" },
            { href: "/formats/flower", title: "Flower guide", kicker: "Formats" },
            { href: "/shop/flower", title: "Shop Flower", kicker: "Shop" },
            { href: "/learn/effects", title: "Effects articles", kicker: "Learn" },
            { href: "/use-cases/focus", title: "Focus guide", kicker: "Use-cases" },
          ]}
        />
      }
    >
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-white">Featured strains</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((s) => (
            <Link
              key={s.slug}
              href={`/strains/${s.slug}`}
              className="rounded-2xl border border-white/10 bg-black/20 p-4 hover:bg-white/5"
            >
              <div className="text-sm font-semibold text-white">{s.name}</div>
              <p className="mt-1 text-sm text-indigo-200/70">{s.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

