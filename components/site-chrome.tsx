import Link from "next/link";
import Image from "next/image";
import { business } from "@/lib/site-content";

const links = [
  ["Work", "/portfolio"],
  ["Services", "/services"],
  ["About", "/about"],
  ["Journal", "/journal"],
  ["Contact", "/contact"],
] as const;

export function SiteHeader({ inverted = false }: { inverted?: boolean }) {
  return (
    <header className={`inner-header${inverted ? " inner-header--inverted" : ""}`}>
      <div className="content-width inner-header__content">
        <Link href="/" className="brand-lockup" aria-label={`${business.name} home`}>
          <Image src={business.logos.mark} alt="" width={696} height={736} />
          <span>{business.name}</span>
        </Link>
        <nav aria-label="Main navigation" className="inner-nav">
          {links.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
        </nav>
        <Link href="/client-login" className="nav-login">Client login <Arrow /></Link>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="content-width footer-grid">
        <Link href="/" className="brand-lockup"><Image src={business.logos.full} alt={business.name} width={703} height={736} /></Link>
        <div><p>Based in {business.location}</p><a href={`mailto:${business.email}`}>{business.email}</a></div>
        <div><a href="#">Instagram</a><a href="#">Pinterest</a></div>
        <p className="copyright">© {new Date().getFullYear()} {business.name}</p>
      </div>
    </footer>
  );
}

export function Arrow() { return <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 10h13M11 4l6 6-6 6" /></svg>; }
