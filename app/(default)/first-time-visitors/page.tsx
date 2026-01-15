import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import { buildMetadata } from "@/lib/seo";
import RelatedLinks from "@/components/related/RelatedLinks";
import BrowseNext from "@/components/BrowseNext";

export const metadata: Metadata = buildMetadata({
  pathname: "/first-time-visitors",
  title: "First-time visitors",
  description:
    "First time at Kine Buds Dispensary? What to bring, what to expect, and how to shop confidently (educational).",
});

export default function FirstTimeVisitorsPage() {
  return (
    <PageShell
      h1="First-time visitors: what to expect"
      crumbs={[
        { name: "Store info", href: "/store-info" },
        { name: "First-time visitors", href: "/first-time-visitors" },
      ]}
      intro="New to shopping? This page helps you plan a smooth visit—ID basics, how to browse, and how to ask the right questions."
      askAstro
      related={
        <RelatedLinks
          title="Start here"
          links={[
            { href: "/learn/beginners", title: "Beginner learn hub" },
            { href: "/formats", title: "Formats (flower, vapes, edibles…)" },
            { href: "/terpenes", title: "Terpenes explained" },
            { href: "/shop", title: "Shop hub (content-first)" },
            { href: "/faq", title: "FAQ" },
            { href: "/store-info", title: "Store info" },
          ]}
        />
      }
      browseNext={
        <BrowseNext
          cards={[
            { href: "/learn/beginners/cannabis-101-beginner-guide", title: "Cannabis 101", kicker: "Learn" },
            { href: "/formats/edibles", title: "Edibles guide", kicker: "Formats" },
            { href: "/formats/vapes", title: "Vapes guide", kicker: "Formats" },
            { href: "/shop/flower", title: "Shop Flower", kicker: "Shop" },
            { href: "/shop/edibles", title: "Shop Edibles", kicker: "Shop" },
            { href: "/use-cases/relaxation", title: "Relaxation guide", kicker: "Use-cases" },
          ]}
        />
      }
    >
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-white">Quick checklist</h2>
        <ul className="mt-3 list-disc pl-5 text-indigo-200/80">
          <li>Bring a valid government-issued ID.</li>
          <li>Pick a format based on your timeline (fast vs slow).</li>
          <li>Start with simple products and consistent dosing.</li>
          <li>Ask about terpene profile and freshness.</li>
        </ul>
      </section>
    </PageShell>
  );
}

