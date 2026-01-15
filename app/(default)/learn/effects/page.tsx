import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import RelatedLinks from "@/components/related/RelatedLinks";
import BrowseNext from "@/components/BrowseNext";
import { buildMetadata } from "@/lib/seo";
import { learnPosts } from "@/lib/kb-data";

export const metadata: Metadata = buildMetadata({
  pathname: "/learn/effects",
  title: "Effects articles",
  description:
    "Educational articles about how shoppers think about experiences and product selection (non-medical).",
});

export default function LearnEffectsPage() {
  const posts = learnPosts.filter((p) => p.categorySlug === "effects");

  return (
    <PageShell
      h1="Effects-focused learning (non-medical)"
      crumbs={[
        { name: "Learn", href: "/learn" },
        { name: "Effects", href: "/learn/effects" },
      ]}
      intro="These articles are educational and non-medical. They focus on how people build a shopping shortlist using formats, aroma/terpenes, and timing."
      askAstro
      related={
        <RelatedLinks
          title="Explore related"
          links={[
            { href: "/use-cases", title: "Use-cases hub" },
            { href: "/terpenes", title: "Terpenes hub" },
            { href: "/formats", title: "Formats hub" },
            { href: "/strains", title: "Strain guides" },
            { href: "/shop", title: "Shop hub" },
            { href: "/learn/beginners", title: "Beginner guides" },
          ]}
        />
      }
      browseNext={
        <BrowseNext
          cards={[
            { href: "/use-cases/relaxation", title: "Relaxation guide", kicker: "Use-cases" },
            { href: "/use-cases/focus", title: "Focus guide", kicker: "Use-cases" },
            { href: "/formats/flower", title: "Flower guide", kicker: "Formats" },
            { href: "/formats/edibles", title: "Edibles guide", kicker: "Formats" },
            { href: "/terpenes/limonene", title: "Limonene", kicker: "Terpenes" },
            { href: "/terpenes/myrcene", title: "Myrcene", kicker: "Terpenes" },
          ]}
        />
      }
    >
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-white">Articles</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <Link
              key={p.slug}
              href={`/learn/${p.categorySlug}/${p.slug}`}
              className="rounded-2xl border border-white/10 bg-black/20 p-4 hover:bg-white/5"
            >
              <div className="text-sm font-semibold text-white">{p.title}</div>
              <p className="mt-1 text-sm text-indigo-200/70">{p.excerpt}</p>
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

