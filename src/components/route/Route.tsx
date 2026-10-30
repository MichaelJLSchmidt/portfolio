"use client";

import dynamic from "next/dynamic";

/**
 * The page's red route, loaded after hydration: it is decorative, draws nothing until it has
 * measured the page, and has no server markup to match, so it stays out of the initial bundle.
 * Its first child position in <main> is kept (RouteLayer.tsx).
 */
export const Route = dynamic(() => import("./RouteLayer").then((m) => m.RouteLayer), { ssr: false });
