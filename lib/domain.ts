export type OrderStatus = "Draft" | "Submitted" | "Reviewing" | "Approved" | "In production" | "Ready" | "Completed";

export type DemoClient = { id: string; name: string; initials: string; email: string; shoot: string; shootDate: string; galleryId: string; galleryName: string; image: string; status: "Active" | "Invited" };
export type DemoGallery = { id: string; clientId: string; name: string; coverImage: string; photoCount: number; expiresOn: string; downloadsEnabled: boolean };
export type DemoOrder = { id: string; clientName: string; kind: "Frame" | "Album"; summary: string; status: OrderStatus; createdAt: string; amount: string };
export type DemoActivity = { id: string; title: string; detail: string; occurredAt: string; type: "favorite" | "retouch" | "order" | "album" };
export type DemoSiteContent = { heroHeading: string; heroSubheading: string; primaryCta: string; contactEmail: string; whatsappNumber: string; aboutText: string };
