import Link from "next/link";

export type BrowseCard = {
  href: string;
  title: string;
  kicker?: string;
};

const variantClasses = {
  light: {
    h2: "text-xl font-semibold text-gray-950",
    card: "group rounded-2xl border border-gray-200 bg-gray-50 p-4 hover:bg-gray-100 hover:border-gray-300",
    kicker: "text-xs font-semibold uppercase tracking-wide text-gray-500",
    title: "mt-1 text-sm font-semibold text-gray-950 group-hover:underline",
  },
  dark: {
    h2: "text-xl font-semibold text-white",
    card: "group rounded-2xl border border-white/10 bg-black/20 p-4 hover:bg-white/5",
    kicker: "text-xs font-semibold uppercase tracking-wide text-indigo-200/60",
    title: "mt-1 text-sm font-semibold text-white group-hover:underline",
  },
};

export default function BrowseNext({
  cards,
  variant = "light",
}: {
  cards: BrowseCard[];
  variant?: "light" | "dark";
}) {
  if (!cards || cards.length === 0) return null;
  const c = variantClasses[variant];

  return (
    <section className="mt-12">
      <h2 className={c.h2}>Browse next</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.slice(0, 6).map((card) => (
          <Link key={card.href} href={card.href} className={c.card}>
            {card.kicker ? <div className={c.kicker}>{card.kicker}</div> : null}
            <div className={c.title}>{card.title}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}

