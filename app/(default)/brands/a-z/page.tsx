import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import { buildMetadata } from "@/lib/seo";
import { brands } from "@/lib/kb-data";

export const metadata: Metadata = buildMetadata({
  pathname: "/brands/a-z",
  title: "Brands A–Z",
  description:
    "Browse cannabis brands carried at Kine Buds Dispensary alphabetically.",
});

export default function BrandsAZPage() {
  const list = [...brands].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <PageShell
      h1="Brands A–Z"
      crumbs={[
        { name: "Brands", href: "/brands" },
        { name: "A–Z", href: "/brands/a-z" },
      ]}
      intro="If you already know the brand name, this is the fastest way to find its profile."
      askAstro
    >
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((b) => (
            <Link
              key={b.slug}
              href={`/brands/${b.slug}`}
              className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-white hover:bg-white/5"
            >
              {b.name}
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

