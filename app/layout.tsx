import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import { PwaRegister } from "@/components/pwa-register";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { site } from "@/lib/content";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  variable: "--font-sans-body",
  subsets: ["latin"],
  display: "swap",
});

const serif = Fraunces({
  variable: "--font-serif-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${site.name} | ${site.fullName}`,
    template: `%s | ${site.name}`,
  },
  description: site.tagline,
  metadataBase: new URL("https://mansociety.org"),
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#9900ff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${serif.variable} h-full scroll-smooth`}
    >
      <body className="min-h-full flex flex-col antialiased">
        <PwaRegister />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
