import Link from "next/link";
import { requireDemoClient } from "@/lib/demo-auth";
import { demoRepository } from "@/lib/demo-repository";

export default async function ClientGalleriesPage() {
  const client = await requireDemoClient();
  const galleries = await demoRepository.getGalleriesForClient(client.id);
  const galleryCards = await Promise.all(galleries.map(async (gallery) => {
    const photos = await demoRepository.getPhotosForGallery(gallery.id);
    return { gallery, photoCount: photos.length, coverPhoto: photos.find((photo) => photo.id === gallery.coverPhotoId) ?? photos[0] };
  }));
  return
  <section className="client-gallery-list">
    <p className="client-kicker">Private galleries</p>
    <h1>Your galleries</h1>
    {galleryCards.length ? galleryCards.map(({ gallery, photoCount, coverPhoto }) =>
      <Link className="client-gallery-card" href={`/client/galleries/${gallery.id}`}
        key={gallery.id}
        style={{ backgroundImage: `linear-gradient(rgba(22, 27, 23, .13), rgba(22, 27, 23, .55)), url(${coverPhoto?.imagePath ?? client.image})` }}>
        <span>{photoCount} photographs</span>
        <strong>{gallery.name}</strong>
        <em>Open gallery →</em>
      </Link>) : <p className="client-empty">No accessible gallery was found.</p>}
  </section>;
}
