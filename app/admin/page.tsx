import Link from "next/link";
import { AdminPageHeader } from "@/components/admin-shell";
import { demoRepository } from "@/lib/demo-repository";

export const metadata = { title: "Admin" };

export default async function AdminPage() {
  const [clients, orders, activity] = await Promise.all([demoRepository.getClients(), demoRepository.getOrders(), demoRepository.getActivity()]);
  return <><AdminPageHeader eyebrow="Tuesday, June 16" title="Good morning." action={<Link href="/admin/clients" className="admin-button">+ New client</Link>} /><section className="admin-stat-grid"><Stat label="Active clients" value={String(clients.length)} detail="2 galleries live" /><Stat label="New requests" value="3" detail="Since yesterday" /><Stat label="Order value" value="GH₵ 4,250" detail="2 open requests" /></section><section className="admin-two-column"><div className="admin-panel"><div className="admin-panel__title"><div><p className="admin-eyebrow">Recent activity</p><h2>What&apos;s happening</h2></div><Link href="/admin/orders">View all</Link></div><div className="activity-list">{activity.map((item) => <article key={item.id}><span className={`activity-mark activity-mark--${item.type}`} /><div><h3>{item.title}</h3><p>{item.detail}</p></div><time>{item.occurredAt}</time></article>)}</div></div><div className="admin-panel"><div className="admin-panel__title"><div><p className="admin-eyebrow">Open orders</p><h2>Awaiting your eye</h2></div><Link href="/admin/orders">View all</Link></div><div className="order-list">{orders.map((order) => <article key={order.id}><div><span className="order-kind">{order.kind}</span><h3>{order.clientName}</h3><p>{order.summary}</p></div><div><strong>{order.amount}</strong><em>{order.status}</em></div></article>)}</div></div></section></>;
}

function Stat({ label, value, detail }: { label: string; value: string; detail: string }) { return <article className="admin-stat"><p>{label}</p><strong>{value}</strong><span>{detail}</span></article>; }
