import type { Metadata } from "next";
import { site } from "@/lib/site";

function ensureLeadingSlash(pathname: string) {
  if (!pathname.startsWith("/")) return `/${pathname}`;
  return pathname;
}

export function absoluteUrl(pathname: string) {
  return new URL(ensureLeadingSlash(pathname), site.url).toString();
}

type BuildMetadataArgs = {
  title?: string;
  description?: string;
  pathname: string;
  ogImage?: string;
  noIndex?: boolean;
};

export function buildMetadata({
  title,
  description,
  pathname,
  ogImage,
  noIndex,
}: BuildMetadataArgs): Metadata {
  const canonical = ensureLeadingSlash(pathname);
  const pageTitle = title ? `${title} | ${site.name}` : site.defaultTitle;
  const pageDescription = description ?? site.defaultDescription;
  const image = ogImage ?? site.ogImage;

  return {
    metadataBase: new URL(site.url),
    title: pageTitle,
    description: pageDescription,
    alternates: {
      canonical,
    },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      type: "website",
      siteName: site.name,
      title: pageTitle,
      description: pageDescription,
      url: canonical,
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      site: site.twitterHandle,
      creator: site.twitterHandle,
      title: pageTitle,
      description: pageDescription,
      images: [image],
    },
  };
}

