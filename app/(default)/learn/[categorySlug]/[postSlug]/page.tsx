import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageShell from "@/components/PageShell";
import RelatedLinks from "@/components/related/RelatedLinks";
import BrowseNext from "@/components/BrowseNext";
import { CustomMDX } from "@/components/mdx/mdx";
import { buildMetadata } from "@/lib/seo";
import {
  brands,
  learnPosts,
  strains,
  terpenes,
  bySlug,
  pickSome,
  learnCategorySlugs,
} from "@/lib/kb-data";

function titleFromSlug(slug: string) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function generateStaticParams() {
  return learnPosts.map((p) => ({
    categorySlug: p.categorySlug,
    postSlug: p.slug,
  }));
}

export function generateMetadata({
  params,
}: {
  params: { categorySlug: string; postSlug: string };
}): Metadata {
  const post = learnPosts.find(
    (p) => p.categorySlug === params.categorySlug && p.slug === params.postSlug
  );
  if (!post) {
    return buildMetadata({
      pathname: `/learn/${params.categorySlug}/${params.postSlug}`,
      title: "Article not found",
      description: "This article does not exist.",
      noIndex: true,
    });
  }
  return buildMetadata({
    pathname: `/learn/${post.categorySlug}/${post.slug}`,
    title: post.title,
    description: post.excerpt,
  });
}

export default function LearnPostPage({
  params,
}: {
  params: { categorySlug: string; postSlug: string };
}) {
  const { categorySlug, postSlug } = params;

  if (!learnCategorySlugs.includes(categorySlug as any)) return notFound();

  const post = learnPosts.find((p) => p.categorySlug === categorySlug && p.slug === postSlug);
  if (!post) return notFound();

  const relatedBrandLinks = post.relatedBrands
    .map((slug) => bySlug(brands, slug))
    .filter(Boolean)
    .map((b) => ({
      href: `/brands/${(b as any).slug}`,
      title: (b as any).name,
      description: (b as any).description,
    }));

  const relatedStrainLinks = post.relatedStrains
    .map((slug) => bySlug(strains, slug))
    .filter(Boolean)
    .map((s) => ({
      href: `/strains/${(s as any).slug}`,
      title: (s as any).name,
      description: (s as any).description,
    }));

  const relatedTerpLinks = post.relatedTerpenes
    .map((slug) => bySlug(terpenes, slug))
    .filter(Boolean)
    .map((t) => ({
      href: `/terpenes/${(t as any).slug}`,
      title: (t as any).name,
      description: (t as any).aroma,
    }));

  const browseNext = pickSome(
    learnPosts.filter((p) => !(p.categorySlug === categorySlug && p.slug === postSlug)),
    6,
    `${categorySlug}:${postSlug}`
  ).map((p) => ({
    href: `/learn/${p.categorySlug}/${p.slug}`,
    title: p.title,
    kicker: titleFromSlug(p.categorySlug),
  }));

  return (
    <PageShell
      h1={post.title}
      crumbs={[
        { name: "Learn", href: "/learn" },
        { name: titleFromSlug(categorySlug), href: `/learn/${categorySlug}` },
        { name: post.title, href: `/learn/${categorySlug}/${post.slug}` },
      ]}
      intro={post.excerpt}
      askAstro
      related={
        <>
          <RelatedLinks title="Related strains" links={relatedStrainLinks} />
          <RelatedLinks title="Related terpenes" links={relatedTerpLinks} />
          <RelatedLinks title="Related brands" links={relatedBrandLinks} />
          <RelatedLinks
            title="More to explore"
            links={[
              { href: "/formats", title: "Formats hub" },
              { href: "/strains", title: "Strain guides" },
              { href: "/terpenes", title: "Terpenes hub" },
              { href: "/brands", title: "Brands hub" },
              { href: "/shop", title: "Shop hub" },
              { href: `/learn/${categorySlug}`, title: `${titleFromSlug(categorySlug)} articles` },
            ]}
          />
        </>
      }
      browseNext={<BrowseNext cards={browseNext} />}
    >
      <article className="prose prose-invert max-w-none">
        <CustomMDX source={post.content} />
      </article>
    </PageShell>
  );
}

