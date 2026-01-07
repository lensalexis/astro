import fs from "fs";
import path from "path";
import matter from "gray-matter";

const postsDir = path.join(process.cwd(), "content/blog");

export function getBlogPosts() {
  const files = fs.readdirSync(postsDir);

  return files.map((file) => {
    const slug = file.replace(/\.mdx?$/, "");
    const raw = fs.readFileSync(path.join(postsDir, file), "utf-8");
    const { data, content } = matter(raw);

    return {
      slug,
      metadata: {
        title: data.title || slug,
        summary: data.summary || "",
        image: data.image || null,
        author: data.author || "Kine Buds Team",
      },
      content,
    };
  });
}