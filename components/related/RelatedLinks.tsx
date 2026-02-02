import Link from "next/link";

export type RelatedLink = {
  href: string;
  title: string;
  description?: string;
};

const variantClasses = {
  light: {
    h2: "text-xl font-semibold text-gray-950",
    card: "rounded-2xl border border-gray-200 bg-gray-50 p-4 hover:bg-gray-100 hover:border-gray-300",
    title: "text-sm font-semibold text-gray-950",
    desc: "text-sm text-gray-600",
  },
  dark: {
    h2: "text-xl font-semibold text-white",
    card: "rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10",
    title: "text-sm font-semibold text-white",
    desc: "text-sm text-indigo-200/70",
  },
};

export default function RelatedLinks({
  title,
  links,
  variant = "light",
}: {
  title: string;
  links: RelatedLink[];
  variant?: "light" | "dark";
}) {
  if (!links || links.length === 0) return null;
  const c = variantClasses[variant];

  return (
    <section className="mt-10">
      <h2 className={c.h2}>{title}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className={c.card}>
            <div className={c.title}>{l.title}</div>
            {l.description ? <div className={`mt-1 ${c.desc}`}>{l.description}</div> : null}
          </Link>
        ))}
      </div>
    </section>
  );
}

