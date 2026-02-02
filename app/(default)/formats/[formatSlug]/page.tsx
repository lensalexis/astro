import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageShell from "@/components/PageShell";
import RelatedLinks from "@/components/related/RelatedLinks";
import BrowseNext from "@/components/BrowseNext";
import { buildMetadata } from "@/lib/seo";
import {
  brands,
  formats,
  formatStarterSlugs,
  strains,
  useCaseSlugs,
  bySlug,
  pickSome,
} from "@/lib/kb-data";

function titleFromSlug(slug: string) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function generateStaticParams() {
  const unique = new Set<string>([
    ...formats.map((f) => f.slug),
    ...formatStarterSlugs,
  ]);
  return Array.from(unique).map((formatSlug) => ({ formatSlug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ formatSlug: string }>;
}): Promise<Metadata> {
  const { formatSlug } = await params;
  const f = bySlug(formats, formatSlug);
  const name = f?.name ?? titleFromSlug(formatSlug);
  const description =
    f?.description ??
    "Educational guide: what this format is, timing basics, and beginner-friendly shopping tips.";

  return buildMetadata({
    pathname: `/formats/${formatSlug}`,
    title: `${name} guide`,
    description,
  });
}

export default async function FormatPage({
  params,
}: {
  params: Promise<{ formatSlug: string }>;
}) {
  const { formatSlug } = await params;
  const f = bySlug(formats, formatSlug);

  // Only allow known starters + JSON formats (avoid infinite SEO surface).
  const allowed = new Set<string>([
    ...formats.map((x) => x.slug),
    ...formatStarterSlugs,
  ]);
  if (!allowed.has(formatSlug)) return notFound();

  const name = f?.name ?? titleFromSlug(formatSlug);

  const useCaseLinks = pickSome(Array.from(useCaseSlugs), 4, formatSlug).map((u) => ({
    href: `/use-cases/${u}`,
    title: titleFromSlug(u),
    description: "Educational intent, non-medical.",
  }));

  const relatedStrains = pickSome(strains, 4, formatSlug).map((s) => ({
    href: `/strains/${s.slug}`,
    title: s.name,
    description: s.description,
  }));

  const relatedBrands = pickSome(brands, 4, formatSlug).map((b) => ({
    href: `/brands/${b.slug}`,
    title: b.name,
    description: b.description,
  }));

  const browseNext = pickSome(
    Array.from(formatStarterSlugs).filter((s) => s !== formatSlug),
    6,
    formatSlug
  ).map((slug) => ({
    href: `/formats/${slug}`,
    title: titleFromSlug(slug),
    kicker: "Format",
  }));

  return (
    <PageShell
      h1={`${name} Guide`}
      crumbs={[
        { name: "Formats", href: "/formats" },
        { name, href: `/formats/${formatSlug}` },
      ]}
      intro={
        f?.description ??
        "Educational overview of this format: what it is, general timing notes, and tips for choosing products."
      }
      askAstro
      related={
        <>
          <RelatedLinks title="Format considerations by use-case" links={useCaseLinks} />
          <RelatedLinks title="Strains to explore" links={relatedStrains} />
          <RelatedLinks title="Brands to explore" links={relatedBrands} />
          <RelatedLinks
            title="Explore more"
            links={[
              { href: "/shop", title: "Shop hub" },
              { href: "/terpenes", title: "Terpenes hub" },
              { href: "/strains", title: "Strain guides" },
              { href: "/brands", title: "Brands" },
              { href: "/resources", title: "Resource Library" },
              { href: "/formats", title: "All formats" },
            ]}
          />
        </>
      }
      browseNext={<BrowseNext cards={browseNext} />}
    >
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-white">What it is</h2>
        <p className="mt-2 text-indigo-200/70">
          {f?.description ??
            "Placeholder: explain what this format is in a clear, non-medical, educational way."}
        </p>
      </section>

      <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-white">Onset / duration (general)</h2>
        <p className="mt-2 text-indigo-200/70">
          {f?.typicalOnset ? (
            <>
              <span className="font-semibold text-white">Onset:</span> {f.typicalOnset}
            </>
          ) : (
            "Placeholder: onset depends on product and person."
          )}
        </p>
        <p className="mt-2 text-indigo-200/70">
          {f?.duration ? (
            <>
              <span className="font-semibold text-white">Duration:</span> {f.duration}
            </>
          ) : (
            "Placeholder: duration depends on product and person."
          )}
        </p>
      </section>

      <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-white">Tips for new shoppers</h2>
        <ul className="mt-3 list-disc pl-5 text-indigo-200/80">
          <li>Start low and go slow.</li>
          <li>Pick a product with clear labeling.</li>
          <li>Choose a timeline that matches your plans.</li>
          <li>
            Browse terpene profiles to find aromas you enjoy (see{" "}
            <Link className="underline hover:no-underline text-white" href="/terpenes">
              terpenes
            </Link>
            ).
          </li>
        </ul>
      </section>
    </PageShell>
  );
}

