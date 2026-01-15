import Link from "next/link";

export type RelatedLink = {
  href: string;
  title: string;
  description?: string;
};

export default function RelatedLinks({
  title,
  links,
}: {
  title: string;
  links: RelatedLink[];
}) {
  if (!links || links.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10"
          >
            <div className="text-sm font-semibold text-white">{l.title}</div>
            {l.description ? (
              <div className="mt-1 text-sm text-indigo-200/70">{l.description}</div>
            ) : null}
          </Link>
        ))}
      </div>
    </section>
  );
}

