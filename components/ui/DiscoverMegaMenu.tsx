"use client";

import Image from "next/image";
import Link from "next/link";
import {
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
  HeartIcon,
  MapIcon,
  PhoneIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  SparklesIcon,
  StarIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import {
  FaFacebookF,
  FaInstagram,
  FaTiktok,
  FaYoutube,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { FcGoogle } from "react-icons/fc";
import { site } from "@/lib/site";

type MenuItem = {
  title: string;
  description: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  iconImageSrc?: string;
  iconImageAlt?: string;
  accent?: "sky" | "emerald" | "rose" | "violet" | "amber" | "slate";
  badge?: string;
  disabled?: boolean;
};

const ACCENTS: Record<
  NonNullable<MenuItem["accent"]>,
  { bg: string; fg: string }
> = {
  sky: { bg: "bg-sky-50", fg: "text-sky-600" },
  emerald: { bg: "bg-emerald-50", fg: "text-emerald-600" },
  rose: { bg: "bg-rose-50", fg: "text-rose-600" },
  violet: { bg: "bg-violet-50", fg: "text-violet-600" },
  amber: { bg: "bg-amber-50", fg: "text-amber-600" },
  slate: { bg: "bg-slate-50", fg: "text-slate-700" },
};

function Tile({
  item,
  onNavigate,
}: {
  item: MenuItem;
  onNavigate?: () => void;
}) {
  const accent = ACCENTS[item.accent || "slate"];
  const content = (
    <div
      className={[
        // Classic + modern: airy row with subtle hover
        "group w-full rounded-xl",
        "hover:bg-black/[0.035] transition",
        item.disabled ? "opacity-55 cursor-not-allowed" : "",
      ].join(" ")}
    >
      <div className="flex items-center gap-3 px-0 py-2.5">
        <div
          className={[
            // Airbnb-like icon badge: white tile with hairline border
            "flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 bg-white",
          ].join(" ")}
        >
          {item.iconImageSrc ? (
            <Image
              src={item.iconImageSrc}
              alt={item.iconImageAlt || ""}
              width={22}
              height={22}
              className="h-[22px] w-[22px]"
            />
          ) : item.icon ? (
            <item.icon className={["h-5 w-5", accent.fg].join(" ")} />
          ) : null}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div
              className={[
                "truncate font-semibold text-gray-950",
                "text-[15px]",
              ].join(" ")}
            >
              {item.title}
            </div>
            {item.badge ? (
              <span className="shrink-0 rounded-full bg-black/5 px-2 py-0.5 text-[11px] font-semibold text-gray-700">
                {item.badge}
              </span>
            ) : null}
          </div>
          <div
            className={[
              "mt-0.5 line-clamp-2 text-gray-600",
              "text-[13px]",
            ].join(" ")}
          >
            {item.description}
          </div>
        </div>
      </div>
    </div>
  );

  if (item.disabled) return content;

  return (
    <Link href={item.href} onClick={onNavigate} className="block">
      {content}
    </Link>
  );
}

export default function DiscoverMegaMenu({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const shop: MenuItem[] = [
    {
      title: "Flower",
      description: "Top strains and best sellers.",
      href: "/shop/flower",
      iconImageSrc: "/images/icon-cannabis-flower.png",
      iconImageAlt: "Flower",
    },
    {
      title: "Pre Rolls",
      description: "Ready-to-go options.",
      href: "/shop/pre-rolls",
      iconImageSrc: "/images/icon-cannabis-preroll.png",
      iconImageAlt: "Pre rolls",
    },
    {
      title: "Vaporizers",
      description: "Convenient and fast-acting.",
      href: "/shop/vaporizers",
      iconImageSrc: "/images/icon-cannabis-vape.png",
      iconImageAlt: "Vaporizers",
    },
    {
      title: "Edibles",
      description: "Gummies, chocolates, and more.",
      href: "/shop/edibles",
      iconImageSrc: "/images/icon-cannabis-edibles.png",
      iconImageAlt: "Edibles",
    },
    {
      title: "Beverages",
      description: "Sip-friendly THC drinks.",
      href: "/shop/beverages",
      iconImageSrc: "/images/icon-cannabis-beverage.png",
      iconImageAlt: "Beverages",
    },
    {
      title: "Tinctures",
      description: "Flexible dosing, classic format.",
      href: "/shop/tinctures",
      iconImageSrc: "/images/icon-cannabis-tinctures.png",
      iconImageAlt: "Tinctures",
    },
    {
      title: "Concentrates",
      description: "Wax, rosin, resin, and more.",
      href: "/shop/concentrates",
      iconImageSrc: "/images/icon-cannabis-concentrate.png",
      iconImageAlt: "Concentrates",
    },
    {
      title: "Topicals",
      description: "Balms, lotions, and wellness.",
      href: "/shop/topicals",
      iconImageSrc: "/images/icon-cannabis-topicals.png",
      iconImageAlt: "Topicals",
    },
  ];

  // Keep "Resources" compact: 3 core links.
  const resources: MenuItem[] = [
    {
      title: "Resources",
      description: "Long-form, source-heavy cannabis education.",
      href: "/resources",
      icon: AcademicCapIcon,
      accent: "sky",
    },
    {
      title: "FAQ",
      description: "Quick answers before your visit.",
      href: "/faq",
      icon: ChatBubbleLeftRightIcon,
      accent: "emerald",
    },
    {
      title: "Loyalty",
      description: "How points work and how to redeem rewards.",
      href: "/loyalty",
      icon: StarIcon,
      accent: "amber",
      badge: "New",
    },
    {
      title: "About us",
      description: "Our story and what we stand for.",
      href: "/about",
      icon: UsersIcon,
      accent: "slate",
    },
    {
      title: "Brands",
      description: "Explore brands carried at Kine Buds.",
      href: "/brands",
      icon: SparklesIcon,
      accent: "emerald",
    },
    {
      title: "Reviews",
      description: "What locals are saying.",
      href: "/reviews",
      icon: StarIcon,
      accent: "amber",
      badge: "New",
    },
    {
      title: "Contact",
      description: "Get in touch with our team.",
      href: "/contact",
      icon: PhoneIcon,
      accent: "sky",
    },
  ];

  const googleMapsHref = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    `${site.address.streetAddress}, ${site.address.addressLocality}, ${site.address.addressRegion} ${site.address.postalCode}`
  )}`;

  const youtubeSearchHref = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    "Kine Buds Dispensary Maywood NJ"
  )}`;
  const tiktokSearchHref = `https://www.tiktok.com/search?q=${encodeURIComponent(
    "Kine Buds Dispensary"
  )}`;
  const facebookHref = "https://www.facebook.com/kinebudsnj";
  const instagramHref = "https://www.instagram.com/kinebudsdispensarynj";

  const socials = [
    { title: "Instagram", href: instagramHref, icon: FaInstagram },
    { title: "Facebook", href: facebookHref, icon: FaFacebookF },
    { title: "YouTube", href: youtubeSearchHref, icon: FaYoutube },
    { title: "X", href: `https://x.com/${site.twitterHandle.replace("@", "")}`, icon: FaXTwitter },
    { title: "TikTok", href: tiktokSearchHref, icon: FaTiktok },
    { title: "Google", href: googleMapsHref, icon: FcGoogle },
  ] as const;

  return (
    <div className="w-full">
      {/* Desktop: anchored mega panel */}
      <div className="hidden sm:block">
        <div className="w-[min(1040px,calc(100vw-2rem))] rounded-3xl border border-black/10 bg-white shadow-[0_40px_120px_rgba(0,0,0,0.16)]">
          <div className="grid grid-cols-12 gap-0">
            {/* Column 1 */}
            <div className="col-span-4 border-r border-black/10 px-5 py-5">
              <div className="text-[12px] font-semibold tracking-wide text-gray-500">
                SHOP
              </div>
              <div className="mt-3 divide-y divide-black/5">
                {shop.map((item) => (
                  <Tile key={item.href} item={item} onNavigate={onNavigate} />
                ))}
              </div>
            </div>

            {/* Column 2 */}
            <div className="col-span-4 border-r border-black/10 px-5 py-5">
              <div className="text-[12px] font-semibold tracking-wide text-gray-500">
                RESOURCES
              </div>
              <div className="mt-3 divide-y divide-black/5">
                {resources.map((item) => (
                  <Tile key={item.href} item={item} onNavigate={onNavigate} />
                ))}
              </div>
            </div>

            {/* Column 3: Contact */}
            <div className="col-span-4 px-5 py-5">
              <div className="flex items-center justify-between">
                <div className="text-[12px] font-semibold tracking-wide text-gray-500">
                  CONTACT
                </div>
                <MapIcon className="h-5 w-5 text-gray-300" />
              </div>

              <div className="mt-3 rounded-3xl border border-black/10 bg-white p-4">
                <div className="text-[15px] font-semibold text-gray-950">Kine Buds</div>
                <div className="mt-1 text-[13px] text-gray-600">
                  {site.address.streetAddress}, {site.address.addressLocality}, {site.address.addressRegion}{" "}
                  {site.address.postalCode}
                </div>

                <div className="mt-3 space-y-2">
                  <a
                    href={`tel:${site.contact.phone}`}
                    className="flex items-center gap-2 text-[13px] font-semibold text-gray-900 hover:underline"
                  >
                    <PhoneIcon className="h-4 w-4 text-gray-400" />
                    {site.contact.phone}
                  </a>
                  <a
                    href={`mailto:${site.contact.email}`}
                    className="flex items-center gap-2 text-[13px] text-gray-700 hover:underline"
                  >
                    <ShieldCheckIcon className="h-4 w-4 text-gray-400" />
                    {site.contact.email}
                  </a>
                  <a
                    href={googleMapsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[13px] text-gray-700 hover:underline"
                    onClick={onNavigate}
                  >
                    <MapIcon className="h-4 w-4 text-gray-400" />
                    Directions
                  </a>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  {socials.map((s) => (
                    <a
                      key={s.title}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-2xl border border-black/10 bg-white px-3 py-2 text-gray-700 hover:text-gray-900 hover:shadow-sm transition"
                      aria-label={s.title}
                      onClick={onNavigate}
                    >
                      <s.icon className="h-5 w-5" />
                    </a>
                  ))}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Link
                    href="/store-info"
                    className="inline-flex items-center justify-center rounded-2xl border border-black/10 bg-gray-50 px-3 py-2 text-[13px] font-semibold text-gray-900 hover:bg-gray-100"
                    onClick={onNavigate}
                  >
                    Store info
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center rounded-2xl bg-black px-3 py-2 text-[13px] font-semibold text-white hover:bg-gray-900"
                    onClick={onNavigate}
                  >
                    Contact
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: full-screen sheet */}
      <div className="sm:hidden">
        <div className="rounded-3xl border border-black/10 bg-white shadow-[0_40px_120px_rgba(0,0,0,0.18)]">
          <div className="p-4">
            <div className="text-sm font-semibold text-gray-900">Discover</div>
            <div className="mt-1 text-sm text-gray-600">
              Explore the site like a modern travel hub.
            </div>
          </div>
          <div className="border-t border-black/5 p-4 space-y-6">
            <div>
              <div className="text-[12px] font-semibold tracking-wide text-gray-900 mb-3">
                Shop
              </div>
              <div className="divide-y divide-black/5">
                {shop.map((item) => (
                  <Tile key={item.href} item={item} onNavigate={onNavigate} />
                ))}
              </div>
            </div>
            <div>
              <div className="text-[12px] font-semibold tracking-wide text-gray-900 mb-3">
                Resources
              </div>
              <div className="divide-y divide-black/5">
                {resources.map((item) => (
                  <Tile key={item.href} item={item} onNavigate={onNavigate} />
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-black/10 bg-gray-50 p-4">
              <div className="flex items-center justify-between">
                <div className="text-[12px] font-semibold tracking-wide text-gray-900">
                  Contact
                </div>
                <MapIcon className="h-5 w-5 text-gray-300" />
              </div>
              <div className="mt-3 text-[13px] text-gray-700">
                <div className="font-semibold text-gray-950">Kine Buds</div>
                <div className="mt-1">
                  {site.address.streetAddress}, {site.address.addressLocality}, {site.address.addressRegion}{" "}
                  {site.address.postalCode}
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {socials.map((s) => (
                  <a
                    key={s.title}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-2xl border border-black/10 bg-white px-3 py-2 text-gray-700 hover:text-gray-900 hover:shadow-sm transition"
                    aria-label={s.title}
                    onClick={onNavigate}
                  >
                    <s.icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <a
                  href={googleMapsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-1 items-center justify-center rounded-2xl bg-emerald-700 px-4 py-2 text-[13px] font-semibold text-white hover:bg-emerald-800 transition"
                  onClick={onNavigate}
                >
                  Directions
                </a>
                <Link
                  href="/contact"
                  className="inline-flex flex-1 items-center justify-center rounded-2xl bg-black px-4 py-2 text-[13px] font-semibold text-white hover:bg-gray-900 transition"
                  onClick={onNavigate}
                >
                  Contact
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

