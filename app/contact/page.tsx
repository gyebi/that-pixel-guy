import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { business } from "@/lib/site-content";

export const metadata = { title: "Contact" };

export default function ContactPage() {
  return <main><SiteHeader /><section className="contact-page content-width"><div><p className="eyebrow">Get in touch</p><h1>Let&apos;s make<br />something lasting.</h1><p>Tell me a little about what you&apos;re planning and I&apos;ll be in touch with availability and next steps.</p><a href={`mailto:${business.email}`} className="text-link">{business.email}</a></div><form className="enquiry-form"><label>Your name<input name="name" autoComplete="name" required /></label><label>Email address<input name="email" type="email" autoComplete="email" required /></label><label>What are we celebrating?<select name="occasion" defaultValue=""><option value="" disabled>Select an occasion</option><option>Wedding</option><option>Portrait</option><option>Family session</option><option>Something else</option></select></label><label>Tell me more<textarea name="message" rows={4} required /></label><p>Enquiry form submission will be connected during the messaging-integration phase.</p><button type="submit">Send enquiry</button></form></section><SiteFooter /></main>;
}
