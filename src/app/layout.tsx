import type { Metadata, Viewport } from "next";
import { archivo, archivoItalic, martianMono } from "./fonts";
import { site } from "@/content/site";
import { color, tokensToCss } from "@/styles/tokens";
import { motionModeScript } from "@/lib/motion-mode";
import { springsToCss } from "@/styles/motion-css";
import { TerrainBackdrop } from "@/components/terrain/TerrainBackdrop";
import { Hud } from "@/components/hud/Hud";
import { SiteFooter } from "@/components/SiteFooter";
import { SmoothScroll } from "@/components/SmoothScroll";
import { RouteFade } from "@/components/transition/RouteFade";
import { HistoryTransitions } from "@/components/transition/HistoryTransitions";
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
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={site.lang} className={`${archivo.variable} ${archivoItalic.variable} ${martianMono.variable}`} suppressHydrationWarning>
      <head>
        {/* The tokens' custom properties, in the tokens layer (globals.css explains the layers). */}
        <style dangerouslySetInnerHTML={{ __html: `${LAYER_ORDER}@layer tokens{${tokensToCss()}${springsToCss()}}` }} />
        <script dangerouslySetInnerHTML={{ __html: motionModeScript }} />
      </head>
      <body>
        <a className="skip-link" href="#main">
          {site.skipLink}
        </a>
        <TerrainBackdrop />
        <SmoothScroll />
        <HistoryTransitions />
        <RouteFade />
        <RouteArrival />
        <Reveals />
        <Hud />
        <div className="page">
          {children}
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
