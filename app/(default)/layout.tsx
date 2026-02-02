"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import AOS from "aos";
import "aos/dist/aos.css";

import Footer from "@/components/ui/footer";

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  useEffect(() => {
    AOS.init({
      once: true,
      disable: "phone",
      duration: 600,
      easing: "ease-out-sine",
    });
  });

  // Klook-style homepage includes the footer.
  const showFooter = true;

  return (
    <>
      <main className="relative flex grow flex-col">{children}</main>

      {/* Portal target for AI search results when using navbar search on inner pages (e.g. /resources, /about) */}
      <div id="inner-page-search-results" className="contents" />

      {showFooter && <Footer />}
    </>
  );
}
