import { useId, type ReactNode } from "react";
import { caseStudyLabels as L } from "@/content/case-study-labels";
import { asset } from "@/lib/asset";
import type { FigureSpec, ImageAsset, ImageSpec, LongDescription } from "@/lib/case-study";
import { Enhance } from "./Enhance";
import styles from "./Figure.module.css";

/**
 * Rendered image widths, for `sizes` (see Figure.module.css): wide figures up to ~1120 px, column
 * figures up to ~720 px, both full width on phones; the map sheet's padding comes off.
 * ≥ 1200 px the "On this page" trail takes a column beside the content.
 */
const SIZES: Record<FigureSpec["surface"], Record<FigureSpec["size"], string>> = {
  sheet: {
    wide: "(min-width: 1280px) min(1054px, calc(92vw - 338px)), (min-width: 640px) calc(92vw - 66px), calc(100vw - 40px)",
    column: "(min-width: 800px) 654px, (min-width: 640px) calc(92vw - 66px), calc(100vw - 40px)",
  },
  night: {
    wide: "(min-width: 1280px) min(1118px, calc(92vw - 274px)), (min-width: 640px) calc(92vw - 2px), 100vw",
    column: "(min-width: 800px) 718px, (min-width: 640px) calc(92vw - 2px), 100vw",
  },
};

const srcset = (img: ImageAsset, format: "avif" | "webp") =>
  img.sources
    .filter((s) => s.format === format)
    .map((s) => `${asset(s.src)} ${s.width}w`)
    .join(", ");

const largest = (img: ImageAsset, format: "avif" | "webp") =>
  img.sources.filter((s) => s.format === format).reduce((a, b) => (b.width > a.width ? b : a));

/** <picture>: AVIF, then WebP, by width; lazy unless it is in the first viewport. */
export function Picture({
  img,
  alt,
  sizes,
  priority = false,
  className,
}: {
  img: ImageAsset;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  const fallback = img.sources.find((s) => s.format === "webp" && s.width === 1280) ?? largest(img, "webp");
  return (
    <picture className={className}>
      <source type="image/avif" srcSet={srcset(img, "avif")} sizes={sizes} />
      <source type="image/webp" srcSet={srcset(img, "webp")} sizes={sizes} />
      <img
        src={asset(fallback.src)}
        alt={alt}
        width={img.width}
        height={img.height}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
        style={{ backgroundImage: `url(${img.placeholder})` }}
      />
    </picture>
  );
}

function Long({ items }: { items: LongDescription }) {
  return (
    <ul>
      {items.map((item, i) =>
        typeof item === "string" ? (
          <li key={i}>{item}</li>
        ) : (
          <li key={i}>
            {item.text}
            <Long items={item.items} />
          </li>
        ),
      )}
    </ul>
  );
}

type Props = {
  spec: FigureSpec;
  images: Record<string, ImageSpec>;
  assets: Record<string, ImageAsset>;
  /** Figure number; the hero has none. */
  number?: number;
};

function need(assets: Record<string, ImageAsset>, id: string): ImageAsset {
  const img = assets[id];
  if (!img) throw new Error(`Image "${id}" is not in the manifest: run npm run images.`);
  return img;
}

/**
 * A case-study figure: <figure> with a responsive <picture>, a caption "Fig. n — What it shows.
 * Why it matters." and, for complex diagrams, a long description behind "Describe this
 * diagram". Surfaces: the map sheet (light UI and diagrams) or the night frame (charts, hero);
 * sizes: column or wide. Variants: a lightbox ("Enlarge"), a before/after comparison and
 * numbered hotspots. Their code loads lazily (Enhance); without JavaScript the figure is
 * complete: a full-size link, both images stacked, a visible list of notes.
 *
 * Motion: below the fold the figure unfolds from the top behind a 1 px scan line over
 * --dur-settle, then its corner ticks show and the caption fades in after it; until its image has
 * decoded it shows a contour placeholder, and the image cross-fades in (reveal.ts, "figure").
 */
export function Figure({ spec, images, assets, number }: Props) {
  const id = useId();
  const captionId = `${id}caption`;
  const sizes = SIZES[spec.surface][spec.size];
  const behaviours = [spec.zoom && "lightbox", spec.kind === "compare" && "compare", spec.kind === "hotspots" && "hotspots"].filter(Boolean).join(" ");
  const label = number ? L.figure(number) : null;

  let media: ReactNode;
  let zoomImage: { img: ImageAsset; alt: string } | null = null;
  if (spec.kind === "compare") {
    const before = need(assets, spec.before);
    const after = need(assets, spec.after);
    media = (
      <div className={styles.compare} data-compare data-view="slider" data-reveal="figure" style={{ "--pos": "50%" } as React.CSSProperties}>
        {/* Before first: the reading order without JavaScript, and for screen readers. */}
        <div className={styles.compareStage}>
          <div className={styles.compareBefore} data-compare-before>
            <Picture img={before} alt={images[spec.before].alt} sizes={sizes} />
            <span className={`${styles.compareTag} hud-label`} aria-hidden="true">
              {L.before}
            </span>
          </div>
          <div className={styles.compareAfter}>
            <Picture img={after} alt={images[spec.after].alt} sizes={sizes} />
            <span className={`${styles.compareTag} hud-label`} aria-hidden="true">
              {L.after}
            </span>
          </div>
          <span className={styles.compareHandle} aria-hidden="true" />
          <input
            className={styles.compareRange}
            type="range"
            min={0}
            max={100}
            step={1}
            defaultValue={50}
            aria-label={L.compare}
            aria-valuetext={L.compareValue(50)}
            aria-describedby={captionId}
            data-compare-range
          />
        </div>
        <div className={styles.compareViews} role="group" aria-label={L.compareView}>
          <button type="button" aria-pressed="false" data-compare-view="before">
            {L.before}
          </button>
          <button type="button" aria-pressed="false" data-compare-view="after">
            {L.after}
          </button>
          <button type="button" aria-pressed="false" data-compare-view="side">
            {L.sideBySide}
          </button>
        </div>
      </div>
    );
  } else {
    const img = need(assets, spec.image);
    const alt = images[spec.image].alt;
    zoomImage = spec.zoom ? { img, alt } : null;
    media = (
      <div className={styles.media} data-reveal="figure">
        <Picture img={img} alt={alt} sizes={sizes} priority={spec.priority} />
        {spec.kind === "hotspots" &&
          spec.notes.map((note, i) => {
            const n = i + 1;
            const at = img.hotspots?.find((h) => h.n === n);
            if (!at) throw new Error(`Image "${spec.image}" has no hotspot ${n}: mark it data-hotspot="${n}" in its artefact and run npm run images.`);
            return (
              <button
                key={n}
                type="button"
                className={styles.hotspot}
                style={{ left: `${(at.x * 100).toFixed(2)}%`, top: `${(at.y * 100).toFixed(2)}%` }}
                aria-label={L.noteMarker(n, note.title)}
                aria-controls={`${id}note-${n}`}
                aria-pressed="false"
                data-hotspot={n}
              >
                <span aria-hidden="true">{n}</span>
              </button>
            );
          })}
      </div>
    );
  }

  return (
    <figure
      className={styles.figure}
      data-surface={spec.surface}
      data-size={spec.size}
      data-kind={spec.kind}
      data-zoom={zoomImage ? "" : undefined}
      aria-labelledby={spec.caption ? captionId : undefined}
    >
      {media}
      {zoomImage && <Zoom {...zoomImage} label={label} caption={spec.caption} />}
      {(spec.caption || spec.long) && (
        <figcaption className={`${styles.caption} surface-copy`} data-reveal="caption">
          {spec.caption && (
            // "FIG. 3 · what it shows · source", in mono.
            <p id={captionId} className={`${styles.captionText} hud-label`}>
              {label && <span className={styles.figLabel}>{label}</span>}
              {label && <span aria-hidden="true"> · </span>}
              {spec.caption}
              {spec.source && <span className={styles.source}>{` · ${spec.source}`}</span>}
            </p>
          )}
          {spec.kind === "hotspots" && (
            <ol className={styles.notes}>
              {spec.notes.map((note, i) => (
                <li key={i} id={`${id}note-${i + 1}`} data-note={i + 1}>
                  <span>
                    <strong>{note.title}.</strong> {note.text}
                  </span>
                </li>
              ))}
            </ol>
          )}
          {spec.long && (
            <details className={styles.long}>
              <summary>{L.describe}</summary>
              <Long items={spec.long} />
            </details>
          )}
        </figcaption>
      )}
      {behaviours && <Enhance behaviours={behaviours} />}
    </figure>
  );
}

/**
 * Lightbox markup: a full-size link (the fallback without JavaScript), the "Enlarge" button
 * that replaces it once the behaviour is attached, and a native <dialog> with the caption and
 * zoom controls. The largest source is set only when the dialog opens.
 */
function Zoom({ img, alt, label, caption }: { img: ImageAsset; alt: string; label: string | null; caption?: string }) {
  const id = useId();
  const webp = largest(img, "webp");
  const avif = largest(img, "avif");
  return (
    <>
      <a className={`${styles.zoomOpen} hud-label`} href={asset(webp.src)} data-lightbox-fallback>
        {L.openFullSize}
      </a>
      <button type="button" className={`${styles.zoomOpen} hud-label`} aria-haspopup="dialog" data-lightbox-open hidden>
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M9.5 1.5h5v5M14.5 1.5 9 7M6.5 14.5h-5v-5M1.5 14.5 7 9" />
        </svg>
        {L.enlarge}
      </button>
      <dialog className={styles.lightbox} aria-labelledby={`${id}title`} data-lightbox data-lenis-prevent>
        <div className={styles.lightboxBar}>
          <p id={`${id}title`} className="hud-label">
            {label ?? L.enlarge}
          </p>
          <div className={styles.zoomControls} role="group" aria-label={L.zoomGroup}>
            <button type="button" aria-label={L.zoomOut(100)} data-zoom="out">
              <span aria-hidden="true">−</span>
            </button>
            <span className={`${styles.zoomLevel} hud-label`} aria-hidden="true" data-zoom-level>
              100%
            </span>
            <button type="button" aria-label={L.zoomIn(100)} data-zoom="in">
              <span aria-hidden="true">+</span>
            </button>
            <button type="button" aria-label={L.zoomReset(100)} data-zoom="reset" className="hud-label">
              {L.reset}
            </button>
          </div>
          <button type="button" className={`${styles.lightboxClose} hud-label`} data-lightbox-close>
            {L.close}
          </button>
        </div>
        <div className={styles.lightboxStage} data-lightbox-stage>
          <picture data-lightbox-picture>
            <source type="image/avif" data-srcset={asset(avif.src)} />
            <img alt={alt} width={img.width} height={img.height} data-src={asset(webp.src)} draggable={false} />
          </picture>
        </div>
        <p className={`${styles.lightboxHint} hud-label`}>{L.zoomHint}</p>
        {caption && (
          <p className={styles.lightboxCaption}>
            {label && <span className={styles.figLabel}>{label} — </span>}
            {caption}
          </p>
        )}
        <p className="visually-hidden" aria-live="polite" data-zoom-status />
      </dialog>
    </>
  );
}
