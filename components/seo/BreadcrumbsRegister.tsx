"use client";

import { useEffect } from "react";
import type { Crumb } from "@/lib/breadcrumbs";
import { useBreadcrumbs } from "@/components/seo/BreadcrumbsContext";

export default function BreadcrumbsRegister({ crumbs }: { crumbs: Crumb[] }) {
  const { setCrumbs } = useBreadcrumbs();

  useEffect(() => {
    setCrumbs(crumbs);
  }, [crumbs, setCrumbs]);

  return null;
}

