import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageShell from "@/components/PageShell";
import RelatedLinks from "@/components/related/RelatedLinks";
import BrowseNext from "@/components/BrowseNext";
import { buildMetadata } from "@/lib/seo";
import { strains, terpenes, bySlug, pickSome } from "@/lib/kb-data";

export function generateStaticParams() {
  return terpenes.map((t) => ({ terpeneSlug: t.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { terpeneSlug: string };
}): Metadata {
  const terp = bySlug(terpenes, params.terpeneSlug);
  if (!terp) {
    return buildMetadata({
      pathname: `/terpenes/${params.terpeneSlug}`,
      title: "Terpene not found",
      description: "This terpene page does not exist.",
      noIndex: true,
    });
  }
  return buildMetadata({
    pathname: `/terpenes/${terp.slug}`,
    title: `${terp.name} terpene`,
    description: `${terp.name}: ${terp.aroma}. ${terp.description}`,
  });
}

export default function TerpenePage({ params }: { params: { terpeneSlug: string } }) {
  const terp = bySlug(terpenes, params.terpeneSlug);
  if (!terp) return notFound();

  const strainLinks = terp.commonInStrains
    .map((slug) => bySlug(strains, slug))
    .filter(Boolean)
    .map((s) => ({
      href: `/strains/${(s as any).slug}`,
      title: (s as any).name,
      description: (s as any).description,
    }));

  const browseNext = pickSome(
    terpenes.filter((t) => t.slug !== terp.slug),
    6,
    terp.slug
  ).map((t) => ({
    href: `/terpenes/${t.slug}`,
    title: t.name,
    kicker: "Terpene",
  }));

  return (
    <PageShell
      h1={`${terp.name}: Aroma, Flavor, and Experience`}
      crumbs={[
        { name: "Terpenes", href: "/terpenes" },
        { name: terp.name, href: `/terpenes/${terp.slug}` },
      ]}
      intro={terp.description}
      askAstro
      related={
        <>
          <RelatedLinks title="Strains where it appears" links={strainLinks} />
          <RelatedLinks
            title="Explore more"
            links={[
              { href: "/terpenes", title: "All terpenes" },
              { href: "/strains", title: "Strain guides" },
              { href: "/formats", title: "Formats deep dives" },
              { href: "/brands", title: "Brands" },
              { href: "/learn/how-it-works", title: "How it works articles" },
              { href: "/shop", title: "Shop hub" },
            ]}
          />
        </>
      }
      browseNext={<BrowseNext cards={browseNext} />}
    >
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-white">Aroma / flavor</h2>
        <p className="mt-2 text-indigo-200/70">{terp.aroma}</p>
      </section>

      <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-white">Where it appears</h2>
        <p className="mt-2 text-indigo-200/70">
          Terpenes show up across many strains and product types. For the most helpful shopping experience, compare terpene profiles
          and then choose a format that matches your timeline.
        </p>
      </section>

      <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-white">Strains at Kine Buds (links)</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {strainLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-sm text-indigo-200/80 hover:bg-white/5"
            >
              {l.title}
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

