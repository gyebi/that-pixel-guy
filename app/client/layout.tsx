import { DemoClientLogout } from "@/components/demo-client-logout";
import Link from "next/link";
import { requireDemoClient } from "@/lib/demo-auth";

export default async function ClientLayout({ children }: LayoutProps<"/client">) {
  const client = await requireDemoClient();
  return <main className="client-area"><header className="client-header"><Link href="/client" className="client-brand">That Pixel Guy <span>Client gallery</span></Link><div><span>{client.name}</span><DemoClientLogout /></div></header>{children}</main>;
}
