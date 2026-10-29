"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { MotionButton } from "@/components/motion/MotionButton";
import { fieldStore, useFieldStore } from "@/components/terrain/field-store";
import { BERN } from "@/components/terrain/route-terrain";
import { TerrainReadout } from "@/components/terrain/TerrainReadout";
import { cards } from "@/content/cards";
import { useMotionMode } from "@/lib/motion-mode";
import { terrainLab as copy } from "./copy";
import styles from "./TerrainLab.module.css";

/** Morphs the field as a route change to `id` would (the backdrop sets it again on the next real route). */
const morphTo = (id: string | null) => fieldStore.set((s) => ({ morphTarget: id, routeSeq: s.routeSeq + 1 }));

// The page's own query, so a mode switch keeps the tier and the other way round.
const subscribe = () => () => {};
const useSearch = () => useSyncExternalStore(subscribe, () => window.location.search, () => "");
const withParam = (search: string, key: string, value: string | null) => {
  const params = new URLSearchParams(search);
  if (value) params.set(key, value);
  else params.delete(key);
  // Headless browsers (SwiftShader) need the field forced on.
  params.set("field", "force");
  return `?${params}`;
};

export function TerrainLab() {
  const { mode } = useMotionMode();
  const target = useFieldStore((s) => s.morphTarget);
  const tier = useFieldStore((s) => s.tier);
  const field = useFieldStore((s) => s.mode);
  const shown = useFieldStore((s) => s.shownTerrain);
  const interval = useFieldStore((s) => s.intervalM);
  const search = useSearch();
  const terrains = [
    { id: null, label: copy.morphs.region },
    ...cards.map((c) => ({ id: c.artwork.terrainId, label: copy.morphs.card(c.name) })),
    { id: BERN, label: copy.morphs.bern },
  ];

  return (
    <div className={styles.grid}>
      <section className={styles.panel} aria-labelledby="lab-morphs" data-quiet-zone>
        <h2 id="lab-morphs" className="hud-label">
          {copy.morphs.heading}
        </h2>
        <p className={styles.note}>{copy.morphs.note}</p>
        <div className={styles.row}>
          {terrains.map((t) => (
            <MotionButton
              key={t.id ?? "region"}
              label={t.label}
              aria-pressed={target === t.id}
              data-morph={t.id ?? "region"}
              onClick={() => morphTo(t.id)}
            />
          ))}
        </div>
        <h3 className="hud-label">{copy.routes.heading}</h3>
        <div className={styles.row}>
          <Link href="/" className="hud-label">
            {copy.routes.home}
          </Link>
          {cards.map((c) => (
            <Link key={c.slug} href={c.href ?? `/work/${c.slug}/`} className="hud-label">
              {c.name}
            </Link>
          ))}
          <Link href="/about/" className="hud-label">
            {copy.routes.about}
          </Link>
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="lab-readout" data-quiet-zone>
        <h2 id="lab-readout" className="hud-label">
          {copy.readout.heading}
        </h2>
        <TerrainReadout className={`${styles.readout} hud-label`} />
        <dl className={styles.state}>
          <div>
            <dt>{copy.state.field}</dt>
            <dd data-lab-state="field">{field}</dd>
          </div>
          <div>
            <dt>{copy.state.tier}</dt>
            <dd data-lab-state="tier">{tier ?? copy.state.none}</dd>
          </div>
          <div>
            <dt>{copy.state.terrain}</dt>
            <dd data-lab-state="terrain">{shown ?? "region"}</dd>
          </div>
          <div>
            <dt>{copy.state.interval}</dt>
            <dd data-lab-state="interval">{interval ? `${interval} ${copy.state.metres}` : copy.state.none}</dd>
          </div>
        </dl>
      </section>

      <section className={styles.panel} aria-labelledby="lab-modes" data-quiet-zone>
        <h2 id="lab-modes" className="hud-label">
          {copy.modes.heading}
        </h2>
        <p className={styles.note}>{copy.modes.note}</p>
        <div className={styles.row}>
          {(Object.keys(copy.modes.options) as (keyof typeof copy.modes.options)[]).map((m) => (
            <a key={m} href={withParam(search, "motion", m)} className="hud-label" aria-current={mode === m ? "true" : undefined}>
              {copy.modes.options[m]}
            </a>
          ))}
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="lab-tiers" data-quiet-zone>
        <h2 id="lab-tiers" className="hud-label">
          {copy.tiers.heading}
        </h2>
        <p className={styles.note}>{copy.tiers.note}</p>
        <div className={styles.row}>
          {(Object.keys(copy.tiers.options) as (keyof typeof copy.tiers.options)[]).map((t) => (
            <a
              key={t}
              href={withParam(search, "tier", t === "auto" ? null : t)}
              className="hud-label"
              aria-current={(t === "auto" ? !new URLSearchParams(search).get("tier") : tier === t) ? "true" : undefined}
            >
              {copy.tiers.options[t]}
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
