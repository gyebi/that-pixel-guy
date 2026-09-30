import Link from "next/link";
import { requireDemoClient } from "@/lib/demo-auth";
import { demoRepository } from "@/lib/demo-repository";

export const metadata = { title: "Your galleries" };

export default async function ClientPage() {
  const client = await requireDemoClient();
  const gallery = (await demoRepository.getGalleries()).find((item) => item.id === client.galleryId);
  if (!gallery) return <section className="client-empty"><p>Your gallery is being prepared.</p></section>;
  return <section className="client-home"><p className="client-kicker">Welcome back, {client.name.split(" ")[0]}</p><h1>Your story,<br />kept close.</h1><p className="client-intro">Your private gallery is ready to explore. Select favourites, leave a retouch note, and prepare photographs for your album or frame order.</p><Link className="client-gallery-card" href={`/client/galleries/${gallery.id}`} style={{ backgroundImage: `linear-gradient(rgba(22, 27, 23, .13), rgba(22, 27, 23, .55)), url(${gallery.coverImage})` }}><span>{gallery.photoCount} photographs</span><strong>{gallery.name}</strong><em>Open gallery →</em></Link></section>;
}
