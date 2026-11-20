export const business = {
  name: "That Pixel Guy",
  shortName: "TPG",
  location: "Accra, Ghana",
  email: "hello@thatpixelguy.com",
  phone: "+233 24 000 0000",
  instagram: "@thatpixelguy",
  logos: {
    mark: "/brand/that-pixel-guy-logo-only.png",
    enlargedMark: "/brand/that-pixel-guy-logo-enlarged.png",
    full: "/brand/that-pixel-guy-full-logo.png",
  },
};

export const siteSettingsFallback = {
  businessName: business.name,
  publicEmail: business.email,
  phoneNumber: business.phone,
  whatsAppNumber: business.phone,
  location: business.location,
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

export const portfolioCategories = [
  { name: "Weddings", count: "38 stories", image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=85", className: "portfolio-card--tall" },
  { name: "Portraits", count: "24 stories", image: "/images/portrait-celebration.jpg", className: "portfolio-card--short" },
  { name: "Families", count: "16 stories", image: "/images/family-moment.jpg", className: "portfolio-card--tall portfolio-card--offset" },
];

export const journalPosts = [
  { category: "Weddings", title: "A sun-lit celebration by the coast", date: "June 12, 2026", image: "/images/celebration-story.jpg" },
  { category: "Guides", title: "What to wear for an effortlessly beautiful portrait session", date: "May 28, 2026", image: "/images/style-guide-portrait.jpg" },
];

export const testimonials = [
  { quote: "That Pixel Guy saw every small moment we would have missed. The photographs feel exactly like our day—warm, full of life, and entirely ours.", name: "Ama & Kwame", occasion: "Wedding, Accra" },
  { quote: "We arrived nervous and left feeling completely ourselves. Our family photographs are now the ones everyone asks about.", name: "The Mensahs", occasion: "Family portrait session" },
];
