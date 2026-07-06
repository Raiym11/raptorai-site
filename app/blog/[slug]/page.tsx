import { getPostBySlug, getAllPosts } from "@/lib/posts";
import { remark } from "remark";
import html from "remark-html";
import { notFound } from "next/navigation";
import Link from "next/link";

export async function generateStaticParams() {
  return getAllPosts().map(p => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return { title: `${post.title} — RaptorAI`, description: post.excerpt };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const processed = await remark().use(html).process(post.content || "");
  const contentHtml = processed.toString();

  return (
    <section style={{ padding: "120px 24px 100px", minHeight: "100vh" }}>
      <div style={{ maxWidth: "760px", margin: "0 auto" }}>
        <Link href="/blog" style={{ color: "var(--gray)", textDecoration: "none", fontSize: "14px", display: "inline-flex", alignItems: "center", gap: "8px", marginBottom: "40px" }}>
          <i className="fa-solid fa-arrow-left" /> Все статьи
        </Link>
        <div style={{ display: "inline-block", background: "var(--cyan-dim)", border: "1px solid var(--cyan-mid)", color: "var(--cyan)", fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "4px", marginBottom: "20px", fontFamily: "monospace" }}>
          {post.category}
        </div>
        <h1 style={{ fontSize: "clamp(24px,4vw,42px)", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: "20px" }}>{post.title}</h1>
        <div style={{ display: "flex", gap: "16px", fontSize: "13px", color: "var(--gray)", marginBottom: "48px", paddingBottom: "32px", borderBottom: "1px solid var(--border)" }}>
          <span><i className="fa-regular fa-calendar" style={{ marginRight: "6px" }} />{post.date}</span>
          <span><i className="fa-regular fa-clock" style={{ marginRight: "6px" }} />{post.readTime}</span>
        </div>
        <div
          dangerouslySetInnerHTML={{ __html: contentHtml }}
          style={{ lineHeight: 1.8, fontSize: "16px", color: "var(--gray)" }}
        />
      </div>
    </section>
  );
}
