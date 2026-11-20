import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin-shell";
import { createAdminClientGalleryView } from "@/lib/galleries/admin-client-gallery-view";
import { clientRepository } from "@/lib/repositories/client-repository";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ClientDetailPage({ params }: Props) {
  const { id } = await params;
  const client = await clientRepository.getById(id);

  if (!client) notFound();

  const shoots = createAdminClientGalleryView(client.shoots);
  const galleryCount = shoots.reduce(
    (count, shoot) => count + shoot.galleries.length,
    0,
  );

  return (
    <>
      <AdminPageHeader eyebrow="Client profile" title={client.name} />

      <div className="admin-client-actions">
        <Link className="admin-button" href={`/admin/clients/${client.id}/shoots/new`}>
          + Add shoot
        </Link>
      </div>

      <section className="client-detail admin-client-profile">
        <div
          className="client-detail__cover"
          style={client.image ? { backgroundImage: `url(${client.image})` } : undefined}
        />

        <div>
          <p className="admin-eyebrow">Gallery overview</p>
          <h2>{galleryCount} {galleryCount === 1 ? "gallery" : "galleries"}</h2>
          <dl>
            <div>
              <dt>Email</dt>
              <dd>{client.email}</dd>
            </div>
            <div>
              <dt>Shoots</dt>
              <dd>{shoots.length}</dd>
            </div>
            <div>
              <dt>Administration</dt>
              <dd>Expired and archived galleries remain visible here.</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="admin-client-shoots" aria-labelledby="client-shoots-heading">
        <div className="admin-client-shoots__heading">
          <p className="admin-eyebrow">Shoots and galleries</p>
          <h2 id="client-shoots-heading">All client work</h2>
        </div>

        {shoots.length ? (
          <div className="admin-client-shoots__list">
            {shoots.map((shoot) => (
              <article className="admin-client-shoot" key={shoot.id}>
                <header>
                  <div>
                    <p className="admin-eyebrow">{shoot.date.toLocaleDateString()}</p>
                    <h3>{shoot.name}</h3>
                  </div>
                  <Link className="admin-button" href={`/admin/shoots/${shoot.id}/galleries/new`}>
                    + Create gallery
                  </Link>
                </header>

                {shoot.galleries.length ? (
                  <ul className="admin-client-galleries">
                    {shoot.galleries.map((gallery) => (
                      <li key={gallery.id}>
                        <Link href={`/admin/galleries/${gallery.id}`}>
                          <span>
                            <b>{gallery.name}</b>
                            <small>
                              {gallery._count.photos} {gallery._count.photos === 1 ? "photograph" : "photographs"}
                              {gallery.expiresOn
                                ? ` · expires ${gallery.expiresOn.toLocaleDateString()}`
                                : " · no expiration"}
                            </small>
                          </span>
                          <span className="admin-client-galleries__state">
                            <em data-state={gallery.status.toLowerCase()}>{gallery.status}</em>
                            {gallery.isExpired ? <em data-state="expired">Expired</em> : null}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="admin-client-shoot__empty">No galleries have been created for this shoot.</p>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p className="admin-client-shoots__empty">This client does not have any shoots yet.</p>
        )}
      </section>
    </>
  );
}
