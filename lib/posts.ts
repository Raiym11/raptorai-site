import fs from "fs";
import path from "path";
import matter from "gray-matter";

const postsDir = path.join(process.cwd(), "posts");

export interface Post {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  category: string;
  readTime: string;
  content?: string;
}

export function getAllPosts(): Post[] {
  if (!fs.existsSync(postsDir)) return [];
  const files = fs.readdirSync(postsDir).filter(f => f.endsWith(".md"));
  return files.map(file => {
    const slug = file.replace(".md", "");
    const raw = fs.readFileSync(path.join(postsDir, file), "utf-8");
    const { data } = matter(raw);
    return {
      slug,
      title: data.title || slug,
      date: data.date || "",
      excerpt: data.excerpt || "",
      category: data.category || "Автоматизация",
      readTime: data.readTime || "5 мин",
    };
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostBySlug(slug: string): Post | null {
  const filePath = path.join(postsDir, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  return {
    slug,
    title: data.title || slug,
    date: data.date || "",
    excerpt: data.excerpt || "",
    category: data.category || "Автоматизация",
    readTime: data.readTime || "5 мин",
    content,
  };
}
