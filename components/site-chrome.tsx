import Link from "next/link";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faLocationDot, faPhone } from "@fortawesome/free-solid-svg-icons";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { isDemoAccessEnabled } from "@/lib/demo-access";
import { getFooterContactLinks } from "@/lib/footer-contact-links";
import { business } from "@/lib/site-content";
import type { PublicSiteSettings } from "@/lib/site-settings/site-settings-types";
import { getPublicSiteSettings } from "@/lib/repositories/site-settings-repository";

const links = [
  ["Work", "/portfolio"],
  ["Services", "/services"],
  ["About", "/about"],
  ["Contact", "/contact"],
] as const;

export async function SiteHeader({ inverted = false }: { inverted?: boolean }) {
  const settings = await getPublicSiteSettings();
  const contact = getFooterContactLinks(settings);

  return (
    <header className={`inner-header${inverted ? " inner-header--inverted" : ""}`}>
      <div className="content-width inner-header__content">
        <Link href="/" className="brand-lockup" aria-label={`${settings.businessName} home`}>
          <Image src={business.logos.mark} alt="" width={696} height={736} />
          <span>{settings.businessName}</span>
        </Link>
        <nav aria-label="Main navigation" className="inner-nav">
          {links.map(([label, href]) => <Link href={href} key={href}>{label}</Link>)}
          {contact.email ? <Link href="/contact">Contact</Link> : null}
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
        <FooterContactDetails settings={settings} />
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

export function FooterContactDetails({ settings }: { settings: PublicSiteSettings }) {
  const contact = getFooterContactLinks(settings);
  if (!contact.location && !contact.email && !contact.phone && !contact.whatsApp) return null;

  return <div className="footer-contact">
    {contact.location ? <p className="footer-contact__item"><FontAwesomeIcon icon={faLocationDot} aria-hidden="true" /><span>Based in {contact.location}</span></p> : null}
    {contact.email ? <a className="footer-contact__item" href={contact.email.href}><FontAwesomeIcon icon={faEnvelope} aria-hidden="true" /><span>{contact.email.label}</span></a> : null}
    {contact.phone ? <a className="footer-contact__item" href={contact.phone.href}><FontAwesomeIcon icon={faPhone} aria-hidden="true" /><span>{contact.phone.label}</span></a> : null}
    {contact.whatsApp ? <a className="footer-contact__item" href={contact.whatsApp.href} aria-label="Chat on WhatsApp"><FontAwesomeIcon icon={faWhatsapp} aria-hidden="true" /><span>{contact.whatsApp.label}</span></a> : null}
  </div>;
}

export function Arrow() { return <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 10h13M11 4l6 6-6 6" /></svg>; }
