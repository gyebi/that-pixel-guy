import type { DemoActivity, DemoClient, DemoGallery, DemoOrder, DemoSiteContent } from "@/lib/domain";

const clients: DemoClient[] = [
  { id: "ama-kwame", name: "Ama & Kwame Ofori", initials: "AK", email: "ama@example.test", shoot: "Traditional wedding", shootDate: "May 18, 2026", galleryId: "ofori-wedding", galleryName: "Ama & Kwame — The Wedding", image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=700&q=85", status: "Active" },
  { id: "mensah-family", name: "The Mensah Family", initials: "TM", email: "mensah@example.test", shoot: "Family portrait", shootDate: "June 03, 2026", galleryId: "mensah-family-2026", galleryName: "The Mensahs at Home", image: "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=700&q=85", status: "Active" },
];

const galleries: DemoGallery[] = [
  { id: "ofori-wedding", clientId: "ama-kwame", name: "Ama & Kwame — The Wedding", coverImage: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85", photoCount: 86, expiresOn: "September 30, 2026", downloadsEnabled: true },
  { id: "mensah-family-2026", clientId: "mensah-family", name: "The Mensahs at Home", coverImage: "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1200&q=85", photoCount: 42, expiresOn: "October 12, 2026", downloadsEnabled: false },
];

const orders: DemoOrder[] = [
  { id: "ord-105", clientName: "Ama & Kwame Ofori", kind: "Frame", summary: "Walnut · 20 × 30 in · Ivory mat", status: "Submitted", createdAt: "Today, 10:24", amount: "GH₵ 1,850" },
  { id: "ord-104", clientName: "The Mensah Family", kind: "Album", summary: "Linen album · 12 spreads", status: "Reviewing", createdAt: "Yesterday", amount: "GH₵ 2,400" },
];

const activities: DemoActivity[] = [
  { id: "act-1", title: "Frame request submitted", detail: "Ama & Kwame chose a walnut 20 × 30 in frame.", occurredAt: "10 min ago", type: "order" },
  { id: "act-2", title: "New retouch note", detail: "Ama asked for a small edit on photo 038.", occurredAt: "1 hr ago", type: "retouch" },
  { id: "act-3", title: "Album selection updated", detail: "The Mensahs saved 24 photographs to their album.", occurredAt: "Yesterday", type: "album" },
];

const siteContent: DemoSiteContent = { heroHeading: "Photographs with a pulse.", heroSubheading: "Honest, artful photography for the occasions and people you never want to forget.", primaryCta: "Begin your story", contactEmail: "hello@thatpixelguy.com", whatsappNumber: "+233 24 000 0000", aboutText: "The best photographs make room for you to be there—fully, beautifully, and without hurry." };

export interface DemoRepository { getClients(): Promise<DemoClient[]>; getClient(id: string): Promise<DemoClient | undefined>; getGalleries(): Promise<DemoGallery[]>; getOrders(): Promise<DemoOrder[]>; getActivity(): Promise<DemoActivity[]>; getSiteContent(): Promise<DemoSiteContent>; }

export const demoRepository: DemoRepository = {
  async getClients() { return clients; },
  async getClient(id) { return clients.find((client) => client.id === id); },
  async getGalleries() { return galleries; },
  async getOrders() { return orders; },
  async getActivity() { return activities; },
  async getSiteContent() { return siteContent; },
};
