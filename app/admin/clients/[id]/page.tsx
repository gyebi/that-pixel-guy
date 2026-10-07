import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin-shell";
import { demoRepository } from "@/lib/demo-repository";

type Props = { params: Promise<{ id: string }> };

export default async function ClientDetailPage({ params }: Props) {
  const client = await demoRepository.getClient((await params).id);
  if (!client) notFound();
  const [shoot] = await demoRepository.getShootsForClient(client.id);
  const [gallery] = shoot ? await demoRepository.getGalleriesForShoot(shoot.id) : [];
  return <><AdminPageHeader eyebrow="Client profile" title={client.name} /><section className="client-detail"><div className="client-detail__cover" style={{ backgroundImage: `url(${client.image})` }} /><div><p className="admin-eyebrow">{shoot?.name ?? "No shoot"}</p><h2>{gallery?.name ?? "No gallery yet"}</h2><dl><div><dt>Email</dt><dd>{client.email}</dd></div><div><dt>Shoot date</dt><dd>{shoot?.date ?? "Not scheduled"}</dd></div><div><dt>Gallery access</dt><dd>{gallery ? `${gallery.status} · expires ${gallery.expiresOn}` : "Not available"}</dd></div></dl>{gallery ? <Link className="admin-button" href={`/admin/galleries/${gallery.id}`}>Open gallery</Link> : null}</div></section></>;
}
