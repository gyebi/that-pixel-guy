import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { getPublicSiteSettings } from "@/lib/repositories/site-settings-repository";

export const metadata = { title: "Contact" };

export default async function ContactPage() {
  const settings = await getPublicSiteSettings();
  return <main><SiteHeader /><section className="contact-page content-width"><div><p className="eyebrow">Get in touch</p><h1>Let&apos;s make<br />something lasting.</h1><p>Tell me a little about what you&apos;re planning and I&apos;ll be in touch with availability and next steps.</p><a href={`mailto:${settings.publicEmail}`} className="text-link">{settings.publicEmail}</a>{settings.phoneNumber ? <a href={`tel:${settings.phoneNumber.replace(/[^+\d]/g, "")}`} className="text-link">{settings.phoneNumber}</a> : null}{settings.whatsAppNumber ? <a href={`https://wa.me/${settings.whatsAppNumber.replace(/\D/g, "")}`} className="text-link">Message on WhatsApp</a> : null}</div><form className="enquiry-form"><label>Your name<input name="name" autoComplete="name" required /></label><label>Email address<input name="email" type="email" autoComplete="email" required /></label><label>What are we celebrating?<select name="occasion" defaultValue=""><option value="" disabled>Select an occasion</option><option>Wedding</option><option>Portrait</option><option>Family session</option><option>Something else</option></select></label><label>Tell me more<textarea name="message" rows={4} required /></label><p>Enquiry form submission will be connected during the messaging-integration phase.</p><button type="submit">Send enquiry</button></form></section><SiteFooter /></main>;
}
