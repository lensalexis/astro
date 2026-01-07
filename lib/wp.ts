// lib/wp.ts
export async function fetchWP(query: string, variables: any = {}) {
  const res = await fetch("https://kinebudsdispensary.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 60 }, // ISR: revalidate every 60s
  });

  const { data } = await res.json();
  return data;
}

// ✅ Fetch list of posts
export async function listBlogPosts() {
  const query = `
    query AllPosts {
      posts(first: 20, where: { orderby: { field: DATE, order: DESC } }) {
        nodes {
          slug
          title
          date
          excerpt
          featuredImage {
            node {
              sourceUrl
            }
          }
          categories {
            nodes {
              name
            }
          }
          author {
            node {
              name
              url
              avatar {
                url
              }
            }
          }
        }
      }
    }
  `;

  const data = await fetchWP(query);

  return data.posts.nodes.map((post: any) => ({
    slug: post.slug,
    metadata: {
      title: post.title || "Untitled Post",
      description: post.excerpt || "",
      date: post.date || "",
      image: post.featuredImage?.node?.sourceUrl || "/images/default-cover.jpg",
      author: post.author?.node?.name || "Unknown Author",
      authorImg: post.author?.node?.avatar?.url || "/images/default-avatar.jpg",
      authorRole: "Contributor",
      authorLink: post.author?.node?.url || "#",
      category: post.categories?.nodes?.[0]?.name || "Uncategorized",
    },
  }));
}

// ✅ Fetch single post
export async function getBlogPost(slug: string) {
  const query = `
    query PostBySlug($slug: ID!) {
      post(id: $slug, idType: SLUG) {
        slug
        title
        date
        content
        excerpt
        featuredImage {
          node {
            sourceUrl
          }
        }
        categories {
          nodes {
            name
          }
        }
        author {
          node {
            name
            url
            avatar {
              url
            }
          }
        }
      }
    }
  `;

  const data = await fetchWP(query, { slug });
  const post = data.post;

  return {
    slug: post.slug,
    metadata: {
      title: post.title || "Untitled Post",
      description: post.excerpt || "",
      date: post.date || "",
      image: post.featuredImage?.node?.sourceUrl || "/images/default-cover.jpg",
      author: post.author?.node?.name || "Unknown Author",
      authorImg: post.author?.node?.avatar?.url || "/images/default-avatar.jpg",
      authorRole: "Contributor",
      authorLink: post.author?.node?.url || "#",
      category: post.categories?.nodes?.[0]?.name || "Uncategorized",
    },
    content: post.content,
  };
}