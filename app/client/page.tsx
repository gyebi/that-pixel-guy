import Link from "next/link";
import { requireDemoClient } from "@/lib/demo-auth";
import { demoRepository } from "@/lib/demo-repository";

export const metadata = { title: "Your galleries" };

export default async function ClientPage() {
  const client = await requireDemoClient();
  const [gallery] = await demoRepository.getGalleriesForClient(client.id);
  if (!gallery) return <section className="client-empty"><p>Your gallery is being prepared.</p></section>;
  const photos = await demoRepository.getPhotosForGallery(gallery.id);
  const coverPhoto = photos.find((photo) => photo.id === gallery.coverPhotoId) ?? photos[0];
  return <section className="client-home"><p className="client-kicker">Welcome back, {client.name.split(" ")[0]}</p><h1>Your story,<br />kept close.</h1><p className="client-intro">Your private gallery is ready to explore.</p><Link className="client-gallery-card" href={`/client/galleries/${gallery.id}`} style={{ backgroundImage: `linear-gradient(rgba(22, 27, 23, .13), rgba(22, 27, 23, .55)), url(${coverPhoto?.imagePath ?? client.image})` }}><span>{photos.length} photographs</span><strong>{gallery.name}</strong><em>Open gallery →</em></Link></section>;
}
