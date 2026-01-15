import Link from "next/link";

export type BrowseCard = {
  href: string;
  title: string;
  kicker?: string;
};

export default function BrowseNext({ cards }: { cards: BrowseCard[] }) {
  if (!cards || cards.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="text-xl font-semibold text-white">Browse next</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.slice(0, 6).map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="group rounded-2xl border border-white/10 bg-black/20 p-4 hover:bg-white/5"
          >
            {c.kicker ? (
              <div className="text-xs font-semibold uppercase tracking-wide text-indigo-200/60">
                {c.kicker}
              </div>
            ) : null}
            <div className="mt-1 text-sm font-semibold text-white group-hover:underline">
              {c.title}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

