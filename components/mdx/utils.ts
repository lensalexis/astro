import fs from "fs";
import path from "path";
import matter from "gray-matter";

export type HelpPageMetadata = {
  title: string;
  summary: string;
  updatedAt?: string;
};

export type HelpPage = {
  slug: string;
  metadata: HelpPageMetadata;
  content: string;
};

export function getHelpPages(): HelpPage[] {
  const dir = path.join(process.cwd(), "content/help");
  
  if (!fs.existsSync(dir)) {
    return [];
  }

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"));

  return files.map((file) => {
    const slug = file.replace(/\.mdx$/, "");
    const filePath = path.join(dir, file);
    const fileContents = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(fileContents);

    return {
      slug,
      metadata: {
        title: data.title || "",
        summary: data.summary || "",
        updatedAt: data.updatedAt,
      },
      content,
    };
  });
}
