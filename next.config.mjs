// next.config.mjs
import createMDX from "@next/mdx";

/** @type {import('next').NextConfig} */
const nextConfig = {
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