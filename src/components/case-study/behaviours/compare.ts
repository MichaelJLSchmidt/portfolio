import { caseStudyLabels as L } from "@/content/cards";

/**
 * Before/after comparison (Figure.tsx renders the markup): a native range input, labelled
 * "Compare before and after", moves the clip of the "before" image (arrow keys, Page Up/Down,
 * Home/End and dragging come with the input); "Before", "After" and "Side by side" buttons set
 * the view. Without JavaScript both images stack, each with its own alt text.
 */
export function attach(figure: HTMLElement): () => void {
  const root = figure.querySelector<HTMLElement>("[data-compare]");
  const range = root?.querySelector<HTMLInputElement>("[data-compare-range]");
  if (!root || !range) return () => {};
  const buttons = [...root.querySelectorAll<HTMLButtonElement>("[data-compare-view]")];

  const sync = () => {
    const pos = Number(range.value);
    root.style.setProperty("--pos", `${pos}%`);
    range.setAttribute("aria-valuetext", L.compareValue(pos));
    const view = root.dataset.view;
    for (const b of buttons) {
      const v = b.dataset.compareView;
      const pressed = v === "side" ? view === "side" : view !== "side" && pos === (v === "before" ? 100 : 0);
      b.setAttribute("aria-pressed", String(pressed));
    }
  };
  const onInput = () => {
    root.dataset.view = "slider";
    sync();
  };
  const onClick = (e: Event) => {
    const v = (e.currentTarget as HTMLButtonElement).dataset.compareView;
    if (v === "side") {
      root.dataset.view = root.dataset.view === "side" ? "slider" : "side";
    } else {
      root.dataset.view = "slider";
      range.value = v === "before" ? "100" : "0";
    }
    sync();
  };

  root.dataset.enhanced = "true";
  range.addEventListener("input", onInput);
  buttons.forEach((b) => b.addEventListener("click", onClick));
  sync();
  return () => {
    range.removeEventListener("input", onInput);
    buttons.forEach((b) => b.removeEventListener("click", onClick));
  };
}
