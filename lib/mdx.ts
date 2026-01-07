import path from "path";
import fs from "fs";
import { fetchWP } from "@/lib/wp";


export type BlogPostMetadata = {
  title: string;
  description: string;
  date: string;
  updatedDate?: string;
  image?: string;
  author?: string;
  authorImg?: string;
  authorRole?: string;
  authorLink?: string;
  category?: string;
  tags?: string[];
};

// lib/wp.ts
export async function getBlogPosts() {
  const res = await fetch(`${process.env.WP_GRAPHQL_ENDPOINT}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `
        query GetPosts {
          posts(first: 20) {
            nodes {
              slug
              title
              excerpt
              date
              featuredImage {
                node {
                  sourceUrl
                }
              }
              author {
                node {
                  name
                  avatar {
                    url
                  }
                }
              }
              categories {
                nodes {
                  name
                }
              }
            }
          }
        }
      `,
    }),
    next: { revalidate: 60 }, // ISR (revalidate every 60s)
  });

  const json = await res.json();
  if (!res.ok || json.errors) {
    console.error("Error fetching posts:", json.errors);
    throw new Error("Failed to fetch posts from WPGraphQL");
  }

  return json.data.posts.nodes;
}

export async function listBlogPosts() {
  const dir = path.join(process.cwd(), "content/blog");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"));

  return await Promise.all(
    files.map(async (file) => {
      const slug = file.replace(/\.mdx$/, "");
      const post = await import(`@/content/blog/${slug}.mdx`);

      return {
        slug,
        metadata: post.metadata as BlogPostMetadata, // ✅ Now metadata is available
      };
    })
  );
}