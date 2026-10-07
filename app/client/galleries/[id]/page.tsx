import { notFound } from "next/navigation";
import Image from "next/image";
import { requireDemoClient } from "@/lib/demo-auth";
import { demoRepository } from "@/lib/demo-repository";

type Props = { params: Promise<{ id: string }> };

export default async function ClientGalleryPage({ params }: Props) {
  const [client, { id }] = await Promise.all([requireDemoClient(), params]);
  const gallery = await demoRepository.getGallery(id);
  if (!gallery) notFound();
  const shoot = await demoRepository.getShoot(gallery.shootId);
  if (!shoot || shoot.clientId !== client.id) return <section className="client-denied"><p className="client-kicker">Private gallery</p><h1>This gallery isn&apos;t yours.</h1><p>For your privacy, you can only view galleries assigned to your current demo session.</p></section>;

  const photos = await demoRepository.getPhotosForGallery(gallery.id);
  return
  <section className="client-gallery">
    <header><p className="client-kicker">Private gallery · {photos.length} photographs</p>
    <h1>{gallery.name}</h1><p>Downloads {gallery.downloadsEnabled ? "are enabled" : "are not available"} for this gallery.</p>
    </header><div className="client-photo-grid">{photos.map((photo) => <figure className="client-photo" key={photo.id}>
      <Image
      src={photo.imagePath}
      alt={photo.altText}
      width={photo.width}
      height={photo.height}
      sizes="(max-width: 720px) 100vw, (max-width: 1050px) 50vw, 33vw" /></figure>)}</div>
      </section>;
}
