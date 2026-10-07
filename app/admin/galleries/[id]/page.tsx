import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin-shell";
import { galleryRepository } from "@/lib/repositories/gallery-repository";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminGalleryPage({ params }: Props) {
  const { id } = await params;

  const gallery = await galleryRepository.getById(id);

  if (!gallery) {
    notFound();
  }

  const photos = gallery.photos;

  return (
    <>
      <AdminPageHeader
        eyebrow="Private gallery"
        title={gallery.name}
        action={
          <button className="admin-button">
            Edit gallery
          </button>
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
    </>
  );
}