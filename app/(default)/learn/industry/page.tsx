import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import RelatedLinks from "@/components/related/RelatedLinks";
import BrowseNext from "@/components/BrowseNext";
import { buildMetadata } from "@/lib/seo";
import { learnPosts } from "@/lib/kb-data";

export const metadata: Metadata = buildMetadata({
  pathname: "/learn/industry",
  title: "Industry basics",
  description:
    "High-level cannabis shopping and industry basics for New Jersey (educational, non-medical).",
});

export default function LearnIndustryPage() {
  const posts = learnPosts.filter((p) => p.categorySlug === "industry");

  return (
    <PageShell
      h1="Industry basics"
      crumbs={[
        { name: "Learn", href: "/learn" },
        { name: "Industry", href: "/learn/industry" },
      ]}
      intro="High-level, educational context—shopping basics, what to expect, and practical planning notes."
      askAstro
      related={
        <RelatedLinks
          title="Helpful pages"
          links={[
            { href: "/first-time-visitors", title: "First-time visitors" },
            { href: "/store-info", title: "Store info" },
            { href: "/faq", title: "FAQ" },
            { href: "/learn/beginners", title: "Beginner guides" },
            { href: "/formats", title: "Formats hub" },
            { href: "/shop", title: "Shop hub" },
          ]}
        />
      }
      browseNext={
        <BrowseNext
          cards={[
            { href: "/store-info", title: "Store info", kicker: "Local" },
            { href: "/location", title: "Location", kicker: "Local" },
            { href: "/hours", title: "Hours", kicker: "Local" },
            { href: "/shop", title: "Shop hub", kicker: "Shop" },
            { href: "/learn/beginners", title: "Beginner guides", kicker: "Learn" },
            { href: "/formats", title: "Formats", kicker: "Formats" },
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

