export const business = {
  name: "That Pixel Guy",
  shortName: "TPG",
  logos: {
    mark: "/brand/that-pixel-guy-logo-only.png",
    enlargedMark: "/brand/that-pixel-guy-logo-enlarged.png",
    full: "/brand/that-pixel-guy-full-logo.png",
  },
};

export const siteSettingsFallback = {
  businessName: business.name,
  publicEmail: "",
  phoneNumber: null,
  whatsAppNumber: null,
  location: null,
  instagramUrl: null,
  facebookUrl: null,
  pinterestUrl: null,
  tikTokUrl: null,
  youTubeUrl: null,
};

export const homepageContentFallback = {
  heroEyebrow: "Accra · Ghana · Available worldwide",
  heroHeading: "Photographs with\na pulse.",
  heroIntro: "Honest, artful photography for the occasions and people you never want to forget.",
  heroCtaLabel: "Begin your story",
  introEyebrow: "The Pixel Guy approach",
  introHeading: "Where feeling\nbecomes form.",
  introBody: "The best photographs don't ask you to perform. They make room for you to be there—fully, beautifully, and without hurry.",
  introCtaLabel: "Meet the Pixel Guy",
  workEyebrow: "Selected work",
  workHeading: "Stories worth returning to.",
  workCtaLabel: "View all work",
  servicesEyebrow: "For the remarkable days",
  servicesHeading: "Be in the moment.\nI'll hold onto it.",
  servicesBody: "From joyful gatherings to quiet milestones, every session is considered with care and made to feel unmistakably yours.",
  contactEyebrow: "Let's make something beautiful",
  contactHeading: "Tell me what\nyou're dreaming of.",
  contactCtaLabel: "Start a conversation",
};

export const homepageImageFallback = {
  hero: { url: "/images/celebration-hero.jpg", alt: "Couple celebrating outdoors" },
  workWedding: { url: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85", alt: "Newlywed couple embracing outdoors" },
  workPortrait: { url: "/images/portrait-celebration.jpg", alt: "Portrait celebration" },
  workFamily: { url: "/images/family-moment.jpg", alt: "Family sharing a moment together" },
  service: { url: "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=1200&q=85", alt: "Bride holding a bouquet on her wedding day" },
  contact: { url: "/images/celebration-contact.jpg", alt: "Couple celebrating together" },
} as const;

export const portfolioCategories = [
  { name: "Weddings", image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85", className: "portfolio-card--tall" },
  { name: "Portraits", image: "/images/portrait-celebration.jpg", className: "portfolio-card--short" },
  { name: "Families", image: "/images/family-moment.jpg", className: "portfolio-card--tall portfolio-card--offset" },
];
