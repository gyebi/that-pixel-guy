import Link from "next/link";
import Image from "next/image";
import { business, journalPosts, portfolioCategories, testimonials } from "@/lib/site-content";

export default function Home() {
  return (
    <main>
      <section className="hero">
        <nav className="site-nav content-width" aria-label="Main navigation">
          <Link href="/" className="brand-lockup brand-lockup--hero" aria-label={`${business.name} home`}>
            <Image src={business.logos.enlargedMark} alt="" width={704} height={736} priority />
            <span>{business.name}</span>
          </Link>
          <div className="nav-links">
            <a href="#work">Work</a><a href="#about">About</a><a href="#journal">Journal</a><a href="#contact">Contact</a>
          </div>
          <Link href="/client-login" className="nav-login">Client login <Arrow /></Link>
        </nav>
        <div className="hero-copy content-width">
          <p className="eyebrow light-eyebrow">Accra · Ghana · Available worldwide</p>
          <h1>Photographs with<br />a pulse.</h1>
          <p className="hero-intro">Honest, artful photography for the occasions and people you never want to forget.</p>
          <a href="#contact" className="text-link light-link">Begin your story <Arrow /></a>
        </div>
        <a href="#work" className="scroll-cue" aria-label="Scroll to selected work"><span>Scroll to explore</span><i /></a>
      </section>

      <section className="intro-section content-width" id="about">
        <p className="eyebrow">The Pixel Guy approach</p>
        <div className="intro-grid">
          <h2>Where feeling<br />becomes form.</h2>
          <div className="intro-copy"><p>The best photographs don&apos;t ask you to perform. They make room for you to be there—fully, beautifully, and without hurry.</p><a href="#contact" className="text-link">Meet the Pixel Guy <Arrow /></a></div>
        </div>
      </section>

      <section className="selected-work" id="work">
        <div className="section-heading content-width"><div><p className="eyebrow">Selected work</p><h2>Stories worth returning to.</h2></div><a href="#portfolio" className="text-link">View all work <Arrow /></a></div>
        <div className="portfolio-grid content-width" id="portfolio">
          {portfolioCategories.map((category) => <a className={`portfolio-card ${category.className}`} href={`/portfolio/${category.name.toLowerCase()}`} key={category.name} style={{ backgroundImage: `url(${category.image})` }}><span className="portfolio-wash" /><span className="portfolio-caption"><strong>{category.name}</strong><em>{category.count}</em></span></a>)}
        </div>
      </section>

      <section className="services-section content-width">
        <div className="service-image" role="img" aria-label="Bride holding a bouquet on her wedding day" />
        <div className="service-copy"><p className="eyebrow">For the remarkable days</p><h2>Be in the moment.<br />I&apos;ll hold onto it.</h2><p>From joyful gatherings to quiet milestones, every session is considered with care and made to feel unmistakably yours.</p><div className="service-list"><a href="/services"><span>01</span> Weddings <Arrow /></a><a href="/services"><span>02</span> Portraits <Arrow /></a><a href="/services"><span>03</span> Families <Arrow /></a></div></div>
      </section>

      <section className="testimonial-section"><div className="content-width testimonial-wrap"><p className="eyebrow light-eyebrow">Kind words</p><blockquote>“{testimonials[0].quote}”</blockquote><p className="testimonial-credit">{testimonials[0].name} <span>/</span> {testimonials[0].occasion}</p><div className="testimonial-dots" aria-label="Testimonial 1 of 2"><i className="active" /><i /></div></div></section>

      <section className="journal-section content-width" id="journal">
        <div className="section-heading"><div><p className="eyebrow">From the journal</p><h2>Notes on love &amp; living.</h2></div><Link href="/journal" className="text-link">Read the journal <Arrow /></Link></div>
        <div className="journal-grid">{journalPosts.map((post) => <article className="journal-card" key={post.title}><Link className="journal-image" href="/journal" style={{ backgroundImage: `url(${post.image})` }} aria-label={post.title} /><p className="post-meta">{post.category} <span>·</span> {post.date}</p><h3><Link href="/journal">{post.title}</Link></h3><Link href="/journal" className="text-link small-link">Read story <Arrow /></Link></article>)}</div>
      </section>

      <section className="contact-section" id="contact"><div className="content-width contact-wrap"><p className="eyebrow">Let&apos;s make something beautiful</p><h2>Tell me what<br />you&apos;re dreaming of.</h2><a href={`mailto:${business.email}`} className="button-link">Start a conversation <Arrow /></a></div></section>
      <footer className="site-footer"><div className="content-width footer-grid"><Image className="footer-full-logo" src={business.logos.full} alt={business.name} width={703} height={736} /><div><p>Based in {business.location}</p><a href={`mailto:${business.email}`}>{business.email}</a></div><div><a href="#">Instagram</a><a href="#">Pinterest</a></div><p className="copyright">© {new Date().getFullYear()} {business.name}</p></div></footer>
    </main>
  );
}

function Arrow() { return <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 10h13M11 4l6 6-6 6" /></svg>; }
