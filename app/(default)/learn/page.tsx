import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import RelatedLinks from "@/components/related/RelatedLinks";
import BrowseNext from "@/components/BrowseNext";
import { buildMetadata } from "@/lib/seo";
import { learnCategorySlugs, learnPosts } from "@/lib/kb-data";

function titleFromSlug(slug: string) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export const metadata: Metadata = buildMetadata({
  pathname: "/learn",
  title: "Learn",
  description:
    "Cannabis education hub: beginner guides, effects-focused articles, how it works, and industry basics (educational, non-medical).",
});

export default function LearnHubPage() {
  const featured = [...learnPosts]
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))
    .slice(0, 6);

  return (
    <PageShell
      h1="Learn: cannabis education (non-medical)"
      crumbs={[{ name: "Learn", href: "/learn" }]}
      intro="Explore beginner-friendly guides, how-it-works explanations, and practical shopping knowledge—built to support confident, informed decisions."
      askAstro
      related={
        <RelatedLinks
          title="Browse learn categories"
          links={Array.from(learnCategorySlugs).map((c) => ({
            href: `/learn/${c}`,
            title: titleFromSlug(c),
            description: `Articles in the ${titleFromSlug(c)} category.`,
          }))}
        />
      }
      browseNext={
        <BrowseNext
          cards={[
            { href: "/learn/beginners", title: "Beginner guides", kicker: "Learn" },
            { href: "/learn/effects", title: "Effects articles", kicker: "Learn" },
            { href: "/learn/how-it-works", title: "How it works", kicker: "Learn" },
            { href: "/learn/industry", title: "Industry basics", kicker: "Learn" },
            { href: "/formats", title: "Formats", kicker: "Formats" },
            { href: "/terpenes", title: "Terpenes", kicker: "Terpenes" },
          ]}
        />
      }
    >
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-white">Featured articles</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p) => (
            <Link
              key={`${p.categorySlug}-${p.slug}`}
              href={`/learn/${p.categorySlug}/${p.slug}`}
              className="rounded-2xl border border-white/10 bg-black/20 p-4 hover:bg-white/5"
            >
              <div className="text-sm font-semibold text-white">{p.title}</div>
              <p className="mt-1 text-sm text-indigo-200/70">{p.excerpt}</p>
              <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-indigo-200/60">
                {titleFromSlug(p.categorySlug)}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

