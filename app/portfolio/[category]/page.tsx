import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { portfolioCategories } from "@/lib/site-content";

type Props = { params: Promise<{ category: string }> };

export default async function PortfolioCategoryPage({ params }: Props) {
  const { category: categorySlug } = await params;
  const category = portfolioCategories.find(({ name }) => name.toLowerCase() === categorySlug);
  if (!category) notFound();
  return <main><SiteHeader /><section className="category-hero" style={{ backgroundImage: `linear-gradient(rgba(16, 20, 18, .28), rgba(16, 20, 18, .28)), url(${category.image})` }}><div className="content-width"><p className="eyebrow light-eyebrow">{category.count}</p><h1>{category.name},<br />with feeling.</h1></div></section><section className="category-note content-width"><p className="eyebrow">A That Pixel Guy story</p><p>Each image begins with the people in it. Presence over perfection, and enough space for the unexpected moments to arrive.</p></section><SiteFooter /></main>;
}
