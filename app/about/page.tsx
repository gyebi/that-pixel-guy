import Link from "next/link";
import { Arrow, SiteFooter, SiteHeader } from "@/components/site-chrome";

export const metadata = { title: "About" };

export default function AboutPage() {
  return <main><SiteHeader /><section className="about-hero"><div className="content-width"><div><p className="eyebrow">About That Pixel Guy</p><h1>Here for<br />the real stuff.</h1></div></div></section><section className="about-story content-width"><div><p className="eyebrow">The person behind the camera</p><h2>I&apos;m That Pixel Guy—an observer, a storyteller, and a firm believer in making space for people to be themselves.</h2></div><div><p>My work is drawn to movement, warmth, and all the small things that make a memory feel like your own. I photograph with gentle direction and a keen eye for what unfolds when everyone forgets the camera is there.</p><p>Based in Accra and working wherever a good story takes me.</p><Link href="/contact" className="text-link">Let&apos;s talk <Arrow /></Link></div></section><SiteFooter /></main>;
}
