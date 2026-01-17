import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import AIProductSearch from "@/components/AIProductSearch";
import HomeHeroCarousel from "@/components/home/HomeHeroCarousel";
import HomeStartHereContent from "@/components/home/HomeStartHereContent";
import { stores } from "@/lib/stores";

export const metadata: Metadata = {
  title: "Kine Buds Dispensary",
  description:
    "Shop live inventory in Maywood, NJ. Discover deals, explore categories, and search by mood, effects, brand, and price.",
};

type RailItem = {
  title: string;
  subtitle?: string;
  href: string;
  image: string;
  badge?: string;
};

function Section({
  title,
  href,
  children,
}: {
  title: string;
  href?: string;
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
        {href ? (
          <Link
            href={href}
            className="shrink-0 rounded-full bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-900"
          >
            View all
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function HorizontalRail({ items }: { items: RailItem[] }) {
  return (
    <div className="overflow-x-auto scrollbar-hide">
      <div className="flex gap-4 pb-2">
        {items.map((item) => (
          <Link
            key={item.href + item.title}
            href={item.href}
            className="group relative w-[260px] shrink-0 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5 hover:shadow-md"
          >
            <div className="relative h-40 w-full">
              <Image
                src={item.image}
                alt={item.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                sizes="260px"
              />
              {item.badge ? (
                <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-gray-900 ring-1 ring-black/5 backdrop-blur">
                  {item.badge}
                </div>
              ) : null}
            </div>
            <div className="p-4">
              <div className="text-base font-bold text-gray-950 line-clamp-2">
                {item.title}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const defaultStoreId = stores[0]?.id;
  const heroSlides = [
    { src: "/images/deal-slider-2.jpg", alt: "Featured deals" },
    { src: "/images/deal-slider-3.jpg", alt: "Featured bundles" },
    { src: "/images/deal-slider-4.jpg", alt: "Featured picks" },
    { src: "/images/deal-slider-5.jpg", alt: "Featured value" },
    { src: "/images/deal-slider-1.jpg", alt: "Featured savings" },
  ];

  // Klook-inspired homepage rails (static/local content in this project)
  const campaignBanners: RailItem[] = [
    {
      title: "Deals this week",
      href: "/shop/flower",
      image: "/images/deal-slider-1.jpg",
      badge: "Hot",
    },
    {
      title: "New arrivals",
      href: "/shop/flower",
      image: "/images/deal-slider-2.jpg",
      badge: "New",
    },
    {
      title: "Best value bundles",
      href: "/shop/flower",
      image: "/images/deal-slider-3.jpg",
      badge: "Value",
    },
  ];

  const topDestinations: RailItem[] = [
    {
      title: "Flower",
      href: "/shop/flower",
      image: "/images/post-thumb-03.jpg",
    },
    {
      title: "Vaporizers",
      href: "/shop/vaporizers",
      image: "/images/post-thumb-04.jpg",
    },
    {
      title: "Edibles",
      href: "/shop/edibles",
      image: "/images/post-thumb-05.jpg",
    },
    {
      title: "Pre-rolls",
      href: "/shop/pre-rolls",
      image: "/images/post-thumb-06.jpg",
    },
  ];

  const popularActivities: RailItem[] = [
    {
      title: "Relax & unwind",
      subtitle: "Indica + calming terpenes",
      href: "/use-cases",
      image: "/images/post-thumb-08.jpg",
      badge: "Popular",
    },
    {
      title: "Sleep support",
      subtitle: "Evening picks and routines",
      href: "/use-cases",
      image: "/images/post-thumb-09.jpg",
    },
    {
      title: "Social & uplifted",
      subtitle: "Daytime-friendly energy",
      href: "/use-cases",
      image: "/images/post-thumb-10.jpg",
    },
    {
      title: "Focus",
      subtitle: "Get in the zone",
      href: "/use-cases",
      image: "/images/post-thumb-11.jpg",
    },
  ];

  return (
    <div className="min-h-screen">
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
          href="/shop/flower"
        >
          <HomeStartHereContent items={campaignBanners} />
        </Section>

        {/* TopDestination */}
        <Section
          title="Browse by category"
          href="/formats"
        >
          <HorizontalRail items={topDestinations} />
        </Section>

        {/* Popular */}
        <Section title="Popular right now" href="/use-cases">
          <HorizontalRail items={popularActivities} />
        </Section>

        {/* Best (Billboard) */}
        <Section title="Best picks this week">
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

        {/* AmazingExperiences (Themes) */}
        <Section title="Amazing experiences (without the guesswork)" href="/resources">
          <div className="grid gap-4 md:grid-cols-2">
            {[
              {
                title: "Resources Center",
                href: "/resources",
                image: "/images/post-thumb-12.jpg",
              },
              {
                title: "Directions & parking",
                href: "/directions",
                image: "/images/store-front.jpg",
              },
            ].map((tile) => (
              <Link
                key={tile.href}
                href={tile.href}
                className="group relative overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5 hover:shadow-md"
              >
                <div className="relative h-44">
                  <Image
                    src={tile.image}
                    alt={tile.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    sizes="(min-width: 768px) 50vw, 100vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-black/0" />
                </div>
                <div className="p-5">
                  <div className="text-lg font-extrabold text-gray-950">
                    {tile.title}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Section>

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