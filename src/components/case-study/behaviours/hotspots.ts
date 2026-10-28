/**
 * Annotated hotspots (Figure.tsx renders the markup): numbered marker buttons on the image.
 * Pressing one highlights the matching note in the caption's ordered list (and the marker), and
 * brings the note into view if it is off screen. The notes are always visible: nothing is only
 * on hover, and without JavaScript the numbers and the list still match.
 */
export function attach(figure: HTMLElement): () => void {
  const markers = [...figure.querySelectorAll<HTMLButtonElement>("button[data-hotspot]")];
  const notes = [...figure.querySelectorAll<HTMLElement>("[data-note]")];

  const select = (n: string | null) => {
    for (const m of markers) m.setAttribute("aria-pressed", String(m.dataset.hotspot === n));
    for (const note of notes) {
      if (note.dataset.note === n) note.setAttribute("data-active", "");
      else note.removeAttribute("data-active");
    }
  };
  const onClick = (e: Event) => {
    const marker = e.currentTarget as HTMLButtonElement;
    const n = marker.getAttribute("aria-pressed") === "true" ? null : marker.dataset.hotspot!;
    select(n);
    const note = notes.find((el) => el.dataset.note === n);
    if (!note) return;
    const r = note.getBoundingClientRect();
    if (r.top < 0 || r.bottom > window.innerHeight) {
      const still = document.documentElement.getAttribute("data-motion") === "still";
      note.scrollIntoView({ block: "nearest", behavior: still ? "auto" : "smooth" });
    }
  };

  markers.forEach((m) => m.addEventListener("click", onClick));
  return () => markers.forEach((m) => m.removeEventListener("click", onClick));
}
