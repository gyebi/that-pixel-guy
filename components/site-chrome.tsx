import Link from "next/link";
import Image from "next/image";
import { isDemoAccessEnabled } from "@/lib/demo-access";
import { business } from "@/lib/site-content";
import { getPublicSiteSettings } from "@/lib/repositories/site-settings-repository";

const links = [
  ["Work", "/portfolio"],
  ["Services", "/services"],
  ["About", "/about"],
  ["Journal", "/journal"],
  ["Contact", "/contact"],
] as const;

export async function SiteHeader({ inverted = false }: { inverted?: boolean }) {
  const settings = await getPublicSiteSettings();

  return (
    <header className={`inner-header${inverted ? " inner-header--inverted" : ""}`}>
      <div className="content-width inner-header__content">
        <Link href="/" className="brand-lockup" aria-label={`${settings.businessName} home`}>
          <Image src={business.logos.mark} alt="" width={696} height={736} />
          <span>{settings.businessName}</span>
        </Link>
        <nav aria-label="Main navigation" className="inner-nav">
          {links.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
        </nav>
        {isDemoAccessEnabled() ? <Link href="/client-login" className="nav-login">Client login <Arrow /></Link> : null}
      </div>
    </header>
  );
}

export async function SiteFooter() {
  const settings = await getPublicSiteSettings();

  return (
    <footer className="site-footer">
      <div className="content-width footer-grid">
        <Link href="/" className="brand-lockup">
          <Image src={business.logos.full} alt={settings.businessName} width={703} height={736} />
        </Link>
        <div>
          <p>{settings.location ? `Based in ${settings.location}` : ""}</p>
          <a href={`mailto:${settings.publicEmail}`}>{settings.publicEmail}</a>
          {settings.phoneNumber ? <a href={`tel:${settings.phoneNumber.replace(/[^+\d]/g, "")}`}>{settings.phoneNumber}</a> : null}
          {settings.whatsAppNumber ? <a href={`https://wa.me/${settings.whatsAppNumber.replace(/\D/g, "")}`}>WhatsApp</a> : null}
        </div>
        <div>
          {settings.instagramUrl ? <a href={settings.instagramUrl}>Instagram</a> : null}
          {settings.facebookUrl ? <a href={settings.facebookUrl}>Facebook</a> : null}
          {settings.pinterestUrl ? <a href={settings.pinterestUrl}>Pinterest</a> : null}
          {settings.tikTokUrl ? <a href={settings.tikTokUrl}>TikTok</a> : null}
          {settings.youTubeUrl ? <a href={settings.youTubeUrl}>YouTube</a> : null}
        </div>
        <p className="copyright">© {new Date().getFullYear()} {settings.businessName}</p>
        <Link href="/admin/login" className="footer-staff-login">
          Staff Login
        </Link>
      </div>
    </footer>
  );
}

export function Arrow() { return <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 10h13M11 4l6 6-6 6" /></svg>; }
