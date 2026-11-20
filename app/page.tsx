import Link from "next/link";
import Image from "next/image";
import { isDemoAccessEnabled } from "@/lib/demo-access";
import { business, journalPosts, portfolioCategories, testimonials } from "@/lib/site-content";
import { getPublicHomepageContent } from "@/lib/repositories/homepage-content-repository";
import { getPublicSiteSettings } from "@/lib/repositories/site-settings-repository";

export default async function Home() {
  const [settings, content] = await Promise.all([
    getPublicSiteSettings(),
    getPublicHomepageContent(),
  ]);

  return (
    <main>
      <section className="hero">
        <nav className="site-nav content-width" aria-label="Main navigation">
          <Link href="/" className="brand-lockup brand-lockup--hero" aria-label={`${settings.businessName} home`}>
            <Image src={business.logos.enlargedMark} alt="" width={704} height={736} priority />
            <span>{settings.businessName}</span>
          </Link>
          <div className="nav-links">
            <a href="#work">Work</a><a href="#about">About</a><a href="#journal">Journal</a><a href="#contact">Contact</a>
          </div>
          {isDemoAccessEnabled() ? <Link href="/client-login" className="nav-login">Client login <Arrow /></Link> : null}
        </nav>
        <div className="hero-copy content-width">
          <p className="eyebrow light-eyebrow">{content.heroEyebrow}</p>
          <h1 className="homepage-managed-heading">{content.heroHeading}</h1>
          <p className="hero-intro">{content.heroIntro}</p>
          <a href="#contact" className="text-link light-link">{content.heroCtaLabel} <Arrow /></a>
        </div>
        <a href="#work" className="scroll-cue" aria-label="Scroll to selected work"><span>Scroll to explore</span><i /></a>
      </section>

      <section className="intro-section content-width" id="about">
        <p className="eyebrow">{content.introEyebrow}</p>
        <div className="intro-grid">
          <h2 className="homepage-managed-heading">{content.introHeading}</h2>
          <div className="intro-copy"><p>{content.introBody}</p><a href="#contact" className="text-link">{content.introCtaLabel} <Arrow /></a></div>
        </div>
      </section>

      <section className="selected-work" id="work">
        <div className="section-heading content-width"><div><p className="eyebrow">{content.workEyebrow}</p><h2 className="homepage-managed-heading">{content.workHeading}</h2></div><a href="#portfolio" className="text-link">{content.workCtaLabel} <Arrow /></a></div>
        <div className="portfolio-grid content-width" id="portfolio">
          {portfolioCategories.map((category) => <a className={`portfolio-card ${category.className}`} href={`/portfolio/${category.name.toLowerCase()}`} key={category.name} style={{ backgroundImage: `url(${category.image})` }}><span className="portfolio-wash" /><span className="portfolio-caption"><strong>{category.name}</strong><em>{category.count}</em></span></a>)}
        </div>
      </section>

      <section className="services-section content-width">
        <div className="service-image" role="img" aria-label="Bride holding a bouquet on her wedding day" />
        <div className="service-copy"><p className="eyebrow">{content.servicesEyebrow}</p><h2 className="homepage-managed-heading">{content.servicesHeading}</h2><p>{content.servicesBody}</p><div className="service-list"><a href="/services"><span>01</span> Weddings <Arrow /></a><a href="/services"><span>02</span> Portraits <Arrow /></a><a href="/services"><span>03</span> Families <Arrow /></a></div></div>
      </section>

      <section className="testimonial-section"><div className="content-width testimonial-wrap"><p className="eyebrow light-eyebrow">Kind words</p><blockquote>“{testimonials[0].quote}”</blockquote><p className="testimonial-credit">{testimonials[0].name} <span>/</span> {testimonials[0].occasion}</p><div className="testimonial-dots" aria-label="Testimonial 1 of 2"><i className="active" /><i /></div></div></section>

      <section className="journal-section content-width" id="journal">
        <div className="section-heading"><div><p className="eyebrow">From the journal</p><h2>Notes on love &amp; living.</h2></div><Link href="/journal" className="text-link">Read the journal <Arrow /></Link></div>
        <div className="journal-grid">{journalPosts.map((post) => <article className="journal-card" key={post.title}><Link className="journal-image" href="/journal" style={{ backgroundImage: `url(${post.image})` }} aria-label={post.title} /><p className="post-meta">{post.category} <span>·</span> {post.date}</p><h3><Link href="/journal">{post.title}</Link></h3><Link href="/journal" className="text-link small-link">Read story <Arrow /></Link></article>)}</div>
      </section>

      <section className="contact-section" id="contact"><div className="content-width contact-wrap"><p className="eyebrow">{content.contactEyebrow}</p><h2 className="homepage-managed-heading">{content.contactHeading}</h2><a href={`mailto:${settings.publicEmail}`} className="button-link">{content.contactCtaLabel} <Arrow /></a></div></section>
      <footer className="site-footer">
        <div className="content-width footer-grid">
          <Image className="footer-full-logo" src={business.logos.full} alt={settings.businessName} width={703} height={736} />
          <div><p>{settings.location ? `Based in ${settings.location}` : ""}</p><a href={`mailto:${settings.publicEmail}`}>{settings.publicEmail}</a>{settings.phoneNumber ? <a href={`tel:${settings.phoneNumber.replace(/[^+\d]/g, "")}`}>{settings.phoneNumber}</a> : null}{settings.whatsAppNumber ? <a href={`https://wa.me/${settings.whatsAppNumber.replace(/\D/g, "")}`}>WhatsApp</a> : null}</div>
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
