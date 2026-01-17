"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBreadcrumbs } from "@/components/seo/BreadcrumbsContext";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function MobileBreadcrumbsBar() {
  const pathname = usePathname();
  const { crumbs } = useBreadcrumbs();

  // Only show on content pages (SiteChrome already hides on "/")
  if (!pathname || pathname === "/") return null;
  if (!crumbs || crumbs.length === 0) return null;

  const current = crumbs[crumbs.length - 1];
  const back = crumbs.length >= 2 ? crumbs[crumbs.length - 2] : null;

  return (
    <div className="mt-2 sm:hidden">
      <div className="rounded-full bg-black/70 px-4 py-2 text-xs text-white/85 backdrop-blur">
        <div className="flex items-center gap-2 min-w-0">
          {back ? (
            <Link
              href={back.href}
              className="inline-flex items-center gap-1 font-semibold text-white hover:text-white/90 min-w-0"
            >
              <ArrowLeftIcon className="h-4 w-4 shrink-0" />
              <span className="truncate">{back.name}</span>
            </Link>
          ) : (
            <span className="font-semibold text-white truncate">{current?.name}</span>
          )}
        </div>
      </div>
    </div>
  );
}

