import Link from "next/link";
import { Arrow, SiteFooter, SiteHeader } from "@/components/site-chrome";

export const metadata = { title: "Services" };

const services = [["01", "Weddings", "A faithful record of the whole beautiful, fast-moving day—from the getting-ready quiet to the final dance."], ["02", "Portraits", "Thoughtful portraits for the season you are in, without stiff poses or a sense of rush."], ["03", "Families", "The energy, ease, and particular love of your people, photographed honestly."]];

export default function ServicesPage() {
  return <main><SiteHeader /><section className="page-intro content-width"><p className="eyebrow">Photography services</p><h1>For the days<br />that stay.</h1><p>A relaxed, intentional process from first conversation to the photographs you will keep returning to.</p></section><section className="services-page content-width">{services.map(([number, name, description]) => <article key={name}><p className="eyebrow">{number}</p><h2>{name}</h2><p>{description}</p><Link href="/contact" className="text-link">Enquire now <Arrow /></Link></article>)}</section><section className="service-banner"><div className="content-width"><p className="eyebrow light-eyebrow">Your experience</p><h2>Easy direction.<br />Nothing forced.</h2></div></section><SiteFooter /></main>;
}
