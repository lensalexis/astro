import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  pathname: "/product-safety",
  title: "Product safety",
  description:
    "Educational safety basics for cannabis products: lab testing, storage, responsible use, and beginner tips.",
});

export default function ProductSafetyPage() {
  return (
    <PageShell
      h1="Product safety"
      crumbs={[{ name: "Product safety", href: "/product-safety" }]}
      intro="This page is educational and non-medical. Always follow product labels and ask a budtender if you’re unsure."
      askAstro
    >
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-white">Start low, go slow</h2>
        <p className="mt-2 text-indigo-200/70">
          Especially with edibles, effects can take longer to feel and last longer than expected. Begin with a low dose and wait
          before taking more.
        </p>
      </section>

      <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-white">Storage</h2>
        <ul className="mt-3 list-disc pl-5 text-indigo-200/80 space-y-2">
          <li>Store products in a cool, dry place.</li>
          <li>Keep out of reach of children and pets.</li>
          <li>Keep original packaging for labeling and dosing info.</li>
        </ul>
      </section>

      <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-white">More help</h2>
        <p className="mt-2 text-indigo-200/70">
          If you’re new, start with{" "}
          <Link className="text-white underline hover:no-underline" href="/resources">
            Resource Library
          </Link>{" "}
          or check the{" "}
          <Link className="text-white underline hover:no-underline" href="/faq">
            FAQ
          </Link>
          .
        </p>
      </section>
    </PageShell>
  );
}

