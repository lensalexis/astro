"use client";

import { useState } from "react";

export default function AskAstro({
  defaultPrompt,
}: {
  defaultPrompt?: string;
}) {
  const [q, setQ] = useState(defaultPrompt ?? "");

  return (
    <section className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-white">Ask Astro</p>
        <p className="text-sm text-indigo-200/70">
          Ask a question about brands, strains, terpenes, formats, or how to shop—Astro will help you explore.
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Example: “What’s a good beginner-friendly edible format?”"
          className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/20"
        />
        <button
          type="button"
          onClick={() => {
            // Placeholder — will be wired to Astro AI endpoint.
            // Keeping this non-functional intentionally for now.
            // eslint-disable-next-line no-alert
            alert("Astro is coming soon — this is a placeholder module.");
          }}
          className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-gray-100"
        >
          Ask
        </button>
      </div>
    </section>
  );
}

