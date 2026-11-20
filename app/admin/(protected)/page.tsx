import Link from "next/link";
import { AdminPageHeader } from "@/components/admin-shell";
import { dashboardRepository } from "@/lib/repositories/dashboard-repository";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  const overview = await dashboardRepository.getOverview();

  return (
    <>
      <AdminPageHeader
        eyebrow="Studio overview"
        title="Your photography workspace"
        action={<Link href="/admin/clients/new" className="admin-button">+ New client</Link>}
      />

      <section className="admin-stat-grid admin-stat-grid--dashboard" aria-label="Studio totals">
        <Stat label="Clients" value={overview.metrics.clients} />
        <Stat label="Shoots" value={overview.metrics.shoots} />
        <Stat label="Galleries" value={overview.metrics.galleries} />
        <Stat label="Uploaded photos" value={overview.metrics.uploadedPhotos} />
      </section>

      <section className="admin-dashboard-recent admin-panel" aria-labelledby="recent-galleries-heading">
        <div className="admin-panel__title">
          <div>
            <p className="admin-eyebrow">Gallery management</p>
            <h2 id="recent-galleries-heading">Recent galleries</h2>
          </div>
          <Link href="/admin/galleries">View all</Link>
        </div>

        {overview.recentGalleries.length === 0 ? (
          <div className="admin-dashboard-recent__empty">
            <p>No galleries yet. Create a client and shoot to begin a private gallery.</p>
            <Link href="/admin/clients/new" className="admin-button">Create a client</Link>
          </div>
        ) : (
          <ul className="admin-dashboard-recent__list">
            {overview.recentGalleries.map((gallery) => (
              <li key={gallery.id}>
                <Link href={gallery.href} aria-label={`Manage ${gallery.name}`}>
                  <span>
                    <b>{gallery.name}</b>
                    <small>{gallery.shoot.client.name} · {gallery.shoot.name}</small>
                  </span>
                  <span>
                    <small>
                      {gallery._count.photos} {gallery._count.photos === 1 ? "photograph" : "photographs"}
                      {" · "}{gallery.status}
                      {" · created "}{gallery.createdAt.toLocaleDateString()}
                    </small>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <article className="admin-stat"><p>{label}</p><strong>{value}</strong></article>;
}
