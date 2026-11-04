/**
 * The titles the relief fill may draw on (src/components/relief): large bold titles only, never
 * body text, navigation, ordinary links or buttons. Add a title's id here to opt it in.
 */
export const reliefTitles = ["footer-wordmark", "gate-mark"] as const;

export const reliefOn = (id: string) => (reliefTitles as readonly string[]).includes(id);
