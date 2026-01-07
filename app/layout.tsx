import "./css/style.css";

import { Inter } from "next/font/google";
import localFont from "next/font/local";
import Script from "next/script"; // ✅ keep this import here
import { UserProvider } from "@/components/UserContext"; // ✅ import your UserProvider
import SiteChrome from "@/components/ui/SiteChrome";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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

export const metadata = {
  title: "#1 Cannabis Store | Maywood, NJ | Just a Little Higher",
  description:
    "Maywood &amp; Bergen County&#039;s #1 Destination for the Lowest Prices in NJ &amp; The Highest Quality Cannibus including Flower, Pre-Rolls, Gummies, Vapes and much more. Up to 50% off",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${nacelle.variable} bg-gray-950 font-inter text-base text-gray-200 antialiased`}
      >
        {/* ✅ Dispense script properly rendered */}
        <Script
          src="https://js.dispenseapp.com/v1"
          strategy="beforeInteractive"
        />

        <div className="flex min-h-screen flex-col overflow-hidden supports-[overflow:clip]:overflow-clip">
          {/* ✅ Wrap everything that needs user context */}
          <UserProvider>
            <SiteChrome />
              {children}
          </UserProvider>
        </div>
      </body>
    </html>
  );
}