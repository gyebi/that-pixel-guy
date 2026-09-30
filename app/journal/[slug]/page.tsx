import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { journalPosts } from "@/lib/site-content";

type Props = { params: Promise<{ slug: string }> };

export default async function JournalPostPage({ params }: Props) {
  const { slug } = await params;
  const index = Number(slug.replace("story-", "")) - 1;
  const post = journalPosts[index];
  if (!post) notFound();
  return <main><SiteHeader /><article className="story"><header className="story-header content-width"><p className="post-meta">{post.category} <span>·</span> {post.date}</p><h1>{post.title}</h1><p>By That Pixel Guy</p></header><div className="story-cover" style={{ backgroundImage: `url(${post.image})` }} /><div className="story-body"><p>There is beauty in the unplanned: the in-between laugh, the afternoon light, the moment someone reaches for a hand. These are the details that bring a photograph back to life.</p><p>This is where we share the stories behind the images, as well as useful notes for planning a session that feels fully like you.</p></div></article><SiteFooter /></main>;
}
