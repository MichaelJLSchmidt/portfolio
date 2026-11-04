import Link from "next/link";
import { Fragment } from "react";
import { cardHref, cardLabels, typeLine, typeParts, type CardData } from "@/content/cards";
import { summitOf } from "@/content/geo";
import { asset } from "@/lib/asset";
import { PlatePreload } from "./PlatePreload";
import styles from "./MapSheetCard.module.css";

/**
 * The map-sheet card: a calm trading card, 5:7, a 1 px frame on the raised ground. Top to bottom:
 * a mono label row (case study number, year), the title, a 4:3 art window (the terrain plate, the
 * element that travels into the case study's header), the type line (sector · role · team size),
 * the outcome in one sentence and the set line (summit · altitude, collector number). The whole
 * card is one link.
 *
 * Hover (fine pointer, Full): the card lifts 6 px, its frame goes to text-3 and the art steps up
 * one contour level (the second plate crossfades in over --dur-level). Focus: the same with the
 * 2 px mint outline. Press: 0.985. Touch, Calm and Off: only the frame changes. The level plate
 * loads lazily and is decoded on the first hover or focus (PlatePreload).
 */
export function MapSheetCard({
  card,
  outcome,
  index,
  total,
  size = "full",
  headingLevel = 3,
}: {
  card: CardData;
  /** The case study's result in one sentence (its impact line). */
  outcome: string;
  /** 1-based position among the case studies, and how many there are. */
  index: number;
  total: number;
  /** "mini": the next case study's card at the foot of a case study. */
  size?: "full" | "mini";
  headingLevel?: 2 | 3;
}) {
  const summit = summitOf(card.terrainId);
  const line = typeLine(card);
  const Heading = `h${headingLevel}` as const;
  const name = card.example ? `${card.name} (${cardLabels.example})` : card.name;
  return (
    <article className={styles.card} data-size={size} data-slug={card.slug}>
      <Link href={cardHref(card)} className={`${styles.link} plain`} aria-label={cardLabels.open(name, line)}>
        <span className={`${styles.labels} mono`}>
          <span>{cardLabels.label(index)}</span>
          <span>{card.year}</span>
        </span>
        <Heading className={`${styles.title} t-h3`}>{card.name}</Heading>
        <span className={styles.art} data-card-art={card.slug}>
          <img className={styles.plate} src={asset(`/plates/${card.terrainId}.svg`)} alt="" width={400} height={300} loading="lazy" decoding="async" />
          <img
            className={`${styles.plate} ${styles.level}`}
            src={asset(`/plates/${card.terrainId}-level.svg`)}
            alt=""
            width={400}
            height={300}
            loading="lazy"
            decoding="async"
            data-plate="level"
          />
        </span>
        <span className={`${styles.type} mono`}>
          {typeParts(card).map((part, i) => (
            <Fragment key={i}>
              {i > 0 && " · "}
              <span className={styles.part}>{part}</span>
            </Fragment>
          ))}
        </span>
        <span className={styles.outcome}>{outcome}</span>
        <PlatePreload />
        <span className={`${styles.set} mono`}>
          <span>{summit ? `${summit.label} · ${summit.altitude}` : ""}</span>
          <span>{cardLabels.collector(index, total)}</span>
        </span>
      </Link>
    </article>
  );
}
