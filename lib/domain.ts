export type OrderStatus = "Draft" | "Submitted" | "Reviewing" | "Approved" | "In production" | "Ready" | "Completed";

/** A person or group commissioning photography. */
export type Client = { id: string; name: string; initials: string; email: string; image: string; status: "Active" | "Invited" };
/** A photographed occasion for one primary client. */
export type Shoot = { id: string; clientId: string; name: string; date: string };
/** Metadata and a current image reference for one photograph, not image bytes. */
export type Photo = { id: string; shootId: string; originalFilename: string; imagePath: string; width: number; height: number; altText: string; sortOrder: number; status: "Visible" | "Hidden" };
/** A curated view of photographs from one shoot. */
export type Gallery = { id: string; shootId: string; name: string; coverPhotoId: string; expiresOn: string; downloadsEnabled: boolean; status: "Active" | "Archived" };
/** Membership and gallery-specific ordering for a Photo in a Gallery. */
export type GalleryPhoto = { id: string; galleryId: string; photoId: string; position: number };

export type DemoOrder = { id: string; clientName: string; kind: "Frame" | "Album"; summary: string; status: OrderStatus; createdAt: string; amount: string };
export type DemoActivity = { id: string; title: string; detail: string; occurredAt: string; type: "favorite" | "retouch" | "order" | "album" };
export type DemoSiteContent = { heroHeading: string; heroSubheading: string; primaryCta: string; contactEmail: string; whatsappNumber: string; aboutText: string };
