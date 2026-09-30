import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "That Pixel Guy | Honest, artful photography",
    template: "%s | That Pixel Guy",
  },
  description:
    "That Pixel Guy documents weddings, portraits, and the people who matter most in Accra and beyond.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
