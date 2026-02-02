import Link from "next/link";
import type { Crumb } from "@/lib/breadcrumbs";

const variantClasses = {
  light: {
    ol: "text-gray-600",
    current: "text-gray-900",
    link: "hover:text-gray-900",
  },
  dark: {
    ol: "text-indigo-200/70",
    current: "text-indigo-200/90",
    link: "hover:text-white",
  },
  hero: {
    ol: "text-white/80",
    current: "text-white",
    link: "hover:text-white",
  },
};

export default function Breadcrumbs({
  crumbs,
  variant = "dark",
}: {
  crumbs: Crumb[];
  variant?: "light" | "dark" | "hero";
}) {
  const c = variantClasses[variant];
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-sm ${c.ol}`}>
        {crumbs.map((cr, idx) => {
          const isLast = idx === crumbs.length - 1;
          return (
            <li key={`${cr.href}-${idx}`} className="flex items-center gap-x-2">
              {idx > 0 && <span className="opacity-50">/</span>}
              {isLast ? (
                <span aria-current="page" className={c.current}>
                  {cr.name}
                </span>
              ) : (
                <Link href={cr.href} className={c.link}>
                  {cr.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

