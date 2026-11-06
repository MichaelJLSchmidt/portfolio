"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLabReady } from "@/components/lab/ready";
import { SurveyButton } from "@/components/ui/SurveyButton";
import { cards } from "@/content/cards";
import { useMotionMode } from "@/lib/motion-mode";
import { terrainLab as copy } from "@/content/lab";
import styles from "./TerrainLab.module.css";

type Hook = { route: (id: string | null) => void; frames: () => number; tier: string };
const hook = () => (window as Window & { __terrain?: Hook }).__terrain;

/**
 * The terrain lab: crossfade the field to any terrain without navigating, follow the real routes,
 * and reload in another motion tier or device tier. Shows how many frames the field has drawn,
 * so its pace (about 30 a second at rest, 60 while something moves) is visible.
 */
export function TerrainLab() {
  const { mode } = useMotionMode();
  const [target, setTarget] = useState<string>("region");
  const [frames, setFrames] = useState(0);
  useLabReady();

  useEffect(() => {
    const t = window.setInterval(() => setFrames(hook()?.frames() ?? 0), 500);
    return () => window.clearInterval(t);
  }, []);

  const terrains = [
    { id: "region", label: copy.morphs.region },
    { id: "bern", label: copy.morphs.bern },
    ...cards.map((c) => ({ id: c.terrainId, label: copy.morphs.card(c.name) })),
  ];

  return (
    <div className={styles.lab}>
      <section className={styles.block} aria-labelledby="lab-morphs">
        <h2 id="lab-morphs" className="mono">
          {copy.morphs.heading}
        </h2>
        <p className={styles.note}>{copy.morphs.note}</p>
        <div className={styles.row}>
          {terrains.map((t) => (
            <SurveyButton
              key={t.id}
              arrow={null}
              aria-pressed={target === t.id}
              data-morph={t.id}
              onClick={() => {
                setTarget(t.id);
                hook()?.route(t.id === "region" ? null : t.id);
              }}
            >
              {t.label}
            </SurveyButton>
          ))}
        </div>
      </section>

      <section className={styles.block} aria-labelledby="lab-routes">
        <h2 id="lab-routes" className="mono">
          {copy.routes.heading}
        </h2>
        <p className={styles.row}>
          <Link href="/">{copy.routes.home}</Link>
          <Link href="/about/">{copy.routes.about}</Link>
          {cards.map((c) => (
            <Link key={c.slug} href={`/work/${c.slug}/`}>
              {c.name}
            </Link>
          ))}
        </p>
      </section>

      <section className={styles.block} aria-labelledby="lab-modes">
        <h2 id="lab-modes" className="mono">
          {copy.modes.heading}
        </h2>
        <p className={styles.note}>{copy.modes.note}</p>
        <p className={styles.row}>
          {(["full", "calm", "still"] as const).map((m) => (
            <a key={m} href={`?motion=${m}&field=force`} aria-current={mode === m ? "true" : undefined}>
              {copy.modes.options[m]}
            </a>
          ))}
        </p>
        <p className={styles.row}>
          {(["desktop", "mobile", "low"] as const).map((t) => (
            <a key={t} href={`?tier=${t}&field=force`}>
              {copy.tiers.options[t]}
            </a>
          ))}
        </p>
      </section>

      <dl className={`${styles.state} mono`}>
        <div>
          <dt>{copy.state.mode}</dt>
          <dd>{mode}</dd>
        </div>
        <div>
          <dt>{copy.state.terrain}</dt>
          <dd data-lab-terrain={target}>{target}</dd>
        </div>
        <div>
          <dt>{copy.state.frames}</dt>
          <dd data-lab-frames={frames}>{frames}</dd>
        </div>
      </dl>
    </div>
  );
}
