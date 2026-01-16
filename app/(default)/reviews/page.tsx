import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import GoogleReviews from "@/components/GoogleReviews";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  pathname: "/reviews",
  title: "Reviews",
  description:
    "See what customers are saying about Kine Buds Dispensary in Maywood, NJ.",
});

export default function ReviewsPage() {
  return (
    <PageShell
      h1="Reviews"
      crumbs={[{ name: "Reviews", href: "/reviews" }]}
      intro="Real feedback from customers. We’re focused on a friendly, curated experience."
    >
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-white">Google reviews</h2>
        <GoogleReviews />
      </section>
    </PageShell>
  );
}

