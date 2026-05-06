// TODO: Replace placeholder posts with your actual blog posts.
// When you wire this up to a real CMS or markdown files, remove this array
// and fetch/import posts from your data source instead.
const POSTS = [
  {
    title: "TODO: Your First Blog Post Title",
    date: "TODO: Month DD, YYYY",
    tag: "TODO: Tag (e.g. React, Career, Tutorial)",
    excerpt:
      "TODO: 1–2 sentence excerpt that gives the reader a reason to click. Make it specific — what will they learn or take away?",
    slug: "#", // TODO: Link to the actual post
  },
  {
    title: "TODO: Your Second Blog Post Title",
    date: "TODO: Month DD, YYYY",
    tag: "TODO: Tag",
    excerpt:
      "TODO: Write a compelling excerpt here. The best excerpts hint at a surprising insight or a concrete takeaway.",
    slug: "#", // TODO: Link to the actual post
  },
  {
    title: "TODO: Your Third Blog Post Title",
    date: "TODO: Month DD, YYYY",
    tag: "TODO: Tag",
    excerpt:
      "TODO: Another excerpt. If you don't have blog posts yet, write about something you've recently learned or a problem you solved at work.",
    slug: "#", // TODO: Link to the actual post
  },
];

const Blog = () => {
  return (
    <section id="blog" className="py-24 bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-16">
          <div>
            <p className="font-mono text-indigo-400 text-xs uppercase tracking-widest mb-2">
              04. Blog
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Recent Writing
            </h2>
          </div>
          {/* TODO: Replace # with your blog index page URL if it's on a separate route */}
          <a
            href="#"
            className="text-indigo-400 hover:text-indigo-300 text-sm font-medium flex items-center gap-1 transition-colors shrink-0"
          >
            View all posts
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </a>
        </div>

        {/* Posts grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {POSTS.map((post, i) => (
            <article
              key={i}
              className="bg-slate-800/40 border border-slate-700 rounded-xl p-6 hover:border-indigo-500/40 hover:-translate-y-1 transition-all duration-300 flex flex-col group"
            >
              {/* Tag */}
              <span className="inline-block bg-indigo-950/60 border border-indigo-800/50 text-indigo-300 text-xs font-mono px-2.5 py-1 rounded-full mb-4 self-start">
                {post.tag}
              </span>

              {/* Title */}
              <h3 className="text-white font-semibold text-lg leading-snug mb-3 group-hover:text-indigo-300 transition-colors">
                <a href={post.slug}>{post.title}</a>
              </h3>

              {/* Excerpt */}
              <p className="text-slate-400 text-sm leading-relaxed mb-5 flex-grow">
                {post.excerpt}
              </p>

              <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-700">
                <span className="font-mono text-slate-500 text-xs">
                  {post.date}
                </span>
                <a
                  href={post.slug}
                  className="text-indigo-400 hover:text-indigo-300 text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  Read more →
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Blog;
