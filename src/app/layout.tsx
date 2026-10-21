import type { Metadata, Viewport } from "next";
import { archivo, archivoItalic, martianMono } from "./fonts";
import { site } from "@/content/site";
import { color, tokensToCss } from "@/styles/tokens";
import { motionPreferenceScript } from "@/lib/motion-preference";
import { Hud } from "@/components/hud/Hud";
import { SiteFooter } from "@/components/SiteFooter";
import "./globals.css";

const isPreview = process.env.NEXT_PUBLIC_PREVIEW === "1";

export const metadata: Metadata = {
  title: site.title,
  description: site.description,
  // Preview deployments (GitHub Pages) must never be indexed; production must.
  robots: isPreview ? { index: false, follow: false } : undefined,
};

export const viewport: Viewport = {
  themeColor: color.ground,
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={site.lang} className={`${archivo.variable} ${archivoItalic.variable} ${martianMono.variable}`} suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: tokensToCss() }} />
        <script dangerouslySetInnerHTML={{ __html: motionPreferenceScript }} />
      </head>
      <body>
        <a className="skip-link" href="#main">
          {site.skipLink}
        </a>
        <Hud />
        <div className="page">
          {children}
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
