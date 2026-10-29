"use client";

import { usePathname } from "next/navigation";
import { Fragment, useSyncExternalStore } from "react";
import { RollNumber } from "@/components/motion/RollNumber";
import { cards } from "@/content/cards";
import { fieldStore } from "./field-store";
import { READOUT_SEPARATOR, formatReadout, readoutFor, readoutParts, type Readout } from "./readout";
import { BERN, routeTerrain } from "./route-terrain";
import styles from "./TerrainReadout.module.css";

/** Every readout the page can show (the region, Bern, each card's terrain): the widest one reserves the box. */
const known = (): Readout[] => [readoutFor(null), readoutFor(BERN), ...cards.map((c) => readoutFor(c.artwork.terrainId))];
const compact = (r: Readout): Readout => ({ ...r, e: null, n: null });
const widest = (list: Readout[]) => list.map(formatReadout).reduce((a, b) => (b.length > a.length ? b : a), "");

/**
 * The field's readout, e.g. "BERN · E 2’600’000 · N 1’200’000 · ALT 554 M": what the terrain
 * behind the page is (the HUD's middle slot). It follows the field store's morph target (route
 * changes and the lab's morphs alike); the server and hydration render it from the route, with
 * formatInteger, so both agree. Changed numbers roll with the terrain (RollNumber) in full and
 * calm, and snap in still. Screen readers get the plain text once; the rolling digits are hidden
 * from them.
 *
 * Its box is reserved at the widest readout there is (a mono font: the longest text), so a change
 * of terrain never moves anything. Below the large breakpoint the coordinates are left out (label
 * and altitude only), and the box is reserved at the widest of those.
 */
export function TerrainReadout({ className }: { className?: string }) {
  const pathname = usePathname();
  // The store starts on the route's terrain on the client, so hydration matches the server.
  const target = useSyncExternalStore(
    fieldStore.subscribe,
    () => fieldStore.get().morphTarget,
    () => routeTerrain(pathname),
  );
  const readout = readoutFor(target);
  const all = known();

  return (
    <p className={`${styles.readout} ${className ?? ""}`} data-terrain-readout={readout.id ?? "region"}>
      <span className="visually-hidden">{formatReadout(readout)}</span>
      <span className={styles.box} aria-hidden="true">
        <span className={styles.ghost} data-ghost="full">
          {widest(all)}
        </span>
        <span className={styles.ghost} data-ghost="compact">
          {widest(all.map(compact))}
        </span>
        <span className={styles.run} data-run="">
          {readoutParts(readout).map((part, i) => (
            <Fragment key={part.key}>
              {part.key === "label" ? (
                <span data-part="label">{part.text}</span>
              ) : (
                <span data-part={part.key}>
                  {i > 0 && READOUT_SEPARATOR}
                  {part.prefix}
                  <RollNumber value={part.value} />
                  {part.suffix}
                </span>
              )}
            </Fragment>
          ))}
        </span>
      </span>
    </p>
  );
}
