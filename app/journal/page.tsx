import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { journalPosts } from "@/lib/site-content";

export const metadata = { title: "Journal" };

export default function JournalPage() {
  return <main><SiteHeader /><section className="page-intro content-width"><p className="eyebrow">The journal</p><h1>Notes on love,<br />life &amp; light.</h1><p>Real celebrations, thoughtful guidance, and stories from behind the lens.</p></section><section className="journal-list content-width">{journalPosts.map((post, index) => <article key={post.title} className="journal-list-card"><Link href={`/journal/story-${index + 1}`} className="journal-image" style={{ backgroundImage: `url(${post.image})` }} aria-label={post.title} /><div><p className="post-meta">{post.category} <span>·</span> {post.date}</p><h2><Link href={`/journal/story-${index + 1}`}>{post.title}</Link></h2><p>A considered look at the people, places, and ideas that make photographs worth keeping.</p><Link href={`/journal/story-${index + 1}`} className="text-link">Read story</Link></div></article>)}</section><SiteFooter /></main>;
}
