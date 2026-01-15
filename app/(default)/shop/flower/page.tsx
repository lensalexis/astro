import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import RelatedLinks from "@/components/related/RelatedLinks";
import BrowseNext from "@/components/BrowseNext";
import { buildMetadata } from "@/lib/seo";
import { brands, strains, terpenes, formats, pickSome, bySlug } from "@/lib/kb-data";

export const metadata: Metadata = buildMetadata({
  pathname: "/shop/flower",
  title: "Shop flower in Maywood, NJ",
  description:
    "Educational flower shopping hub for Maywood, NJ: what to look for, terpene ideas, and links to brands, strains, and format guides. (Not the live menu.)",
});

export default function ShopFlowerLandingPage() {
  const topTerps = pickSome(terpenes, 3, "flower").map((t) => ({
    href: `/terpenes/${t.slug}`,
    title: t.name,
    description: t.aroma,
  }));

  const topBrands = pickSome(brands, 6, "flower").map((b) => ({
    href: `/brands/${b.slug}`,
    title: b.name,
    description: b.description,
  }));

  const topStrains = pickSome(strains, 6, "flower").map((s) => ({
    href: `/strains/${s.slug}`,
    title: s.name,
    description: s.description,
  }));

  const flowerFormat = bySlug(formats, "flower");

  return (
    <PageShell
      h1="Shop Flower in Maywood NJ"
      crumbs={[
        { name: "Shop", href: "/shop" },
        { name: "Flower", href: "/shop/flower" },
      ]}
      intro={
        <>
          <p>
            Flower is the classic format—often chosen for aroma, freshness, and a
            straightforward shopping experience.
          </p>
          <p className="mt-3">
            This page is <span className="font-semibold text-white">not</span>{" "}
            the live menu. It’s a content-augmented hub with educational tips and
            internal links to help you browse confidently.
          </p>
        </>
      }
      askAstro
      related={
        <>
          <RelatedLinks
            title="Format guide"
            links={[
              {
                href: "/formats/flower",
                title: flowerFormat?.name ?? "Flower",
                description:
                  flowerFormat?.description ??
                  "What it is, timing basics, and tips for new shoppers.",
              },
            ]}
          />
          <RelatedLinks title="Top terpene starting points" links={topTerps} />
          <RelatedLinks title="Popular brands to explore" links={topBrands} />
          <RelatedLinks title="Strains to explore" links={topStrains} />
        </>
      }
      browseNext={
        <BrowseNext
          cards={[
            { href: "/shop/pre-rolls", title: "Shop Pre-Rolls", kicker: "Shop" },
            { href: "/shop/vapes", title: "Shop Vapes", kicker: "Shop" },
            { href: "/shop/edibles", title: "Shop Edibles", kicker: "Shop" },
            { href: "/terpenes", title: "Terpenes hub", kicker: "Terpenes" },
            { href: "/strains", title: "Strain guides", kicker: "Strains" },
            { href: "/brands", title: "Brands", kicker: "Brands" },
          ]}
        />
      }
    >
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-white">How to shop flower (educational)</h2>
        <ul className="mt-3 list-disc pl-5 text-indigo-200/80">
          <li>Look for freshness and clear labeling.</li>
          <li>Choose aromas you enjoy; terpene profile is a useful guide.</li>
          <li>Pick a dose and stick with it for consistency.</li>
        </ul>
      </section>
    </PageShell>
  );
}

