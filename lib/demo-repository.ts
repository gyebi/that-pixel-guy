import type { Client, DemoActivity, DemoOrder, DemoSiteContent, Gallery, GalleryPhoto, Photo, Shoot } from "@/lib/domain";

const clients: Client[] = [
  { id: "ama-kwame", name: "Ama & Kwame Ofori", initials: "AK", email: "ama@example.test", image: "/images/celebration-hero.jpg", status: "Active" },
  { id: "mensah-family", name: "The Mensah Family", initials: "TM", email: "mensah@example.test", image: "/images/family-moment.jpg", status: "Active" },
];

const shoots: Shoot[] = [
  { id: "ofori-traditional-wedding", clientId: "ama-kwame", name: "Traditional wedding", date: "May 18, 2026" },
  { id: "mensah-family-portrait", clientId: "mensah-family", name: "Family portrait", date: "June 03, 2026" },
];

const photos: Photo[] = [
  { id: "ofori-hero", shootId: "ofori-traditional-wedding", originalFilename: "celebration-hero.jpg", imagePath: "/images/celebration-hero.jpg", width: 2400, height: 1600, altText: "A joyful wedding celebration", sortOrder: 1, status: "Visible" },
  { id: "ofori-story", shootId: "ofori-traditional-wedding", originalFilename: "celebration-story.jpg", imagePath: "/images/celebration-story.jpg", width: 1200, height: 1800, altText: "A quiet wedding moment", sortOrder: 2, status: "Visible" },
  { id: "ofori-portrait", shootId: "ofori-traditional-wedding", originalFilename: "portrait-celebration.jpg", imagePath: "/images/portrait-celebration.jpg", width: 1200, height: 1800, altText: "A wedding portrait", sortOrder: 3, status: "Visible" },
  { id: "ofori-style", shootId: "ofori-traditional-wedding", originalFilename: "style-guide-portrait.jpg", imagePath: "/images/style-guide-portrait.jpg", width: 1341, height: 1800, altText: "A formal celebration portrait", sortOrder: 4, status: "Visible" },
  { id: "mensah-family-moment", shootId: "mensah-family-portrait", originalFilename: "family-moment.jpg", imagePath: "/images/family-moment.jpg", width: 1200, height: 1800, altText: "A family together at home", sortOrder: 1, status: "Visible" },
  { id: "mensah-contact", shootId: "mensah-family-portrait", originalFilename: "celebration-contact.jpg", imagePath: "/images/celebration-contact.jpg", width: 2200, height: 2131, altText: "A warm family celebration", sortOrder: 2, status: "Visible" },
];

const galleries: Gallery[] = [
  { id: "ofori-wedding", shootId: "ofori-traditional-wedding", name: "Ama & Kwame — The Wedding", coverPhotoId: "ofori-hero", expiresOn: "September 30, 2026", downloadsEnabled: true, status: "Active" },
  { id: "mensah-family-2026", shootId: "mensah-family-portrait", name: "The Mensahs at Home", coverPhotoId: "mensah-family-moment", expiresOn: "October 12, 2026", downloadsEnabled: false, status: "Active" },
];

const galleryPhotos: GalleryPhoto[] = [
  { id: "ofori-wedding-01", galleryId: "ofori-wedding", photoId: "ofori-hero", position: 1 },
  { id: "ofori-wedding-02", galleryId: "ofori-wedding", photoId: "ofori-story", position: 2 },
  { id: "ofori-wedding-03", galleryId: "ofori-wedding", photoId: "ofori-portrait", position: 3 },
  { id: "ofori-wedding-04", galleryId: "ofori-wedding", photoId: "ofori-style", position: 4 },
  { id: "mensah-family-01", galleryId: "mensah-family-2026", photoId: "mensah-family-moment", position: 1 },
  { id: "mensah-family-02", galleryId: "mensah-family-2026", photoId: "mensah-contact", position: 2 },
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

export interface DemoRepository {
  getClients(): Promise<Client[]>; getClient(id: string): Promise<Client | undefined>;
  getShoots(): Promise<Shoot[]>; getShoot(id: string): Promise<Shoot | undefined>; getShootsForClient(clientId: string): Promise<Shoot[]>;
  getPhotosForShoot(shootId: string): Promise<Photo[]>;
  getGalleries(): Promise<Gallery[]>; getGallery(id: string): Promise<Gallery | undefined>; getGalleriesForShoot(shootId: string): Promise<Gallery[]>; getGalleriesForClient(clientId: string): Promise<Gallery[]>;
  getGalleryPhotosForGallery(galleryId: string): Promise<GalleryPhoto[]>; getPhotosForGallery(galleryId: string): Promise<Photo[]>;
  getOrders(): Promise<DemoOrder[]>; getActivity(): Promise<DemoActivity[]>; getSiteContent(): Promise<DemoSiteContent>;
}

export const demoRepository: DemoRepository = {
  async getClients() { return clients; },
  async getClient(id) { return clients.find((client) => client.id === id); },
  async getShoots() { return shoots; },
  async getShoot(id) { return shoots.find((shoot) => shoot.id === id); },
  async getShootsForClient(clientId) { return shoots.filter((shoot) => shoot.clientId === clientId); },
  async getPhotosForShoot(shootId) { return photos.filter((photo) => photo.shootId === shootId).sort((a, b) => a.sortOrder - b.sortOrder); },
  async getGalleries() { return galleries; },
  async getGallery(id) { return galleries.find((gallery) => gallery.id === id); },
  async getGalleriesForShoot(shootId) { return galleries.filter((gallery) => gallery.shootId === shootId); },
  async getGalleriesForClient(clientId) {
    const clientShootIds = new Set(shoots.filter((shoot) => shoot.clientId === clientId).map((shoot) => shoot.id));
    return galleries.filter((gallery) => clientShootIds.has(gallery.shootId));
  },
  async getGalleryPhotosForGallery(galleryId) { return galleryPhotos.filter((galleryPhoto) => galleryPhoto.galleryId === galleryId).sort((a, b) => a.position - b.position); },
  async getPhotosForGallery(galleryId) {
    const gallery = galleries.find((item) => item.id === galleryId);
    if (!gallery) return [];
    const memberships = galleryPhotos.filter((galleryPhoto) => galleryPhoto.galleryId === galleryId).sort((a, b) => a.position - b.position);
    return memberships.flatMap((membership) => {
      const photo = photos.find((item) => item.id === membership.photoId && item.shootId === gallery.shootId && item.status === "Visible");
      return photo ? [photo] : [];
    });
  },
  async getOrders() { return orders; },
  async getActivity() { return activities; },
  async getSiteContent() { return siteContent; },
};
