import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import RelatedLinks from "@/components/related/RelatedLinks";
import BrowseNext from "@/components/BrowseNext";
import { buildMetadata } from "@/lib/seo";
import { useCaseSlugs } from "@/lib/kb-data";

function titleFromSlug(slug: string) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export const metadata: Metadata = buildMetadata({
  pathname: "/use-cases",
  title: "Use-cases",
  description:
    "Educational, non-medical use-case guides: relaxation, creativity, focus, and sleep. Explore terpene and format considerations.",
});

export default function UseCasesHubPage() {
  return (
    <PageShell
      h1="Use-cases (educational, non-medical)"
      crumbs={[{ name: "Use-cases", href: "/use-cases" }]}
      intro="These pages are non-medical, educational guides to how people commonly browse products by goals—using terpene and format considerations."
      askAstro
      related={
        <RelatedLinks
          title="Related hubs"
          links={[
            { href: "/terpenes", title: "Terpenes hub" },
            { href: "/formats", title: "Formats hub" },
            { href: "/strains", title: "Strain guides" },
            { href: "/learn/effects", title: "Effects articles" },
            { href: "/shop", title: "Shop hub" },
            { href: "/learn", title: "Learn hub" },
          ]}
        />
      }
      browseNext={
        <BrowseNext
          cards={[
            { href: "/use-cases/relaxation", title: "Relaxation", kicker: "Use-case" },
            { href: "/use-cases/creativity", title: "Creativity", kicker: "Use-case" },
            { href: "/use-cases/focus", title: "Focus", kicker: "Use-case" },
            { href: "/use-cases/sleep", title: "Sleep", kicker: "Use-case" },
            { href: "/formats", title: "Formats", kicker: "Formats" },
            { href: "/terpenes", title: "Terpenes", kicker: "Terpenes" },
          ]}
        />
      }
    >
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-white">Browse use-cases</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from(useCaseSlugs).map((u) => (
            <Link
              key={u}
              href={`/use-cases/${u}`}
              className="rounded-2xl border border-white/10 bg-black/20 p-4 text-center hover:bg-white/5"
            >
              <div className="text-sm font-semibold text-white">{titleFromSlug(u)}</div>
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

