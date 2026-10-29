"use client";

import { usePathname } from "next/navigation";
import { Fragment, useEffect, useState, useSyncExternalStore, type ComponentType } from "react";
import { formatInteger } from "@/lib/format";
import { useMotionMode } from "@/lib/motion-mode";
import { fieldStore } from "./field-store";
import { READOUT_SEPARATOR, formatReadout, readoutFor, readoutParts } from "./readout";
import { routeTerrain } from "./route-terrain";
import styles from "./TerrainReadout.module.css";

/**
 * The field's readout, e.g. "BERN · E 2’600’000 · N 1’200’000 · ALT 554 M": what the terrain
 * behind the page is. It follows the field store (route changes and the lab's morphs alike); the
 * server and hydration render it from the route, with formatInteger, so both agree. Changed
 * numbers roll with the terrain (AnimateNumber, loaded after hydration) in full and calm, and
 * snap in still. Screen readers get the plain text once; the rolling digits are hidden from them.
 *
 * Mounted on /lab/terrain/ for now; a later phase mounts it in the HUD (docs/terrain.md).
 */
type Roll = ComponentType<{ value: number }>;

export function TerrainReadout({ className }: { className?: string }) {
  const pathname = usePathname();
  const readout = useSyncExternalStore(
    fieldStore.subscribe,
    () => fieldStore.get().readout,
    () => readoutFor(routeTerrain(pathname)),
  );
  const { mode } = useMotionMode();
  const [Roll, setRoll] = useState<Roll | null>(null);
  useEffect(() => {
    if (mode === "still") return;
    let live = true;
    import("./ReadoutNumber").then((m) => live && setRoll(() => m.default));
    return () => {
      live = false;
    };
  }, [mode]);
  const roll = mode !== "still" ? Roll : null;

  return (
    <p className={`${styles.readout} ${className ?? ""}`} data-terrain-readout={readout.id ?? "region"}>
      <span className="visually-hidden">{formatReadout(readout)}</span>
      <span aria-hidden="true">
        {readoutParts(readout).map((part, i) => (
          <Fragment key={part.key}>
            {i > 0 && READOUT_SEPARATOR}
            {part.key === "label" ? (
              <span data-part="label">{part.text}</span>
            ) : (
              <span data-part={part.key}>
                {part.prefix}
                <span className={styles.number}>{roll ? <RollNumber Roll={roll} value={part.value} /> : formatInteger(part.value)}</span>
                {part.suffix}
              </span>
            )}
          </Fragment>
        ))}
      </span>
    </p>
  );
}

const RollNumber = ({ Roll, value }: { Roll: Roll; value: number }) => <Roll value={value} />;
