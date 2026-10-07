import Link from "next/link";
import { AdminPageHeader } from "@/components/admin-shell";
import { clientRepository } from "@/lib/repositories/client-repository";

export const metadata = { title: "Clients" };

export default async function AdminClientsPage() {
  const clients = await clientRepository.getAll();

  return (
    <>
      <AdminPageHeader
        eyebrow="Clients"
        title="Your people"
        action={<button className="admin-button">+ New client</button>}
      />

      <section className="client-table admin-panel">
        <div className="client-table__heading">
          <span>Client</span>
          <span>Shoot</span>
          <span>Gallery</span>
          <span>Status</span>
        </div>

        {clients.map((client) => {
          const shoot = client.shoots[0];
          const gallery = shoot?.galleries[0];

          return (
            <Link
              href={`/admin/clients/${client.id}`}
              className="client-row"
              key={client.id}
            >
              <span className="client-person">
                <i
                  style={
                    client.image
                      ? { backgroundImage: `url(${client.image})` }
                      : undefined
                  }
                />
                <b>{client.name}</b>
                <small>{client.email}</small>
              </span>

              <span>
                {shoot?.name ?? "No shoot"}
                <small>
                  {shoot
                    ? shoot.date.toLocaleDateString()
                    : "Not scheduled"}
                </small>
              </span>

              <span>
                {gallery?.name ?? "No gallery"}
                <small>{gallery ? "Private gallery" : ""}</small>
              </span>

              <em>{client.status}</em>
            </Link>
          );
        })}
      </section>
    </>
  );
}