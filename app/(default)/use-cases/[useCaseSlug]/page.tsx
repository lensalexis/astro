import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageShell from "@/components/PageShell";
import RelatedLinks from "@/components/related/RelatedLinks";
import BrowseNext from "@/components/BrowseNext";
import { buildMetadata } from "@/lib/seo";
import { formats, strains, terpenes, useCaseSlugs, pickSome } from "@/lib/kb-data";

function titleFromSlug(slug: string) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function generateStaticParams() {
  return Array.from(useCaseSlugs).map((useCaseSlug) => ({ useCaseSlug }));
}

export function generateMetadata({
  params,
}: {
  params: { useCaseSlug: string };
}): Metadata {
  if (!useCaseSlugs.includes(params.useCaseSlug as any)) {
    return buildMetadata({
      pathname: `/use-cases/${params.useCaseSlug}`,
      title: "Use-case not found",
      description: "This use-case page does not exist.",
      noIndex: true,
    });
  }
  const name = titleFromSlug(params.useCaseSlug);
  return buildMetadata({
    pathname: `/use-cases/${params.useCaseSlug}`,
    title: `For ${name}: a helpful guide`,
    description: `Educational, non-medical guide for ${name}: what people look for, terpene considerations, and format considerations.`,
  });
}

export default function UseCasePage({ params }: { params: { useCaseSlug: string } }) {
  const useCaseSlug = params.useCaseSlug;
  if (!useCaseSlugs.includes(useCaseSlug as any)) return notFound();

  const name = titleFromSlug(useCaseSlug);

  const terpLinks = pickSome(terpenes, 3, useCaseSlug).map((t) => ({
    href: `/terpenes/${t.slug}`,
    title: t.name,
    description: t.aroma,
  }));

  const formatLinks = pickSome(formats, 4, useCaseSlug).map((f) => ({
    href: `/formats/${f.slug}`,
    title: f.name,
    description: f.description,
  }));

  const strainLinks = pickSome(
    strains.filter((s) => s.commonUseCases.includes(useCaseSlug)),
    6,
    useCaseSlug
  ).map((s) => ({
    href: `/strains/${s.slug}`,
    title: s.name,
    description: s.description,
  }));

  const browseNext = pickSome(
    Array.from(useCaseSlugs).filter((s) => s !== useCaseSlug),
    6,
    useCaseSlug
  ).map((slug) => ({
    href: `/use-cases/${slug}`,
    title: titleFromSlug(slug),
    kicker: "Use-case",
  }));

  return (
    <PageShell
      h1={`For ${name}: A Helpful Guide`}
      crumbs={[
        { name: "Use-cases", href: "/use-cases" },
        { name, href: `/use-cases/${useCaseSlug}` },
      ]}
      intro="This page is educational and non-medical. Use it to build a shortlist using format timing and terpene aroma preferences."
      askAstro
      related={
        <>
          <RelatedLinks title="Terpene considerations (starting points)" links={terpLinks} />
          <RelatedLinks title="Format considerations" links={formatLinks} />
          <RelatedLinks title="Strains to explore" links={strainLinks} />
          <RelatedLinks
            title="Explore more"
            links={[
              { href: "/shop", title: "Shop hub" },
              { href: "/formats", title: "Formats hub" },
              { href: "/terpenes", title: "Terpenes hub" },
              { href: "/strains", title: "Strain guides" },
              { href: "/learn/effects", title: "Effects articles" },
              { href: "/use-cases", title: "All use-cases" },
            ]}
          />
        </>
      }
      browseNext={<BrowseNext cards={browseNext} />}
    >
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-white">What people look for</h2>
        <p className="mt-2 text-indigo-200/70">
          Placeholder: summarize the common shopping intent for {name} in a non-medical way (e.g., timing, vibe, setting).
        </p>
      </section>

      <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-white">A simple approach</h2>
        <ul className="mt-3 list-disc pl-5 text-indigo-200/80">
          <li>Pick a format that matches your timeline.</li>
          <li>Use terpene aroma preferences to narrow down.</li>
          <li>Keep dosing consistent; adjust slowly.</li>
          <li>
            If you’re new, start with the{" "}
            <Link className="underline hover:no-underline text-white" href="/learn/beginners">
              beginner guides
            </Link>
            .
          </li>
        </ul>
      </section>
    </PageShell>
  );
}

