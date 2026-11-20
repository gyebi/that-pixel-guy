import Link from "next/link";
import Image from "next/image";
import { business } from "@/lib/site-content";
import { AdminLogoutButton } from "./admin-logout-button";
import { AdminNavigation } from "./admin-navigation";

type AdminPageHeaderProps = {
  eyebrow: string;
  title: string;
  action?: React.ReactNode;
};

export function AdminPageHeader({
  eyebrow,
  title,
  action,
}: AdminPageHeaderProps) {
  return (
    <header className="admin-page-header">
      <div>
        <p className="admin-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
      </div>

      {action && (
        <div className="admin-page-header__action">
          {action}
        </div>
      )}
    </header>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  return <div className="admin-layout">
    <aside className="admin-sidebar">
      <Link href="/admin" className="admin-brand">
        <Image src={business.logos.mark} alt="" width={696} height={736} />
        <span>Studio</span>
      </Link>
      <p className="admin-user"><b>TPG</b><span>{business.name}<br />
        <small>Photographer</small></span></p>
      <AdminNavigation />
      <div className="admin-sidebar-footer">
        <Link className="admin-view-site" href="/">
          ↗ View website
        </Link>
        <AdminLogoutButton />
      </div>
    </aside>
    <section className="admin-main">{children}
    </section>
  </div>;
}
