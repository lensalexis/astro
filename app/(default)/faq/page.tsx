import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import JsonLd from "@/components/seo/JsonLd";
import { buildMetadata } from "@/lib/seo";
import { faqPageJsonLd, type FaqItem } from "@/lib/jsonld";
import RelatedLinks from "@/components/related/RelatedLinks";
import BrowseNext from "@/components/BrowseNext";

const faqItems: FaqItem[] = [
  {
    question: "Do I need an ID to shop?",
    answer:
      "Yes—bring a valid government-issued ID. Requirements can change, so check store info before visiting.",
  },
  {
    question: "What’s the difference between flower, vapes, and edibles?",
    answer:
      "They differ mainly by format and timing. Inhaled formats typically feel faster; edibles tend to take longer and last longer. This is general educational information.",
  },
  {
    question: "How do I pick a beginner-friendly option?",
    answer:
      "Start low and go slow. Choose a format that matches your timeline, keep dosing consistent, and ask about labeling and terpene profile.",
  },
  {
    question: "Do you have parking?",
    answer:
      "Yes—see our parking page for the latest guidance and any notes about the area.",
  },
];

export const metadata: Metadata = buildMetadata({
  pathname: "/faq",
  title: "FAQ",
  description: "Answers to common questions about visiting and shopping at Kine Buds Dispensary (Maywood, NJ).",
});

export default function FAQPage() {
  return (
    <PageShell
      h1="Frequently asked questions"
      crumbs={[{ name: "FAQ", href: "/faq" }]}
      intro="Quick answers for first-time visitors and returning shoppers. Educational only; for live availability and purchasing, use the live menu."
      askAstro
      related={
        <RelatedLinks
          title="Helpful pages"
          links={[
            { href: "/first-time-visitors", title: "First-time visitors" },
            { href: "/hours", title: "Hours" },
            { href: "/directions", title: "Directions" },
            { href: "/parking", title: "Parking" },
            { href: "/shop", title: "Shop hub" },
            { href: "/resources", title: "Resources Center" },
          ]}
        />
      }
      browseNext={
        <BrowseNext
          cards={[
            { href: "/resources", title: "Resources Center", kicker: "Resources" },
            { href: "/formats", title: "Formats deep dives", kicker: "Formats" },
            { href: "/terpenes", title: "Terpenes", kicker: "Terpenes" },
            { href: "/brands", title: "Brands", kicker: "Brands" },
            { href: "/strains", title: "Strains", kicker: "Strains" },
            { href: "/near-me", title: "Near me pages", kicker: "Local" },
          ]}
        />
      }
    >
      <JsonLd data={faqPageJsonLd(faqItems)} />

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-white">FAQs</h2>
        <div className="mt-4 space-y-4">
          {faqItems.map((item) => (
            <div key={item.question} className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <h3 className="text-base font-semibold text-white">{item.question}</h3>
              <p className="mt-2 text-sm text-indigo-200/70">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

