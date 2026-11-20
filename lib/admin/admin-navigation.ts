export const adminNavigationItems = [
  { label: "Overview", href: "/admin" },
  { label: "Website", href: "/admin/site" },
  { label: "Clients", href: "/admin/clients" },
  { label: "Galleries", href: "/admin/galleries" },
] as const;

export function isAdminNavigationActive(pathname: string, href: string) {
  return href === "/admin"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}
