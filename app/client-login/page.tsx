import Link from "next/link";
import { DemoClientLoginForm } from "@/components/demo-client-login-form";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { demoRepository } from "@/lib/demo-repository";

export const metadata = { title: "Client Login" };

export default async function ClientLoginPage() {
  const clients = await demoRepository.getClients();
  const clientOptions = await Promise.all(clients.map(async (client) => {
    const [shoot] = await demoRepository.getShootsForClient(client.id);
    return { id: client.id, name: client.name, shoot: shoot?.name ?? "Gallery access" };
  }));
  return <main><SiteHeader /><section className="login-page"><div className="login-card"><p className="eyebrow">Client access</p><h1>Your photographs,<br />all in one place.</h1><p>Use the gallery link and private access details sent by That Pixel Guy to view your images.</p><div className="login-divider" /><DemoClientLoginForm clients={clientOptions} /><Link href="/contact" className="text-link">Need help? Get in touch</Link></div></section><SiteFooter /></main>;
}
