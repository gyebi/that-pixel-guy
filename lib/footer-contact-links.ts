import type { PublicSiteSettings } from "@/lib/site-settings/site-settings-types";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function telephoneHref(value: string | null) {
  if (!value) return null;
  const normalized = value.trim();
  const digits = normalized.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15 || !/^\+?[0-9][0-9 ()-]*$/.test(normalized)) return null;
  return `tel:${normalized.startsWith("+") ? "+" : ""}${digits}`;
}

function whatsAppHref(value: string | null) {
  if (!value) return null;
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15 ? `https://wa.me/${digits}` : null;
}

export function getFooterContactLinks(settings: PublicSiteSettings) {
  const email = settings.publicEmail.trim().toLowerCase();
  return {
    location: settings.location?.trim() || null,
    email: emailPattern.test(email) ? { label: email, href: `mailto:${email}` } : null,
    phone: settings.phoneNumber && telephoneHref(settings.phoneNumber)
      ? { label: settings.phoneNumber, href: telephoneHref(settings.phoneNumber)! }
      : null,
    whatsApp: settings.whatsAppNumber && whatsAppHref(settings.whatsAppNumber)
      ? { label: "WhatsApp", href: whatsAppHref(settings.whatsAppNumber)! }
      : null,
  };
}
