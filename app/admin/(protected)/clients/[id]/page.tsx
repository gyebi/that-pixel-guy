import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin-shell";
import { clientRepository } from "@/lib/repositories/client-repository";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ClientDetailPage({ params }: Props) {
  const { id } = await params;

  const client = await clientRepository.getById(id);

  if (!client) {
    notFound();
  }

  const shoot = client.shoots[0];
  const gallery = shoot?.galleries[0];

  return (
    <>
      <AdminPageHeader
        eyebrow="Client profile"
        title={client.name}
      />

      <div
        style={{
          marginBottom: "24px",
          display: "flex",
          gap: "12px",
        }}
      >
        <Link
          className="admin-button"
          href={`/admin/clients/${client.id}/shoots/new`}
        >
          + Add shoot
        </Link>

        {shoot ? (
          <Link
            className="admin-button"
            href={`/admin/shoots/${shoot.id}/galleries/new`}
          >
            + Create gallery
          </Link>
        ) : null}
      </div>

      <section className="client-detail">
        <div
          className="client-detail__cover"
          style={
            client.image
              ? { backgroundImage: `url(${client.image})` }
              : undefined
          }
        />

        <div>
          <p className="admin-eyebrow">
            {shoot?.name ?? "No shoot"}
          </p>

          <h2>{gallery?.name ?? "No gallery yet"}</h2>

          <dl>
            <div>
              <dt>Email</dt>
              <dd>{client.email}</dd>
            </div>

            <div>
              <dt>Shoot date</dt>
              <dd>
                {shoot
                  ? shoot.date.toLocaleDateString()
                  : "Not scheduled"}
              </dd>
            </div>

            <div>
              <dt>Gallery access</dt>
              <dd>
                {gallery
                  ? `${gallery.status}${gallery.expiresOn
                    ? ` · expires ${gallery.expiresOn.toLocaleDateString()}`
                    : ""
                  }`
                  : "Not available"}
              </dd>
            </div>
          </dl>

          {gallery ? (
            <Link
              className="admin-button"
              href={`/admin/galleries/${gallery.id}`}
            >
              Open gallery
            </Link>
          ) : null}
        </div>
      </section>
    </>
  );
}