import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageShell from "@/components/PageShell";
import RelatedLinks from "@/components/related/RelatedLinks";
import BrowseNext from "@/components/BrowseNext";
import { buildMetadata } from "@/lib/seo";
import { brands, formats, strains, terpenes, bySlug, pickSome } from "@/lib/kb-data";

export function generateStaticParams() {
  return brands.map((b) => ({ brandSlug: b.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { brandSlug: string };
}): Metadata {
  const brand = bySlug(brands, params.brandSlug);
  if (!brand) {
    return buildMetadata({
      pathname: `/brands/${params.brandSlug}`,
      title: "Brand not found",
      description: "This brand page does not exist.",
      noIndex: true,
    });
  }

  return buildMetadata({
    pathname: `/brands/${brand.slug}`,
    title: `${brand.name} at Kine Buds`,
    description: brand.description,
  });
}

export default function BrandPage({ params }: { params: { brandSlug: string } }) {
  const brand = bySlug(brands, params.brandSlug);
  if (!brand) return notFound();

  const carriedFormats = brand.carriedFormats
    .map((slug) => bySlug(formats, slug))
    .filter(Boolean)
    .map((f) => ({
      href: `/formats/${(f as any).slug}`,
      title: (f as any).name,
      description: (f as any).description,
    }));

  const relatedStrains = brand.featuredStrains
    .map((slug) => bySlug(strains, slug))
    .filter(Boolean)
    .map((s) => ({
      href: `/strains/${(s as any).slug}`,
      title: (s as any).name,
      description: (s as any).description,
    }));

  const relatedTerpenes = brand.featuredTerpenes
    .map((slug) => bySlug(terpenes, slug))
    .filter(Boolean)
    .map((t) => ({
      href: `/terpenes/${(t as any).slug}`,
      title: (t as any).name,
      description: (t as any).aroma,
    }));

  const browseNext = pickSome(brands.filter((b) => b.slug !== brand.slug), 6, brand.slug).map((b) => ({
    href: `/brands/${b.slug}`,
    title: b.name,
    kicker: "Brand",
  }));

  return (
    <PageShell
      h1={`${brand.name} at Kine Buds`}
      crumbs={[
        { name: "Brands", href: "/brands" },
        { name: brand.name, href: `/brands/${brand.slug}` },
      ]}
      intro={brand.description}
      askAstro
      related={
        <>
          <RelatedLinks title={`What we carry from ${brand.name}`} links={carriedFormats} />
          <RelatedLinks title="Featured strains" links={relatedStrains} />
          <RelatedLinks title="Featured terpenes" links={relatedTerpenes} />
          <RelatedLinks
            title="Keep exploring"
            links={[
              { href: "/shop", title: "Shop hub" },
              { href: "/strains", title: "Strains hub" },
              { href: "/terpenes", title: "Terpenes hub" },
              { href: "/formats", title: "Formats hub" },
              { href: "/learn", title: "Learn hub" },
              { href: "/brands/a-z", title: "Brands A–Z" },
            ]}
          />
        </>
      }
      browseNext={<BrowseNext cards={browseNext} />}
    >
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-white">Brand story (placeholder)</h2>
        <div className="mt-3 space-y-3 text-indigo-200/70">
          <p>
            This section is reserved for a short brand story: what {brand.name} is known for,
            how they approach quality, and why shoppers look for them.
          </p>
          <p>
            If you’re shopping today, you can browse current availability on the live menu, or use the Shop hub for
            educational filtering by format, strain, or terpene profile.
          </p>
        </div>
      </section>

      {brand.website ? (
        <section className="mt-6 text-sm text-indigo-200/70">
          <p>
            Official site:{" "}
            <Link className="text-white underline hover:no-underline" href={brand.website}>
              {brand.website}
            </Link>
          </p>
        </section>
      ) : null}
    </PageShell>
  );
}

