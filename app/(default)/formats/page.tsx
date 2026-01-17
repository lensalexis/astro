import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import RelatedLinks from "@/components/related/RelatedLinks";
import BrowseNext from "@/components/BrowseNext";
import { buildMetadata } from "@/lib/seo";
import { formats, formatStarterSlugs } from "@/lib/kb-data";

export const metadata: Metadata = buildMetadata({
  pathname: "/formats",
  title: "Formats",
  description:
    "Formats deep dives: flower, pre-rolls, vapes, edibles, concentrates, and more. Learn timing, tips, and how to shop.",
});

function titleFromSlug(slug: string) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function FormatsHubPage() {
  const starter = Array.from(formatStarterSlugs);

  return (
    <PageShell
      h1="Formats: timing, tips, and how to choose"
      crumbs={[{ name: "Formats", href: "/formats" }]}
      intro="Formats are the easiest way to match a product to your plan. Use these guides to compare onset, duration, and beginner-friendly tips."
      askAstro
      related={
        <RelatedLinks
          title="Explore related hubs"
          links={[
            { href: "/shop", title: "Shop hub" },
            { href: "/terpenes", title: "Terpenes hub" },
            { href: "/strains", title: "Strain guides" },
            { href: "/brands", title: "Brands hub" },
            { href: "/resources", title: "Resources Center" },
            { href: "/use-cases", title: "Use-cases hub" },
          ]}
        />
      }
      browseNext={
        <BrowseNext
          cards={[
            { href: "/formats/flower", title: "Flower guide", kicker: "Format" },
            { href: "/formats/pre-rolls", title: "Pre-Rolls guide", kicker: "Format" },
            { href: "/formats/vapes", title: "Vapes guide", kicker: "Format" },
            { href: "/formats/edibles", title: "Edibles guide", kicker: "Format" },
            { href: "/formats/nano-powders", title: "Nano Powders guide", kicker: "Format" },
            { href: "/formats/concentrates", title: "Concentrates guide", kicker: "Format" },
          ]}
        />
      }
    >
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-white">Starter format guides</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {starter.map((slug) => {
            const fromData = formats.find((f) => f.slug === slug);
            return (
              <Link
                key={slug}
                href={`/formats/${slug}`}
                className="rounded-2xl border border-white/10 bg-black/20 p-4 hover:bg-white/5"
              >
                <div className="text-sm font-semibold text-white">
                  {fromData?.name ?? titleFromSlug(slug)}
                </div>
                <p className="mt-1 text-sm text-indigo-200/70">
                  {fromData?.description ??
                    "Educational guide: what it is, timing basics, and shopping tips."}
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    </PageShell>
  );
}

