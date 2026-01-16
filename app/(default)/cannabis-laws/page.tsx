import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  pathname: "/cannabis-laws",
  title: "Cannabis laws (NJ)",
  description:
    "Educational overview of common cannabis rules for New Jersey shoppers (21+, responsible use, and travel basics).",
});

export default function CannabisLawsPage() {
  return (
    <PageShell
      h1="Cannabis laws (New Jersey)"
      crumbs={[{ name: "Cannabis laws", href: "/cannabis-laws" }]}
      intro="This is a general, educational overview—not legal advice. Rules can change; verify the latest guidance from official sources."
    >
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-white">Quick basics</h2>
        <ul className="mt-3 list-disc pl-5 text-indigo-200/80 space-y-2">
          <li>21+ only.</li>
          <li>Don’t drive under the influence.</li>
          <li>Consume only where it’s permitted.</li>
          <li>Keep products sealed when transporting.</li>
        </ul>
      </section>

      <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-white">Planning a visit</h2>
        <p className="mt-2 text-indigo-200/70">
          Use our visit pages for practical info:{" "}
          <Link className="text-white underline hover:no-underline" href="/store-info">
            store info
          </Link>
          ,{" "}
          <Link className="text-white underline hover:no-underline" href="/directions">
            directions
          </Link>
          , and{" "}
          <Link className="text-white underline hover:no-underline" href="/parking">
            parking
          </Link>
          .
        </p>
      </section>
    </PageShell>
  );
}

