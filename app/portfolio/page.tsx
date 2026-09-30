import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { portfolioCategories } from "@/lib/site-content";

export const metadata = { title: "Portfolio" };

export default function PortfolioPage() {
  return <main><SiteHeader /><section className="page-intro content-width"><p className="eyebrow">The portfolio</p><h1>Life, held<br />beautifully.</h1><p>Quiet glances, noisy rooms, the hands you reach for. A collection of stories made with feeling.</p></section><section className="portfolio-page-grid content-width">{portfolioCategories.map((category) => <Link href={`/portfolio/${category.name.toLowerCase()}`} key={category.name} className="portfolio-page-card" style={{ backgroundImage: `url(${category.image})` }}><span><strong>{category.name}</strong><em>{category.count}</em></span></Link>)}</section><SiteFooter /></main>;
}
