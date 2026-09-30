import Link from "next/link";
import { AdminPageHeader } from "@/components/admin-shell";
import { demoRepository } from "@/lib/demo-repository";

export const metadata = { title: "Clients" };

export default async function AdminClientsPage() { const clients = await demoRepository.getClients(); return <><AdminPageHeader eyebrow="Clients" title="Your people" action={<button className="admin-button">+ New client</button>} /><section className="client-table admin-panel"><div className="client-table__heading"><span>Client</span><span>Shoot</span><span>Gallery</span><span>Status</span></div>{clients.map((client) => <Link href={`/admin/clients/${client.id}`} className="client-row" key={client.id}><span className="client-person"><i style={{ backgroundImage: `url(${client.image})` }} /><b>{client.name}</b><small>{client.email}</small></span><span>{client.shoot}<small>{client.shootDate}</small></span><span>{client.galleryName}<small>Private gallery</small></span><em>{client.status}</em></Link>)}</section></>;
}
