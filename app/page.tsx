import Link from "next/link";
import Image from "next/image";
import { isDemoAccessEnabled } from "@/lib/demo-access";
import { FooterContactDetails } from "@/components/site-chrome";
import { getFooterContactLinks } from "@/lib/footer-contact-links";
import { business, portfolioCategories } from "@/lib/site-content";
import { getHomepageImage } from "@/lib/homepage/homepage-images";
import { getPublicHomepageContent } from "@/lib/repositories/homepage-content-repository";
import { getPublicSiteSettings } from "@/lib/repositories/site-settings-repository";

export default async function Home() {
  const [settings, content] = await Promise.all([
    getPublicSiteSettings(),
    getPublicHomepageContent(),
  ]);
  const images = {
    hero: getHomepageImage(content, "hero"),
    workWedding: getHomepageImage(content, "workWedding"),
    workPortrait: getHomepageImage(content, "workPortrait"),
    workFamily: getHomepageImage(content, "workFamily"),
    service: getHomepageImage(content, "service"),
    contact: getHomepageImage(content, "contact"),
  };
  const contact = getFooterContactLinks(settings);
  const selectedWork = portfolioCategories.map((category, index) => ({
    ...category,
    image: [images.workWedding, images.workPortrait, images.workFamily][index]!,
  }));

  return (
    <main>
      <section className="hero" style={{ backgroundImage: `linear-gradient(90deg, rgba(18, 22, 20, .68) 0%, rgba(18, 22, 20, .28) 48%, rgba(18, 22, 20, .08)), url(${images.hero.url})` }}>
        <span className="sr-only">{images.hero.alt}</span>
        <nav className="site-nav content-width" aria-label="Main navigation">
          <Link href="/" className="brand-lockup brand-lockup--hero" aria-label={`${settings.businessName} home`}>
            <Image src={business.logos.enlargedMark} alt="" width={704} height={736} priority />
            <span>{settings.businessName}</span>
          </Link>
          <div className="nav-links">
            <a href="#work">Work</a><a href="#about">About</a>{contact.email ? <a href="#contact">Contact</a> : null}
          </div>
          {isDemoAccessEnabled() ? <Link href="/client-login" className="nav-login">Client login <Arrow /></Link> : null}
        </nav>
        <div className="hero-copy content-width">
          <p className="eyebrow light-eyebrow">{content.heroEyebrow}</p>
          <h1 className="homepage-managed-heading">{content.heroHeading}</h1>
          <p className="hero-intro">{content.heroIntro}</p>
          {contact.email ? <a href="#contact" className="text-link light-link">{content.heroCtaLabel} <Arrow /></a> : null}
        </div>
        <a href="#work" className="scroll-cue" aria-label="Scroll to selected work"><span>Scroll to explore</span><i /></a>
      </section>

      <section className="intro-section content-width" id="about">
        <p className="eyebrow">{content.introEyebrow}</p>
        <div className="intro-grid">
          <h2 className="homepage-managed-heading">{content.introHeading}</h2>
          <div className="intro-copy"><p>{content.introBody}</p>{contact.email ? <a href="#contact" className="text-link">{content.introCtaLabel} <Arrow /></a> : null}</div>
        </div>
      </section>

      <section className="selected-work" id="work">
        <div className="section-heading content-width"><div><p className="eyebrow">{content.workEyebrow}</p><h2 className="homepage-managed-heading">{content.workHeading}</h2></div><a href="#portfolio" className="text-link">{content.workCtaLabel} <Arrow /></a></div>
        <div className="portfolio-grid content-width" id="portfolio">
          {selectedWork.map((category) => <a className={`portfolio-card ${category.className}`} href={`/portfolio/${category.name.toLowerCase()}`} key={category.name} style={{ backgroundImage: `url(${category.image.url})` }} aria-label={`${category.name}: ${category.image.alt}`}><span className="portfolio-wash" /><span className="portfolio-caption"><strong>{category.name}</strong></span></a>)}
        </div>
      </section>

      <section className="services-section content-width">
        <div className="service-image" role="img" aria-label={images.service.alt} style={{ backgroundImage: `url(${images.service.url})` }} />
        <div className="service-copy"><p className="eyebrow">{content.servicesEyebrow}</p><h2 className="homepage-managed-heading">{content.servicesHeading}</h2><p>{content.servicesBody}</p><div className="service-list"><a href="/services"><span>01</span> Weddings <Arrow /></a><a href="/services"><span>02</span> Portraits <Arrow /></a><a href="/services"><span>03</span> Families <Arrow /></a></div></div>
      </section>

      {contact.email ? <section className="contact-section" id="contact" style={{ backgroundImage: `linear-gradient(rgba(45, 30, 19, .52), rgba(45, 30, 19, .52)), url(${images.contact.url})` }}><span className="sr-only">{images.contact.alt}</span><div className="content-width contact-wrap"><p className="eyebrow">{content.contactEyebrow}</p><h2 className="homepage-managed-heading">{content.contactHeading}</h2><a href={contact.email.href} className="button-link">{content.contactCtaLabel} <Arrow /></a></div></section> : null}
      <footer className="site-footer">
        <div className="content-width footer-grid">
          <Image className="footer-full-logo" src={business.logos.full} alt={settings.businessName} width={703} height={736} />
          <FooterContactDetails settings={settings} />
          <div>{settings.instagramUrl ? <a href={settings.instagramUrl}>Instagram</a> : null}
            {settings.facebookUrl ? <a href={settings.facebookUrl}>Facebook</a> : null}
            {settings.pinterestUrl ? <a href={settings.pinterestUrl}>Pinterest</a> : null}
            {settings.tikTokUrl ? <a href={settings.tikTokUrl}>TikTok</a> : null}
            {settings.youTubeUrl ? <a href={settings.youTubeUrl}>YouTube</a> : null}

            <Link href="/admin/login" className="footer-staff-login">Staff Login
            </Link>

          </div><p className="copyright">© {new Date().getFullYear()} {settings.businessName}</p></div></footer>
    </main>
  );
}

function Arrow() { return <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 10h13M11 4l6 6-6 6" /></svg>; }
