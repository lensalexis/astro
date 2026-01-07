import fs from "fs";
import path from "path";

export function getCategoriesFromFiles() {
  const files = fs.readdirSync(path.join(process.cwd(), "content/blog"));
  const categories = new Set<string>();

  files.forEach((file) => {
    const raw = fs.readFileSync(path.join(process.cwd(), "content/blog", file), "utf-8");
    const match = raw.match(/category:\s*"?([^"\n]+)"?/);
    if (match) categories.add(match[1]);
  });

  return Array.from(categories);
}