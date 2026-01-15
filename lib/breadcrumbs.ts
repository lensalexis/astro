export type Crumb = {
  name: string;
  href: string;
};

export function withHome(crumbs: Crumb[]) {
  const home: Crumb = { name: "Home", href: "/" };
  if (crumbs.length === 0) return [home];
  if (crumbs[0]?.href === "/") return crumbs;
  return [home, ...crumbs];
}

