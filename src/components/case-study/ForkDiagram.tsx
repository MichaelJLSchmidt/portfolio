import type { CSSProperties } from "react";
import styles from "./ForkDiagram.module.css";

export type ForkOption = {
  label: string;
  pros: readonly string[];
  cons: readonly string[];
  cost: string;
  /** "chosen": the way taken; "rejected": not taken; "reversed": taken, then turned back from. */
  status: "chosen" | "rejected" | "reversed";
  /** A reversed option: when we turned back, and why. */
  turnedBack?: { date: string; text: string };
};

export type ForkLabels = {
  chosen: string;
  notChosen: string;
  reversed: string;
  pros: string;
  cons: string;
  cost: string;
  turnedBack: (date: string) => string;
  /** The list's name for screen readers, e.g. "Options". */
  options: string;
};

/**
 * A decision as a trail junction: the trail arrives at a Swiss signpost (its arms' tips painted
 * white-red-white), then forks once per option. The chosen way is a solid route-red line that
 * runs on past its option; a way not taken is a dashed grey line that stops at a dead-end tick; a
 * reversed way runs solid, then turns back at a dated marker. The options are an ordered list
 * (label, what spoke for and against, the cost) with their status as text, so nothing depends on
 * the drawing, which is hidden from screen readers. Phones stack the same rows. Nothing moves.
 */
export function ForkDiagram({
  id,
  heading,
  headingLevel = 3,
  intro,
  options,
  after,
  labels,
}: {
  id?: string;
  heading: string;
  headingLevel?: 2 | 3;
  intro?: readonly string[];
  options: readonly ForkOption[];
  after?: string;
  labels: ForkLabels;
}) {
  const Heading = `h${headingLevel}` as "h2" | "h3";
  const statusText = {
    chosen: labels.chosen,
    rejected: labels.notChosen,
    reversed: labels.reversed,
  };
  return (
    <div className={`${styles.fork} legend`} id={id}>
      <Heading className={styles.heading}>{heading}</Heading>
      {intro?.map((t) => (
        <p key={t} className="body-copy">
          {t}
        </p>
      ))}
      <div className={styles.junction} aria-hidden="true">
        <svg className={styles.signpost} viewBox="0 0 120 64">
          <path className={styles.post} d="M14 4V64" />
          {[10, 28].map((y, i) => (
            <g key={y} transform={`translate(14 ${y})`}>
              <path className={styles.arm} d={`M0 0H${86 - i * 14}l8 7-8 7H0Z`} />
              <path className={styles.tipWhite} d={`M${74 - i * 14} 0h12l8 7-8 7h-12Z`} />
              <path className={styles.tipRed} d={`M${78 - i * 14} 0h6l5 7-5 7h-6Z`} />
            </g>
          ))}
        </svg>
      </div>
      <ol className={styles.options} aria-label={labels.options}>
        {options.map((o, i) => (
          <li key={o.label} className={styles.option} data-status={o.status} style={{ "--i": i } as CSSProperties}>
            <svg className={styles.branch} viewBox="0 0 48 100" preserveAspectRatio="none" aria-hidden="true">
              <path className={styles.trunk} d={i === options.length - 1 ? "M2 0V50" : "M2 0V100"} />
              <path className={styles.way} d="M2 50C20 50 26 50 48 50" />
              {o.status === "rejected" && <path className={styles.deadEnd} d="M44 38V62" />}
            </svg>
            <div className={styles.card}>
              <p className={styles.optionHead}>
                <span className={styles.label}>{o.label}</span>
                <span className={`${styles.status} hud-label`}>{statusText[o.status]}</span>
              </p>
              <dl className={styles.facts}>
                <div>
                  <dt className="hud-label">{labels.pros}</dt>
                  <dd>
                    <ul>
                      {o.pros.map((p) => (
                        <li key={p}>{p}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
                <div>
                  <dt className="hud-label">{labels.cons}</dt>
                  <dd>
                    <ul>
                      {o.cons.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
                <div>
                  <dt className="hud-label">{labels.cost}</dt>
                  <dd>{o.cost}</dd>
                </div>
              </dl>
              {o.turnedBack && (
                <p className={styles.turnedBack}>
                  <span className={`${styles.turnedBackLabel} hud-label`}>{labels.turnedBack(o.turnedBack.date)}</span> {o.turnedBack.text}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
      {after && <p className="body-copy">{after}</p>}
    </div>
  );
}
