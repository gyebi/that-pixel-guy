import Link from "next/link";
import Image from "next/image";
import { business } from "@/lib/site-content";
import { AdminLogoutButton } from "./admin-logout-button";

const navigation = [["Overview", "/admin"], ["Website", "/admin/site"], ["Portfolio", "/admin/portfolio"], ["Journal", "/admin/journal"], ["Clients", "/admin/clients"], ["Galleries", "/admin/galleries"], ["Products", "/admin/products"], ["Orders", "/admin/orders"], ["Settings", "/admin/settings"]] as const;
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
      <nav aria-label="Admin navigation">{navigation.map(([label, href]) =>
        <Link href={href} key={href}>{label}</Link>)}</nav>
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