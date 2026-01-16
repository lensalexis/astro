import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  pathname: "/press",
  title: "Press",
  description:
    "News and press resources for Kine Buds Dispensary in Maywood, NJ.",
});

export default function PressPage() {
  return (
    <PageShell
      h1="Press"
      crumbs={[{ name: "Press", href: "/press" }]}
      intro="Announcements, press notes, and a lightweight media kit (coming soon)."
    >
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-white">Media kit (placeholder)</h2>
        <p className="mt-2 text-indigo-200/70">
          Add a logo pack, brand description, store photos, and contact email for press inquiries.
        </p>
      </section>
    </PageShell>
  );
}

