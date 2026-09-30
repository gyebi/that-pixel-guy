import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin-shell";
import { demoRepository } from "@/lib/demo-repository";

const labels: Record<string, string> = { portfolio: "Portfolio", journal: "Journal", galleries: "Galleries", products: "Products", orders: "Orders", settings: "Settings" };
type Props = { params: Promise<{ section: string }> };

export default async function AdminSectionPage({ params }: Props) { const { section } = await params; const label = labels[section]; if (!label) notFound(); const [galleries, orders] = await Promise.all([demoRepository.getGalleries(), demoRepository.getOrders()]); const count = section === "galleries" ? galleries.length : section === "orders" ? orders.length : undefined; return <><AdminPageHeader eyebrow="That Pixel Guy Admin" title={label} action={<button className="admin-button">+ Add {label.slice(0, -1)}</button>} /><section className="admin-empty"><p className="admin-eyebrow">Demo workspace</p><h2>{count ? `${count} demo ${label.toLowerCase()} ready.` : `Your ${label.toLowerCase()} workspace is ready.`}</h2><p>This area has a stable route and service boundary. Its full editor and workflows follow the current Admin foundation milestone.</p></section></>; }
