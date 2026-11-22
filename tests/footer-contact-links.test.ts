import assert from "node:assert/strict";
import test from "node:test";
import { getFooterContactLinks } from "@/lib/footer-contact-links";
import type { PublicSiteSettings } from "@/lib/site-settings/site-settings-types";

const settings: PublicSiteSettings = {
  businessName: "That Pixel Guy",
  publicEmail: "Hello@Example.com",
  phoneNumber: "+233 24 000 0000",
  whatsAppNumber: "+233 24 000 0000",
  location: "Accra, Ghana",
  instagramUrl: null,
  facebookUrl: null,
  pinterestUrl: null,
  tikTokUrl: null,
  youTubeUrl: null,
};

test("footer contact links render only valid configured destinations", () => {
  assert.deepEqual(getFooterContactLinks(settings), {
    location: "Accra, Ghana",
    email: { label: "hello@example.com", href: "mailto:hello@example.com" },
    phone: { label: "+233 24 000 0000", href: "tel:+233240000000" },
    whatsApp: { label: "WhatsApp", href: "https://wa.me/233240000000" },
  });
  assert.deepEqual(getFooterContactLinks({ ...settings, publicEmail: "not-an-email", phoneNumber: "phone", whatsAppNumber: "123", location: null }), {
    location: null,
    email: null,
    phone: null,
    whatsApp: null,
  });
});
