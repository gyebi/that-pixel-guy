"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  adminNavigationItems,
  isAdminNavigationActive,
} from "@/lib/admin/admin-navigation";

export function AdminNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin navigation">
      {adminNavigationItems.map(({ label, href }) => {
        const active = isAdminNavigationActive(pathname, href);

        return (
          <Link href={href} key={href} aria-current={active ? "page" : undefined}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
