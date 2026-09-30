import Link from "next/link";
import { requireDemoClient } from "@/lib/demo-auth";
import { demoRepository } from "@/lib/demo-repository";

export default async function ClientGalleriesPage() { const client = await requireDemoClient(); const gallery = (await demoRepository.getGalleries()).find((item) => item.id === client.galleryId); return <section className="client-gallery-list"><p className="client-kicker">Private galleries</p><h1>Your gallery</h1>{gallery ? <Link className="client-gallery-card" href={`/client/galleries/${gallery.id}`} style={{ backgroundImage: `linear-gradient(rgba(22, 27, 23, .13), rgba(22, 27, 23, .55)), url(${gallery.coverImage})` }}><span>{gallery.photoCount} photographs</span><strong>{gallery.name}</strong><em>Open gallery →</em></Link> : <p className="client-empty">No accessible gallery was found.</p>}</section>; }
