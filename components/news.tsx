import { getBlogPosts } from "@/lib/blog";
// import PostItem from "../app/(default)/blog/post-item";

export default function News() {
  const allBlogs = getBlogPosts();

  // Sort posts by date (if publishedAt exists)
  allBlogs.sort((a, b) => {
    const dateA = (a.metadata as any).publishedAt || a.metadata.title || '';
    const dateB = (b.metadata as any).publishedAt || b.metadata.title || '';
    return dateA > dateB ? -1 : 1;
  });

  const posts = allBlogs.slice(0, 3);

  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="border-t border-gray-800 py-12 md:py-20">
          {/* Section header */}
          <div className="mx-auto max-w-3xl pb-12 text-center md:pb-20">
            <h2 className="h2" data-aos="fade-up">
              Refreshing news for developers and designers
            </h2>
          </div>

          {/* Articles list */}
          <div className="mx-auto max-w-sm md:max-w-none">
            <div className="grid items-start gap-12 md:grid-cols-3 md:gap-x-6 md:gap-y-8">
              {posts.map((post, postIndex) => (
                <div key={postIndex} className="flex flex-col">
                  <h3 className="text-xl font-semibold mb-2">{post.metadata.title}</h3>
                  <p className="text-gray-400">{post.metadata.summary}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
