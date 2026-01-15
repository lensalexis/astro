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
  learnPosts,
  strains,
  terpenes,
  bySlug,
  pickSome,
} from "@/lib/kb-data";

export function generateStaticParams() {
  return strains.map((s) => ({ strainSlug: s.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { strainSlug: string };
}): Metadata {
  const strain = bySlug(strains, params.strainSlug);
  if (!strain) {
    return buildMetadata({
      pathname: `/strains/${params.strainSlug}`,
      title: "Strain not found",
      description: "This strain page does not exist.",
      noIndex: true,
    });
  }
  return buildMetadata({
    pathname: `/strains/${strain.slug}`,
    title: `${strain.name} guide`,
    description: strain.description,
  });
}

export default function StrainPage({ params }: { params: { strainSlug: string } }) {
  const strain = bySlug(strains, params.strainSlug);
  if (!strain) return notFound();

  const terpLinks = strain.dominantTerpenes
    .map((slug) => bySlug(terpenes, slug))
    .filter(Boolean)
    .map((t) => ({
      href: `/terpenes/${(t as any).slug}`,
      title: (t as any).name,
      description: (t as any).aroma,
    }));

  const brandLinks = strain.relatedBrands
    .map((slug) => bySlug(brands, slug))
    .filter(Boolean)
    .map((b) => ({
      href: `/brands/${(b as any).slug}`,
      title: (b as any).name,
      description: (b as any).description,
    }));

  const formatLinks = pickSome(formats, 4, strain.slug).map((f) => ({
    href: `/formats/${f.slug}`,
    title: f.name,
    description: f.description,
  }));

  const learnLinks = learnPosts
    .filter(
      (p) =>
        p.relatedStrains.includes(strain.slug) ||
        p.relatedTerpenes.some((t) => strain.dominantTerpenes.includes(t))
    )
    .slice(0, 6)
    .map((p) => ({
      href: `/learn/${p.categorySlug}/${p.slug}`,
      title: p.title,
      description: p.excerpt,
    }));

  const browseNext = pickSome(
    strains.filter((s) => s.slug !== strain.slug),
    6,
    strain.slug
  ).map((s) => ({
    href: `/strains/${s.slug}`,
    title: s.name,
    kicker: "Strain",
  }));

  return (
    <PageShell
      h1={`${strain.name} Guide`}
      crumbs={[
        { name: "Strains", href: "/strains" },
        { name: strain.name, href: `/strains/${strain.slug}` },
      ]}
      intro={strain.description}
      askAstro
      related={
        <>
          <RelatedLinks title="Terpene profile" links={terpLinks} />
          <RelatedLinks title="Brands to explore" links={brandLinks} />
          <RelatedLinks title="Formats that match your timeline" links={formatLinks} />
          <RelatedLinks title="Learn articles" links={learnLinks} />
          <RelatedLinks
            title="Explore more"
            links={[
              { href: "/shop", title: "Shop hub" },
              { href: "/formats", title: "Formats hub" },
              { href: "/terpenes", title: "Terpenes hub" },
              { href: "/brands", title: "Brands hub" },
              { href: "/use-cases", title: "Use-cases hub" },
              { href: "/learn", title: "Learn hub" },
            ]}
          />
        </>
      }
      browseNext={<BrowseNext cards={browseNext} />}
    >
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-white">Overview</h2>
        <p className="mt-2 text-indigo-200/70">
          This is an educational strain overview. Effects vary by person, product, and dose.
        </p>
      </section>

      {strain.genetics ? (
        <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold text-white">Genetics</h2>
          <p className="mt-2 text-indigo-200/70">{strain.genetics}</p>
        </section>
      ) : null}

      <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-white">Typical experience (non-medical)</h2>
        <p className="mt-2 text-indigo-200/70">
          Placeholder: describe common reported experiences in a non-medical, educational way.
        </p>
      </section>

      <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-white">Best use-cases (non-medical)</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {strain.commonUseCases.map((u) => (
            <Link
              key={u}
              href={`/use-cases/${u}`}
              className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-sm text-indigo-200/80 hover:bg-white/5"
            >
              {u}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-white">Products available (placeholder)</h2>
        <p className="mt-2 text-indigo-200/70">
          Placeholder: this section can later pull live inventory from AIQ / Dispense and show in-stock items.
        </p>
      </section>
    </PageShell>
  );
}

