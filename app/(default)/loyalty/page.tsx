import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import BrowseNext from "@/components/BrowseNext";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  pathname: "/loyalty",
  title: "Loyalty",
  description:
    "Learn how Kine Buds loyalty works: earning points, redeeming rewards, and tips for getting the most value.",
});

export default function LoyaltyPage() {
  return (
    <PageShell
      h1="Kine Buds Loyalty"
      crumbs={[{ name: "Loyalty", href: "/loyalty" }]}
      intro="Earn points when you shop, then redeem for perks. This page is a simple overview—ask in-store for the latest reward tiers."
      browseNext={
        <BrowseNext
          cards={[
            { href: "/shop", title: "Shop", kicker: "Shop" },
            { href: "/store-info", title: "Store info", kicker: "Visit" },
            { href: "/faq", title: "FAQ", kicker: "Help" },
            { href: "/contact", title: "Contact", kicker: "Support" },
          ]}
        />
      }
    >
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-white">How it works</h2>
        <ol className="mt-3 list-decimal pl-5 text-indigo-200/80 space-y-2">
          <li>Shop in-store or place an order (when available).</li>
          <li>Earn points based on your purchase.</li>
          <li>Redeem points for discounts and special offers.</li>
        </ol>
      </section>

      <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-white">Quick tips</h2>
        <ul className="mt-3 list-disc pl-5 text-indigo-200/80 space-y-2">
          <li>Keep your phone number and email up to date at checkout.</li>
          <li>Ask about member-only deals and limited drops.</li>
          <li>
            New to shopping? Start with{" "}
            <Link className="text-white underline hover:no-underline" href="/resources">
              Resource Library
            </Link>
            .
          </li>
        </ul>
      </section>
    </PageShell>
  );
}

