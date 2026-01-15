"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Crumb } from "@/lib/breadcrumbs";

type BreadcrumbState = {
  crumbs: Crumb[];
  setCrumbs: (crumbs: Crumb[]) => void;
};

const BreadcrumbsContext = createContext<BreadcrumbState | null>(null);

export function BreadcrumbsProvider({ children }: { children: ReactNode }) {
  const [crumbs, setCrumbs] = useState<Crumb[]>([]);
  const value = useMemo(() => ({ crumbs, setCrumbs }), [crumbs]);
  return <BreadcrumbsContext.Provider value={value}>{children}</BreadcrumbsContext.Provider>;
}

export function useBreadcrumbs() {
  const ctx = useContext(BreadcrumbsContext);
  if (!ctx) {
    throw new Error("useBreadcrumbs must be used within BreadcrumbsProvider");
  }
  return ctx;
}

