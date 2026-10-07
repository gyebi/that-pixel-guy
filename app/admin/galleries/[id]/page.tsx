import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin-shell";
import { demoRepository } from "@/lib/demo-repository";

type Props = { params: Promise<{ id: string }> };

export default async function AdminGalleryPage({ params }: Props) {
  const { id } = await params;
  const gallery = await demoRepository.getGallery(id);
  if (!gallery) notFound();
  const photos = await demoRepository.getPhotosForGallery(gallery.id);
  const coverPhoto = photos.find((photo) => photo.id === gallery.coverPhotoId) ?? photos[0];
  return <><AdminPageHeader eyebrow="Private gallery" title={gallery.name} action={<button className="admin-button">Edit gallery</button>} /><section className="client-detail"><div className="client-detail__cover" style={{ backgroundImage: `url(${coverPhoto?.imagePath})` }} /><div><p className="admin-eyebrow">{photos.length} photographs</p><h2>Gallery details</h2><dl><div><dt>Gallery access</dt><dd>{gallery.status} · expires {gallery.expiresOn}</dd></div><div><dt>Downloads</dt><dd>{gallery.downloadsEnabled ? "Enabled" : "Disabled"}</dd></div><div><dt>Client access</dt><dd>Restricted through the demo authorization layer</dd></div></dl><Link className="admin-button" href="/admin/clients">Back to clients</Link></div></section></>;
}
