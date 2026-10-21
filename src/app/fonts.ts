import { Archivo, Martian_Mono } from "next/font/google";

// Variable fonts, self-hosted by next/font at build time (latin subset only).
export const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
  variable: "--font-archivo",
});

// Italic is only used in card rules text, so it is not preloaded (saves ~100 KB on first paint).
export const archivoItalic = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  style: "italic",
  display: "swap",
  preload: false,
  variable: "--font-archivo-italic",
});

export const martianMono = Martian_Mono({
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
  variable: "--font-martian",
});
