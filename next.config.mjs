// next.config.mjs
import createMDX from "@next/mdx";
import path from "node:path";

// Only use custom distDir locally to avoid conflicts between worktrees
// On Vercel, use the default .next directory
const isVercel = process.env.VERCEL === "1" || process.env.CI === "1" || process.cwd().includes("vercel");
const distDir = isVercel ? ".next" : `.next-${path.basename(process.cwd())}`;

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Avoid build output corruption (and weird ENOENT write races) when multiple
  // checkouts/dev servers run on the same machine (local only).
  distDir,
  pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"],
  images: {
    // ✅ Both domains + your existing ones
    domains: [
      "dispense-images.imgix.net",
      "imgix.dispenseapp.com",
      "kinebudsdispensary.com",
      "secure.gravatar.com",
    ],
    // OR if you want stricter control, use remotePatterns instead:
    /*
    remotePatterns: [
      {
        protocol: "https",
        hostname: "dispense-images.imgix.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "imgix.dispenseapp.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "kinebudsdispensary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "secure.gravatar.com",
        pathname: "/**",
      },
    ],
    */
  },
};

const withMDX = createMDX({
  extension: /\.(md|mdx)$/,
  options: {
    remarkPlugins: ["remark-gfm"], // ✅ GitHub flavored markdown
    rehypePlugins: [],
  },
});

export default withMDX(nextConfig);