import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin-shell";
import { demoRepository } from "@/lib/demo-repository";

type Props = { params: Promise<{ id: string }> };

export default async function ClientDetailPage({ params }: Props) { const client = await demoRepository.getClient((await params).id); if (!client) notFound(); return <><AdminPageHeader eyebrow="Client profile" title={client.name} /><section className="client-detail"><div className="client-detail__cover" style={{ backgroundImage: `url(${client.image})` }} /><div><p className="admin-eyebrow">{client.shoot}</p><h2>{client.galleryName}</h2><dl><div><dt>Email</dt><dd>{client.email}</dd></div><div><dt>Shoot date</dt><dd>{client.shootDate}</dd></div><div><dt>Gallery access</dt><dd>Active · expires September 30</dd></div></dl><Link className="admin-button" href={`/admin/galleries/${client.galleryId}`}>Open gallery</Link></div></section></>; }
