import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  pathname: "/careers",
  title: "Careers",
  description:
    "Join the Kine Buds team in Maywood, NJ. Explore roles and how to apply.",
});

export default function CareersPage() {
  return (
    <PageShell
      h1="Careers at Kine Buds"
      crumbs={[{ name: "Careers", href: "/careers" }]}
      intro="We’re building a friendly, professional dispensary experience. If you care about service and education, we’d love to hear from you."
    >
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-white">Open roles (placeholder)</h2>
        <p className="mt-2 text-indigo-200/70">
          Roles will be listed here. In the meantime, reach out via{" "}
          <Link className="text-white underline hover:no-underline" href="/contact">
            contact
          </Link>{" "}
          with your resume and a short note.
        </p>
      </section>
    </PageShell>
  );
}

