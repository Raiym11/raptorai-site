import { getAllPosts } from "@/lib/posts";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Блог — RaptorAI",
  description: "Статьи об автоматизации бизнеса, ИИ-агентах и n8n.",
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <section style={{ padding: "120px 24px 100px", minHeight: "100vh" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--cyan)", letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "monospace", marginBottom: "16px" }}>Блог</div>
        <h1 style={{ fontSize: "clamp(28px,4vw,46px)", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "16px" }}>
          Статьи об <span style={{ color: "var(--cyan)" }}>автоматизации</span>
        </h1>
        <p style={{ fontSize: "17px", color: "var(--gray)", maxWidth: "540px", lineHeight: 1.7, marginBottom: "60px" }}>
          Практические гайды, кейсы и советы по ИИ-автоматизации для бизнеса.
        </p>

        {posts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 24px", color: "var(--gray)" }}>
            <i className="fa-solid fa-pen-to-square" style={{ fontSize: "48px", color: "var(--cyan-mid)", display: "block", marginBottom: "24px" }} />
            <p style={{ fontSize: "18px", marginBottom: "12px" }}>Статьи скоро появятся</p>
            <p style={{ fontSize: "14px" }}>Готовим полезный контент об автоматизации бизнеса</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: "24px" }}>
            {posts.map(post => (
              <Link key={post.slug} href={`/blog/${post.slug}`} style={{ textDecoration: "none" }}>
                <article style={{
                  background: "var(--card)", border: "1px solid var(--border)",
                  borderRadius: "12px", padding: "32px",
                  transition: "border-color 0.3s, transform 0.3s",
                  height: "100%"
                }}>
                  <div style={{ display: "inline-block", background: "var(--cyan-dim)", border: "1px solid var(--cyan-mid)", color: "var(--cyan)", fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "4px", marginBottom: "16px", fontFamily: "monospace" }}>
                    {post.category}
                  </div>
                  <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "10px", color: "var(--white)" }}>{post.title}</h2>
                  <p style={{ fontSize: "14px", color: "var(--gray)", lineHeight: 1.7, marginBottom: "20px" }}>{post.excerpt}</p>
                  <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "var(--gray)" }}>
                    <span><i className="fa-regular fa-calendar" style={{ marginRight: "6px" }} />{post.date}</span>
                    <span><i className="fa-regular fa-clock" style={{ marginRight: "6px" }} />{post.readTime}</span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
