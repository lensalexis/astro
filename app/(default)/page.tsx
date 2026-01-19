import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import AIProductSearch from "@/components/AIProductSearch";
import HomeHeroCarousel from "@/components/home/HomeHeroCarousel";
import HomeStartHereContent from "@/components/home/HomeStartHereContent";
import HorizontalRailWithArrows, { type RailItem } from "@/components/home/HorizontalRailWithArrows";
import AmazingExperiences from "@/components/home/AmazingExperiences";
import GoogleReviews from "@/components/GoogleReviews";
import { stores } from "@/lib/stores";
import { getMarketingBannersForPlacement, toHomeStartHereItems } from "@/lib/banners";
import { CATEGORY_DEFS } from "@/lib/catalog";
import productService from "@/lib/productService";
import ProductSlider from "@/components/ui/ProductSlider";

export const metadata: Metadata = {
  title: "Kine Buds Dispensary",
  description:
    "Shop live inventory in Maywood, NJ. Discover deals, explore categories, and search by mood, effects, brand, and price.",
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-950">
            {title}
          </h2>
        </div>
      </div>
      {children}
    </section>
  );
}

export default async function Home() {
  const defaultStoreId = stores[0]?.id;
  const heroSlides = getMarketingBannersForPlacement("homepage_slider", { limit: 8 }).map((b) => ({
    src: b.image,
    alt: b.alt || b.title,
  }));

  const offersForYou = toHomeStartHereItems(
    getMarketingBannersForPlacement("homepage_offers", { limit: 8 })
  );

  // Best sellers (for "Trending right now")
  const bestSellersRes = await productService.list(
    {
      venueId: process.env.DISPENSE_VENUE_ID ?? process.env.NEXT_PUBLIC_DISPENSE_VENUE_ID!,
      limit: 12,
      sort: "-totalSold",
      quantityMin: 1,
    },
    { next: { revalidate: 30, tags: ["dispense:products"] } }
  );

  const trendingProducts = (bestSellersRes.data || []).slice(0, 12);

  // On-sale products (for "Best picks this week")
  const onSaleRes = await productService.list(
    {
      venueId: process.env.DISPENSE_VENUE_ID ?? process.env.NEXT_PUBLIC_DISPENSE_VENUE_ID!,
      limit: 60, // fetch more; we'll filter/sort client-side
      quantityMin: 1,
    },
    { next: { revalidate: 30, tags: ["dispense:products"] } }
  );

  const bestPicksProducts = (onSaleRes.data || [])
    .filter(
      (p: any) =>
        (p.discountValueFinal && p.discountValueFinal > 0) ||
        (p.discountAmountFinal && p.discountAmountFinal > 0) ||
        (p.discounts && p.discounts.length > 0)
    )
    .sort((a: any, b: any) => {
      const aPct = a.discountValueFinal || a.discounts?.[0]?.value || 0;
      const bPct = b.discountValueFinal || b.discounts?.[0]?.value || 0;
      return bPct - aPct;
    })
    .slice(0, 12);

  const categoryThumbs: Record<string, string> = {
    flower: "/images/flower.jpg",
    vaporizers: "/images/vape.jpg",
    edibles: "/images/edible.jpg",
    "pre-rolls": "/images/preroll.jpg",
    concentrates: "/images/concentrates.jpg",
    beverages: "/images/beverage.jpg",
  };

  const topDestinations: RailItem[] = [
    ...CATEGORY_DEFS.map((c) => ({
      title: c.slug === "pre-rolls" ? "Pre Roll" : c.name,
      href: `/shop/${c.slug}`,
      image: categoryThumbs[c.slug] || "/images/default-cover.jpg",
    })),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* TopSearchBar / MainBanner */}
      <div className="mt-0">
        <HomeHeroCarousel slides={heroSlides}>
          <div className="flex h-full w-full items-start pt-16 pb-10 sm:items-end sm:pt-0 sm:pb-12">
            <AIProductSearch
              forceAIMode={true}
              heroOnly={true}
              heroVariant="viator"
              homeResultsPortalId="home-start-here-results"
              currentStoreId={defaultStoreId}
            />
          </div>
        </HomeHeroCarousel>
      </div>

      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-12 space-y-12">
        {/* CentralBanner / Campaigns */}
        <Section
          title="Offers for you"
        >
          <HomeStartHereContent items={offersForYou} variant="banner" />
        </Section>

        {/* TopDestination */}
        <Section
          title="Browse by category"
        >
          <HorizontalRailWithArrows items={topDestinations} variant="category" />
        </Section>

        {/* Trending (Best sellers) */}
        <Section title="Trending right now">
          <ProductSlider products={trendingProducts} />
        </Section>

        {/* Best picks (On sale) */}
        <Section title="Best picks this week">
          <ProductSlider products={bestPicksProducts} />
        </Section>

        {/* Explore (Billboard) */}
        <Section title="Explore">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Top brands",
                href: "/brands",
                icon: "/images/icon-offers.png",
              },
              {
                title: "Strains",
                href: "/strains",
                icon: "/icons/indica-hybrid.svg",
              },
              {
                title: "Terpenes",
                href: "/terpenes",
                icon: "/images/mood.png",
              },
              {
                title: "FAQ",
                href: "/faq",
                icon: "/images/features.png",
              },
            ].map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="group rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-10 overflow-hidden rounded-2xl bg-gray-100 ring-1 ring-black/5">
                    <Image
                      src={card.icon}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-gray-950">{card.title}</div>
                  </div>
                </div>
                <div className="mt-4 text-sm font-semibold text-gray-900">
                  Explore →
                </div>
              </Link>
            ))}
          </div>
        </Section>

        {/* Why people love Kine Buds (Google Reviews) */}
        <Section title="Why people love Kine Buds">
          <GoogleReviews />
        </Section>

        {/* AmazingExperiences (Themes) */}
        <AmazingExperiences />

        {/* MoreToExplore */}
        <Section title="More to explore">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Hours",
                href: "/hours",
              },
              {
                title: "Location",
                href: "/location",
              },
              {
                title: "Parking",
                href: "/parking",
              },
            ].map((x) => (
              <Link
                key={x.href}
                href={x.href}
                className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 hover:shadow-md"
              >
                <div className="text-base font-bold text-gray-950">{x.title}</div>
                <div className="mt-4 text-sm font-semibold text-gray-900">
                  Open →
                </div>
              </Link>
            ))}
          </div>
        </Section>

        {/* WhyChooseKlook (USP) */}
        <Section title="Why choose us">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Live inventory",
                content: "Browse what’s actually in-stock—right now.",
                image: "/images/workflow-01.png",
              },
              {
                title: "Pickup-ready",
                content: "Order ahead and get in & out quickly.",
                image: "/images/workflow-02.png",
              },
              {
                title: "Smart search",
                content: "Shop by mood, effects, and preferences.",
                image: "/images/workflow-03.png",
              },
              {
                title: "Clear info",
                content: "Strains, terpenes, and formats explained simply.",
                image: "/images/features.png",
              },
            ].map((usp) => (
              <div
                key={usp.title}
                className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5"
              >
                <div className="relative h-10 w-10 overflow-hidden rounded-2xl bg-gray-100 ring-1 ring-black/5">
                  <Image
                    src={usp.image}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="40px"
                  />
                </div>
                <div className="mt-4 text-base font-extrabold text-gray-950">
                  {usp.title}
                </div>
                <div className="mt-1 text-sm text-gray-700">{usp.content}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* Recommended (Internal linking / SEO) */}
        <Section title="Recommended">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { label: "Shop flower", href: "/shop/flower" },
                { label: "Shop edibles", href: "/shop/edibles" },
                { label: "Shop vaporizers", href: "/shop/vaporizers" },
                { label: "Browse brands", href: "/brands" },
                { label: "Learn terpenes", href: "/terpenes" },
                { label: "Strain guide", href: "/strains" },
                { label: "Store info", href: "/store-info" },
                { label: "FAQ", href: "/faq" },
                { label: "First-time visitors", href: "/first-time-visitors" },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="flex items-center justify-between rounded-2xl border border-black/5 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-100"
                >
                  <span>{l.label}</span>
                  <span aria-hidden="true">→</span>
                </Link>
              ))}
            </div>
          </div>
        </Section>
      </main>
    </div>
  );
}