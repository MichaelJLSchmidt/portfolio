import { haptic } from "@/lib/haptics";
import { currentMode } from "@/lib/motion-mode";
import { isSettled, markSettled, settleKey } from "@/lib/settled";
import { duration } from "@/styles/tokens";

/**
 * Annotated hotspots (Figure.tsx renders the markup): numbered marker buttons on the image.
 * Pressing one highlights the matching note in the caption's ordered list (and the marker), and
 * brings the note into view if it is off screen. The notes are always visible: nothing is only
 * on hover, and without JavaScript the numbers and the list still match.
 *
 * Motion: the first time the image is in view this session (full motion) the pins ping once, one
 * after another (--dur-instant apart); a pressed pin shows its note's title beside it in a mini
 * sheet that unfolds (--dur-unfold) and settles, with the detent haptic. The mini sheet repeats
 * the note, so it is hidden from screen readers.
 */
export function attach(figure: HTMLElement): () => void {
  const markers = [...figure.querySelectorAll<HTMLButtonElement>("button[data-hotspot]")];
  const notes = [...figure.querySelectorAll<HTMLElement>("[data-note]")];
  const media = markers[0]?.parentElement;

  // The mini sheet: one label, moved to the pressed pin.
  const label = document.createElement("span");
  label.setAttribute("aria-hidden", "true");
  label.setAttribute("data-hotspot-label", "");
  label.hidden = true;
  media?.appendChild(label);

  const select = (n: string | null) => {
    for (const m of markers) m.setAttribute("aria-pressed", String(m.dataset.hotspot === n));
    for (const note of notes) {
      if (note.dataset.note === n) note.setAttribute("data-active", "");
      else note.removeAttribute("data-active");
    }
    const marker = markers.find((m) => m.dataset.hotspot === n);
    const title = notes.find((el) => el.dataset.note === n)?.querySelector("strong")?.textContent?.replace(/[.:]\s*$/, "");
    if (!marker || !title) {
      label.hidden = true;
      return;
    }
    label.textContent = title;
    label.style.left = marker.style.left;
    label.style.top = marker.style.top;
    // Past the middle, the sheet opens to the pin's left.
    label.dataset.side = parseFloat(marker.style.left) > 55 ? "start" : "end";
    label.hidden = false;
    // Replays the unfold for every pin pressed.
    label.removeAttribute("data-play");
    void label.offsetWidth;
    label.setAttribute("data-play", "");
  };
  const onClick = (e: Event) => {
    const marker = e.currentTarget as HTMLButtonElement;
    const n = marker.getAttribute("aria-pressed") === "true" ? null : marker.dataset.hotspot!;
    select(n);
    if (n) haptic("detent");
    const note = notes.find((el) => el.dataset.note === n);
    if (!note) return;
    const r = note.getBoundingClientRect();
    if (r.top < 0 || r.bottom > window.innerHeight) {
      const still = document.documentElement.getAttribute("data-motion") === "still";
      note.scrollIntoView({ block: "nearest", behavior: still ? "auto" : "smooth" });
    }
  };

  // The pins ping once, in turn, the first time the image is well in view.
  const key = settleKey(window.location.pathname, `hotspots:${markers.map((m) => m.getAttribute("aria-label")).join("|")}`);
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      if (isSettled(key) || currentMode() !== "full") return;
      markSettled(key);
      markers.forEach((m, i) => {
        m.style.setProperty("--ping-delay", `${i * duration.instant}ms`);
        m.setAttribute("data-ping", "");
      });
      window.setTimeout(() => markers.forEach((m) => m.removeAttribute("data-ping")), markers.length * duration.instant + duration.long);
    },
    { threshold: 0.6 },
  );
  if (media) io.observe(media);

  markers.forEach((m) => m.addEventListener("click", onClick));
  return () => {
    io.disconnect();
    label.remove();
    markers.forEach((m) => m.removeEventListener("click", onClick));
  };
}
