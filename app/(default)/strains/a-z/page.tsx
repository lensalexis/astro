import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import { buildMetadata } from "@/lib/seo";
import { strains } from "@/lib/kb-data";

export const metadata: Metadata = buildMetadata({
  pathname: "/strains/a-z",
  title: "Strains A–Z",
  description: "Browse strain guides alphabetically.",
});

export default function StrainsAZPage() {
  const list = [...strains].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <PageShell
      h1="Strains A–Z"
      crumbs={[
        { name: "Strains", href: "/strains" },
        { name: "A–Z", href: "/strains/a-z" },
      ]}
      intro="Use this index to quickly find a strain guide by name."
      askAstro
    >
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((s) => (
            <Link
              key={s.slug}
              href={`/strains/${s.slug}`}
              className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-white hover:bg-white/5"
            >
              {s.name}
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

