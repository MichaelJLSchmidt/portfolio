import type { Metadata, Viewport } from "next";
import { archivo, archivoItalic, martianMono } from "./fonts";
import { cardTerrains } from "@/content/cards";
import { site } from "@/content/site";
import { color, gridToCss, tokensToCss } from "@/styles/tokens";
import { motionModeScript } from "@/lib/motion-mode";
import { TerrainBackdrop } from "@/components/terrain/TerrainBackdrop";
import { Header } from "@/components/header/Header";
import { SiteFooter } from "@/components/SiteFooter";
import { SmoothScroll } from "@/components/SmoothScroll";
import { RouteArrival } from "@/components/transition/RouteArrival";
import { Reveals } from "@/components/motion/Reveals";
import "./globals.css";
import "@/styles/motion.css";

const isPreview = process.env.NEXT_PUBLIC_PREVIEW === "1";

/** The cascade layers, lowest first; every stylesheet starts with the same statement. */
const LAYER_ORDER = "@layer reset, tokens, base, layout, components, utilities;";

export const metadata: Metadata = {
  title: { default: site.title, template: site.titleTemplate },
  description: site.description,
  applicationName: site.brand,
  openGraph: { type: "website", siteName: `${site.brand} · ${site.name}`, title: site.title, description: site.description, locale: "en" },
  // Preview builds (branch deploys, Deploy Previews) must never be indexed; production must.
  robots: isPreview ? { index: false, follow: false } : undefined,
};

export const viewport: Viewport = {
  themeColor: color.ground,
  colorScheme: "dark",
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang={site.lang}
      className={`${archivo.variable} ${archivoItalic.variable} ${martianMono.variable}`}
      data-card-terrains={JSON.stringify(cardTerrains())}
      suppressHydrationWarning
    >
      <head>
        {/* The tokens' custom properties, in the tokens layer (globals.css explains the layers). */}
        <style dangerouslySetInnerHTML={{ __html: `${LAYER_ORDER}@layer tokens{${tokensToCss()}${gridToCss()}}` }} />
        <script dangerouslySetInnerHTML={{ __html: motionModeScript }} />
      </head>
      <body>
        <a className="skip-link plain" href="#main">
          {site.skipLink}
        </a>
        <TerrainBackdrop />
        <SmoothScroll />
        <RouteArrival />
        <Reveals />
        <Header />
        <div className="page">
          {children}
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
