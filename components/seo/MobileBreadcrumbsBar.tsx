"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBreadcrumbs } from "@/components/seo/BreadcrumbsContext";

export default function MobileBreadcrumbsBar() {
  const pathname = usePathname();
  const { crumbs } = useBreadcrumbs();

  // Only show on content pages (SiteChrome already hides on "/")
  if (!pathname || pathname === "/") return null;
  if (!crumbs || crumbs.length === 0) return null;

  // Keep it compact: show last 3 crumbs max.
  const compact = crumbs.slice(Math.max(crumbs.length - 3, 0));

  return (
    <div className="mt-2 sm:hidden">
      <div className="rounded-full bg-black/70 px-4 py-2 text-xs text-white/85 backdrop-blur">
        <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap">
          {compact.map((c, idx) => {
            const isLast = idx === compact.length - 1;
            return (
              <span key={`${c.href}-${idx}`} className="flex items-center gap-2">
                {idx > 0 ? <span className="text-white/40">/</span> : null}
                {isLast ? (
                  <span className="font-semibold text-white">{c.name}</span>
                ) : (
                  <Link href={c.href} className="hover:text-white">
                    {c.name}
                  </Link>
                )}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

