/*
 * Deep links (?c=…): the page is a static export, so the server renders the
 * overview. This script runs before that markup paints and marks the root;
 * lab.css keeps the overview hidden until the client has rendered the detail
 * view and removes the mark (ui/logo-lab.tsx). Shared by the server page and
 * the client, so it lives outside the 'use client' modules.
 */
export const DEEP_LINK_ATTR = 'data-lab-deep-link'
export const DEEP_LINK_SCRIPT = `/[?&]c=/.test(location.search)&&document.documentElement.setAttribute('${DEEP_LINK_ATTR}','')`
