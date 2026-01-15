import type { ReactNode } from "react";
import type { Crumb } from "@/lib/breadcrumbs";
import { withHome } from "@/lib/breadcrumbs";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbListJsonLd } from "@/lib/jsonld";
import AskAstro from "@/components/AskAstro";
import BreadcrumbsRegister from "@/components/seo/BreadcrumbsRegister";

type PageShellProps = {
  h1: string;
  intro?: string | ReactNode;
  crumbs: Crumb[];
  askAstro?: boolean;
  children?: ReactNode;
  related?: ReactNode;
  browseNext?: ReactNode;
};

export default function PageShell({
  h1,
  intro,
  crumbs,
  askAstro,
  children,
  related,
  browseNext,
}: PageShellProps) {
  const fullCrumbs = withHome(crumbs);

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
      {/* Navbar mobile breadcrumbs are driven by this state */}
      <BreadcrumbsRegister crumbs={fullCrumbs} />

      {/* Desktop breadcrumb UI */}
      <div className="hidden sm:block">
        <Breadcrumbs crumbs={fullCrumbs} />
      </div>
      <JsonLd data={breadcrumbListJsonLd(fullCrumbs)} />

      <header className="mb-8">
        <h1 className="font-nacelle text-4xl font-semibold text-white md:text-5xl">
          {h1}
        </h1>
        {intro ? (
          <div className="mt-4 max-w-3xl text-lg text-indigo-200/70">
            {typeof intro === "string" ? <p>{intro}</p> : intro}
          </div>
        ) : null}
      </header>

      {children}
      {related}
      {askAstro ? <AskAstro /> : null}
      {browseNext}
    </section>
  );
}

