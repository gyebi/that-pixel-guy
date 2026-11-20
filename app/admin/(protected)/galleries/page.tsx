import Link from "next/link";
import { AdminPageHeader } from "@/components/admin-shell";
import { galleryRepository } from "@/lib/repositories/gallery-repository";

export const metadata = { title: "Galleries" };

export default async function AdminGalleriesPage() {
  const { galleries, hasMore } = await galleryRepository.getIndex();

  return (
    <>
      <AdminPageHeader eyebrow="Galleries" title="Private galleries" />

      {galleries.length === 0 ? (
        <section className="admin-gallery-index__empty admin-panel">
          <p className="admin-eyebrow">No galleries yet</p>
          <h2>Galleries appear here when they are created from a shoot.</h2>
          <p>Create a client and shoot first, then use the shoot workflow to create a private gallery.</p>
        </section>
      ) : (
        <section className="admin-gallery-index admin-panel" aria-labelledby="gallery-index-heading">
          <div className="admin-gallery-index__heading">
            <div>
              <p className="admin-eyebrow">Gallery management</p>
              <h2 id="gallery-index-heading">Newest galleries</h2>
            </div>
            <p>{galleries.length} shown</p>
          </div>

          <div className="admin-gallery-index__columns" aria-hidden="true">
            <span>Gallery</span><span>Client</span><span>Shoot</span><span>Photographs</span><span>Status</span><span>Expiration</span>
          </div>

          <ul className="admin-gallery-index__list">
            {galleries.map((gallery) => (
              <li key={gallery.id}>
                <Link className="admin-gallery-index__row" href={gallery.href}>
                  <span data-label="Gallery"><b>{gallery.name}</b><small>Created {gallery.createdAt.toLocaleDateString()}</small></span>
                  <span data-label="Client">{gallery.shoot.client.name}</span>
                  <span data-label="Shoot">{gallery.shoot.name}</span>
                  <span data-label="Photographs">{gallery._count.photos} {gallery._count.photos === 1 ? "photo" : "photos"}</span>
                  <span data-label="Status"><em data-status={gallery.status.toLowerCase()}>{gallery.status}</em></span>
                  <span data-label="Expiration">{gallery.expiresOn ? gallery.expiresOn.toLocaleDateString() : "No expiration"}</span>
                </Link>
              </li>
            ))}
          </ul>

          {hasMore ? <p className="admin-gallery-index__notice" role="status">Showing the newest 50 galleries. More galleries exist but are not shown in this list.</p> : null}
        </section>
      )}
    </>
  );
}
