"use client";

import { useState } from "react";

export default function AskAstro({
  defaultPrompt,
}: {
  defaultPrompt?: string;
}) {
  const [q, setQ] = useState(defaultPrompt ?? "");

  return (
    <section className="mt-10 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm ring-1 ring-black/5">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-gray-950">Ask Astro</p>
        <p className="text-sm text-gray-600">
          Ask a question about brands, strains, terpenes, formats, or how to shop—Astro will help you explore.
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Example: “What’s a good beginner-friendly edible format?”"
          className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-950 placeholder:text-gray-400 outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
        />
        <button
          type="button"
          onClick={() => {
            // Placeholder — will be wired to Astro AI endpoint.
            // Keeping this non-functional intentionally for now.
            // eslint-disable-next-line no-alert
            alert("Astro is coming soon — this is a placeholder module.");
          }}
          className="rounded-2xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
        >
          Ask
        </button>
      </div>
    </section>
  );
}

