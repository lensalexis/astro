import Link from "next/link";
import type { Crumb } from "@/lib/breadcrumbs";

export default function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-indigo-200/70">
        {crumbs.map((c, idx) => {
          const isLast = idx === crumbs.length - 1;
          return (
            <li key={`${c.href}-${idx}`} className="flex items-center gap-x-2">
              {idx > 0 && <span className="opacity-50">/</span>}
              {isLast ? (
                <span aria-current="page" className="text-indigo-200/90">
                  {c.name}
                </span>
              ) : (
                <Link href={c.href} className="hover:text-white">
                  {c.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

