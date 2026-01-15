import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import RelatedLinks from "@/components/related/RelatedLinks";
import BrowseNext from "@/components/BrowseNext";
import { buildMetadata } from "@/lib/seo";
import { learnPosts } from "@/lib/kb-data";

export const metadata: Metadata = buildMetadata({
  pathname: "/learn/beginners",
  title: "Beginner guides",
  description:
    "Beginner-friendly cannabis education: formats, labels, and how to shop with confidence (educational, non-medical).",
});

export default function LearnBeginnersPage() {
  const posts = learnPosts.filter((p) => p.categorySlug === "beginners");

  return (
    <PageShell
      h1="Beginner guides"
      crumbs={[
        { name: "Learn", href: "/learn" },
        { name: "Beginners", href: "/learn/beginners" },
      ]}
      intro="Start here for simple language, format basics, and shopping tips. Educational only."
      askAstro
      related={
        <RelatedLinks
          title="Related hubs"
          links={[
            { href: "/formats", title: "Formats deep dives" },
            { href: "/terpenes", title: "Terpenes knowledge base" },
            { href: "/strains", title: "Strain guides" },
            { href: "/shop", title: "Shop hub" },
            { href: "/first-time-visitors", title: "First-time visitors" },
            { href: "/faq", title: "FAQ" },
          ]}
        />
      }
      browseNext={
        <BrowseNext
          cards={[
            { href: "/learn/how-it-works", title: "How it works", kicker: "Learn" },
            { href: "/formats/edibles", title: "Edibles guide", kicker: "Formats" },
            { href: "/formats/vapes", title: "Vapes guide", kicker: "Formats" },
            { href: "/shop/flower", title: "Shop Flower", kicker: "Shop" },
            { href: "/shop/edibles", title: "Shop Edibles", kicker: "Shop" },
            { href: "/use-cases/relaxation", title: "Relaxation guide", kicker: "Use-cases" },
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

