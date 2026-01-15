import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import RelatedLinks from "@/components/related/RelatedLinks";
import BrowseNext from "@/components/BrowseNext";
import { buildMetadata } from "@/lib/seo";
import { learnPosts } from "@/lib/kb-data";

export const metadata: Metadata = buildMetadata({
  pathname: "/learn/how-it-works",
  title: "How it works",
  description:
    "Educational how-it-works content: terpenes, formats, and common shopping concepts (non-medical).",
});

export default function LearnHowItWorksPage() {
  const posts = learnPosts.filter((p) => p.categorySlug === "how-it-works");

  return (
    <PageShell
      h1="How it works"
      crumbs={[
        { name: "Learn", href: "/learn" },
        { name: "How it works", href: "/learn/how-it-works" },
      ]}
      intro="Understand key concepts like terpenes, format timing, and how to compare products—without the jargon."
      askAstro
      related={
        <RelatedLinks
          title="Explore related hubs"
          links={[
            { href: "/terpenes", title: "Terpenes hub" },
            { href: "/formats", title: "Formats hub" },
            { href: "/strains", title: "Strain guides" },
            { href: "/brands", title: "Brands hub" },
            { href: "/shop", title: "Shop hub" },
            { href: "/learn/beginners", title: "Beginner guides" },
          ]}
        />
      }
      browseNext={
        <BrowseNext
          cards={[
            { href: "/terpenes", title: "Terpenes hub", kicker: "Terpenes" },
            { href: "/terpenes/limonene", title: "Limonene", kicker: "Terpenes" },
            { href: "/formats", title: "Formats hub", kicker: "Formats" },
            { href: "/formats/edibles", title: "Edibles guide", kicker: "Formats" },
            { href: "/strains", title: "Strain guides", kicker: "Strains" },
            { href: "/brands", title: "Brands", kicker: "Brands" },
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

