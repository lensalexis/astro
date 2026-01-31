import "./css/style.css";

import localFont from "next/font/local";
import Script from "next/script"; // ✅ keep this import here
import type { Metadata } from "next";
import { UserProvider } from "@/components/UserContext"; // ✅ import your UserProvider
import SiteChrome from "@/components/ui/SiteChrome";
import { site } from "@/lib/site";
import { BreadcrumbsProvider } from "@/components/seo/BreadcrumbsContext";
import { NavbarSearchSlotProvider } from "@/components/NavbarSearchSlotContext";

const poppins = localFont({
  src: [
    { path: "../public/fonts/Poppins-Regular.ttf", weight: "400", style: "normal" },
    { path: "../public/fonts/Poppins-Italic.ttf", weight: "400", style: "italic" },
    { path: "../public/fonts/Poppins-Medium.ttf", weight: "500", style: "normal" },
    { path: "../public/fonts/Poppins-MediumItalic.ttf", weight: "500", style: "italic" },
    { path: "../public/fonts/Poppins-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../public/fonts/Poppins-SemiBoldItalic.ttf", weight: "600", style: "italic" },
    { path: "../public/fonts/Poppins-Bold.ttf", weight: "700", style: "normal" },
    { path: "../public/fonts/Poppins-BoldItalic.ttf", weight: "700", style: "italic" },
  ],
  variable: "--font-poppins",
  display: "swap",
});

const nacelle = localFont({
  src: [
    {
      path: "../public/fonts/nacelle-regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/nacelle-italic.woff2",
      weight: "400",
      style: "italic",
    },
    {
      path: "../public/fonts/nacelle-semibold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/fonts/nacelle-semibolditalic.woff2",
      weight: "600",
      style: "italic",
    },
  ],
  variable: "--font-nacelle",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.defaultTitle,
    template: `%s | ${site.name}`,
  },
  description: site.defaultDescription,
  openGraph: {
    type: "website",
    siteName: site.name,
    title: site.defaultTitle,
    description: site.defaultDescription,
    url: "/",
    images: [{ url: site.ogImage }],
  },
  twitter: {
    card: "summary_large_image",
    site: site.twitterHandle,
    creator: site.twitterHandle,
    images: [site.ogImage],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} ${nacelle.variable} bg-gray-50 font-inter text-base text-gray-900 antialiased`}
      >
        {/* ✅ Dispense script properly rendered */}
        <Script
          src="https://js.dispenseapp.com/v1"
          strategy="beforeInteractive"
        />

        <div className="flex min-h-[100svh] supports-[min-height:100dvh]:min-h-[100dvh] flex-col overflow-hidden supports-[overflow:clip]:overflow-clip">
          {/* ✅ Wrap everything that needs user context */}
          <UserProvider>
            <BreadcrumbsProvider>
              <NavbarSearchSlotProvider>
                <SiteChrome />
                {children}
              </NavbarSearchSlotProvider>
            </BreadcrumbsProvider>
          </UserProvider>
        </div>
      </body>
    </html>
  );
}
