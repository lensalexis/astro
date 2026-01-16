import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  pathname: "/community",
  title: "Community",
  description:
    "Community events and local partnerships at Kine Buds Dispensary in Maywood, NJ.",
});

export default function CommunityPage() {
  return (
    <PageShell
      h1="Community"
      crumbs={[{ name: "Community", href: "/community" }]}
      intro="We’re here for Maywood and Bergen County—events and partnerships will be featured here."
    >
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-white">Events (placeholder)</h2>
        <p className="mt-2 text-indigo-200/70">
          Add event listings, in-store activations, and community updates here.
        </p>
      </section>
    </PageShell>
  );
}

