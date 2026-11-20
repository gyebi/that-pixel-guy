import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin-shell";
import { AdminGalleryPhotoManager } from "@/components/admin-gallery-photo-manager";
import { AdminPhotoUploadForm } from "@/components/admin-photo-upload-form";
import { galleryRepository } from "@/lib/repositories/gallery-repository";
import { photoRepository } from "@/lib/repositories/photo-repository";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminGalleryPage({ params }: Props) {
  const { id } = await params;

  const gallery = await galleryRepository.getById(id);

  if (!gallery) {
    notFound();
  }

  const [photos, shootPhotos] = await Promise.all([
    Promise.resolve(gallery.photos),
    photoRepository.getForShoot(gallery.shootId),
  ]);

  return (
    <>
      <AdminPageHeader
        eyebrow="Private gallery"
        title={gallery.name}
        action={
          <Link className="admin-button" href={`/admin/galleries/${gallery.id}/edit`}>
            Edit gallery
          </Link>
        }
      />

      <section className="client-detail">
        <div className="client-detail__cover" />

        <div>
          <p className="admin-eyebrow">
            {photos.length} {photos.length === 1 ? "photograph" : "photographs"}
          </p>

          <h2>Gallery details</h2>

          <dl>
            <div>
              <dt>Client</dt>
              <dd>{gallery.shoot.client.name}</dd>
            </div>

            <div>
              <dt>Shoot</dt>
              <dd>{gallery.shoot.name}</dd>
            </div>

            <div>
              <dt>Gallery access</dt>
              <dd>
                {gallery.status}
                {gallery.expiresOn
                  ? ` · expires ${gallery.expiresOn.toLocaleDateString()}`
                  : " · no expiration"}
              </dd>
            </div>

            <div>
              <dt>Downloads</dt>
              <dd>
                {gallery.downloadsEnabled ? "Enabled" : "Disabled"}
              </dd>
            </div>

            <div>
              <dt>Client access</dt>
              <dd>Private gallery</dd>
            </div>
          </dl>

          <Link
            className="admin-button"
            href={`/admin/clients/${gallery.shoot.client.id}`}
          >
            Back to client
          </Link>
        </div>
      </section>

      <AdminGalleryPhotoManager
        galleryId={gallery.id}
        photos={shootPhotos.map((photo) => ({
          id: photo.id,
          originalFilename: photo.originalFilename,
          width: photo.width,
          height: photo.height,
          status: photo.status,
        }))}
        memberships={photos.map((galleryPhoto) => ({
          photoId: galleryPhoto.photoId,
          position: galleryPhoto.position,
        }))}
      />

      <section
        className="admin-upload-section"
        aria-labelledby="upload-photographs-heading"
      >
        <div className="admin-upload-section__heading">
          <p className="admin-eyebrow">Upload photographs</p>
          <h2 id="upload-photographs-heading">Add to this shoot</h2>
          <p>
            Uploaded photographs belong to the shoot and are not added to this
            gallery automatically.
          </p>
        </div>

        <AdminPhotoUploadForm shootId={gallery.shootId} />
      </section>
    </>
  );
}
