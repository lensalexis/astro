import { useMDXComponents } from "@/mdx-components";
import { MDXProvider } from "@mdx-js/react";

type CustomMDXProps = {
  source: string;
};

// Basic markdown/MDX content renderer
// Since @next/mdx compiles MDX at build time, we'll render the content as formatted text
// For proper MDX rendering, you'd need next-mdx-remote or to import MDX files directly
export function CustomMDX({ source }: CustomMDXProps) {
  const components = useMDXComponents({});

  // Split content into lines and render with basic formatting
  const lines = source.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];
  let inList = false;

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Handle list items
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      if (!inList) {
        inList = true;
        currentList = [];
      }
      currentList.push(trimmed.substring(2));
      return;
    } else if (inList && trimmed === "") {
      // End of list
      elements.push(
        <ul key={`list-${index}`} className="list-disc list-inside space-y-2 mb-4">
          {currentList.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
      currentList = [];
      inList = false;
      return;
    } else if (inList) {
      // End list before non-list item
      elements.push(
        <ul key={`list-${index}`} className="list-disc list-inside space-y-2 mb-4">
          {currentList.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
      currentList = [];
      inList = false;
    }

    // Handle headings
    if (trimmed.startsWith("### ")) {
      elements.push(
        <h3 key={index} className="text-xl font-semibold mt-6 mb-3">
          {trimmed.substring(4)}
        </h3>
      );
    } else if (trimmed.startsWith("## ")) {
      elements.push(
        <h2 key={index} className="text-2xl font-semibold mt-6 mb-3">
          {trimmed.substring(3)}
        </h2>
      );
    } else if (trimmed.startsWith("# ")) {
      elements.push(
        <h1 key={index} className="text-3xl font-semibold mt-6 mb-3">
          {trimmed.substring(2)}
        </h1>
      );
    } else if (trimmed !== "") {
      // Regular paragraph
      elements.push(
        <p key={index} className="mb-4">
          {trimmed}
        </p>
      );
    } else if (trimmed === "" && elements.length > 0) {
      // Empty line - add spacing
      elements.push(<br key={`br-${index}`} />);
    }
  });

  // Handle any remaining list
  if (inList && currentList.length > 0) {
    elements.push(
      <ul key="list-final" className="list-disc list-inside space-y-2 mb-4">
        {currentList.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    );
  }

  return (
    <MDXProvider components={components}>
      <div>{elements}</div>
    </MDXProvider>
  );
}
