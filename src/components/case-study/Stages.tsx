import { useId, type CSSProperties } from "react";
import { caseStudyLabels as L } from "@/content/case-study-labels";
import type { AscentPlace } from "@/content/geo";
import { altitudeLabel } from "@/content/geo";
import { decisionNumbers, figureNumbers, noteNumbers, type Block, type CaseStudy, type Decision, type ListItem } from "@/lib/case-study";
import { TrailLink } from "@/components/interaction/TrailLink";
import { ForkDiagram } from "./ForkDiagram";
import { Figure } from "./Figure";
import styles from "./Stages.module.css";

/** The fork diagram's words, from the content. */
export const forkLabels = { ...L.fork, options: L.fork.options };

/** Consecutive running text shares one legend panel; everything else stands on its own. */
type Group = { text: { block: Block; at: number }[] } | { block: Block };
const isText = (b: Block) => b.kind === "p" || b.kind === "list";

function groups(blocks: Block[]): Group[] {
  const out: Group[] = [];
  blocks.forEach((b, at) => {
    const last = out[out.length - 1];
    if (isText(b) && last && "text" in last) last.text.push({ block: b, at });
    else out.push(isText(b) ? { text: [{ block: b, at }] } : { block: b });
  });
  return out;
}

const Item = ({ item }: { item: ListItem }) =>
  typeof item === "string" ? (
    <>{item}</>
  ) : (
    <>
      <strong>{item.lead}</strong> {item.text}
    </>
  );

/** A paragraph and its side note: the note hangs in the margin on a hairline leader (inline on phones). */
function Paragraph({ block, note }: { block: Extract<Block, { kind: "p" }>; note?: number }) {
  return (
    <div className={styles.row}>
      <p className="body-copy">
        {block.lead && <strong>{block.lead} </strong>}
        {block.text}
        {note && (
          <sup className={styles.noteRef} aria-hidden="true">
            {note}
          </sup>
        )}
      </p>
      {note && (
        <aside className={`${styles.note} hud-label`} aria-label={L.sideNote(note)}>
          <span className={styles.noteNumber} aria-hidden="true">
            {note}
          </span>
          <span>{block.note}</span>
        </aside>
      )}
    </div>
  );
}

function List({ block }: { block: Extract<Block, { kind: "list" }> }) {
  const Tag = block.ordered ? "ol" : "ul";
  return (
    <div className={styles.row}>
      <div className={styles.listBlock}>
        {block.intro && <p className="body-copy">{block.intro}</p>}
        <Tag className={`${styles.list} body-copy`} data-ordered={block.ordered || undefined}>
          {block.items.map((item, i) => (
            <li key={i} style={{ "--i": i } as CSSProperties}>
              <Item item={item} />
            </li>
          ))}
        </Tag>
      </div>
    </div>
  );
}

/** The page's one key insight: an aside with a visible label. */
function KeyInsight({ text }: { text: string }) {
  const id = useId();
  return (
    <aside className={`${styles.insight} surface-copy`} aria-labelledby={id}>
      <p id={id} className={`${styles.insightLabel} hud-label`}>
        {L.keyInsight}
      </p>
      <p className={styles.insightText}>{text}</p>
    </aside>
  );
}

export function DecisionFork({ decision: d, heading, headingLevel = 3 }: { decision: Decision; heading: string; headingLevel?: 2 | 3 }) {
  return <ForkDiagram id={d.id} heading={heading} headingLevel={headingLevel} intro={d.text} options={d.options} after={d.after} labels={forkLabels} />;
}

/**
 * The stages of a case study, in the margin column: each opens with its mono stage line (stage,
 * place, altitude: true data from geo.ts) and the finding as its H2; running text at 60–68
 * characters with numbered side notes in a narrow margin (inline mono blocks on phones);
 * figures, decisions (fork diagrams) and the one key insight between. The sticky timeline beside
 * it is the page's (WaypointTrail). Below the large breakpoint each stage ends with
 * "Next stage ↓ / Back to top ↑". Each stage is a waypoint of the red route (RouteLayer); the
 * stages after the ascent's last railway station are climbed on foot, so the route is a blaze
 * from the first of them.
 */
export function Stages({ study, places, lastStation }: { study: CaseStudy; places: readonly AscentPlace[]; lastStation: number }) {
  const figures = figureNumbers(study);
  const decisions = decisionNumbers(study);
  const notes = noteNumbers(study);
  return (
    <>
      {study.stages.map((stage, index) => {
        const place = places[index];
        const next = study.stages[index + 1];
        return (
          <section
            key={stage.id}
            id={stage.id}
            className={styles.stage}
            aria-labelledby={`${stage.id}-heading`}
            data-waypoint
            data-route={stage.id}
            data-route-blaze={index > lastStation ? "" : undefined}
          >
            {groups(stage.blocks).map((part, g) => {
              const heading = g === 0 && (
                <h2 id={`${stage.id}-heading`} className={styles.heading}>
                  <span className={`${styles.stageLine} hud-label`}>
                    {place ? L.stageLine(index + 1, place.label, altitudeLabel(place.altitudeM)) : L.stage(index + 1)}
                  </span>
                  <span className={styles.finding}>{stage.finding}</span>
                </h2>
              );
              if ("text" in part) {
                return (
                  <div key={g} className={`${styles.panel} legend`}>
                    {heading}
                    {part.text.map(({ block, at }) =>
                      block.kind === "p" ? (
                        <Paragraph key={at} block={block} note={notes.get(`${stage.id}:${at}`)} />
                      ) : block.kind === "list" ? (
                        <List key={at} block={block} />
                      ) : null,
                    )}
                  </div>
                );
              }
              const b = part.block;
              const body = (() => {
                switch (b.kind) {
                  case "figure": {
                    const spec = study.figures?.[b.id];
                    if (!spec) throw new Error(`Figure "${b.id}" is not defined in the case study's figures.`);
                    return <Figure spec={spec} images={study.images ?? {}} assets={study.assets ?? {}} number={figures.get(b.id)} />;
                  }
                  case "insight":
                    return <KeyInsight text={b.text} />;
                  case "decision":
                    return <DecisionFork decision={b} heading={`${L.decision(decisions.get(b.id)!)} — ${b.title}`} />;
                  default:
                    return null;
                }
              })();
              return heading ? (
                <div key={g} className={styles.group}>
                  <div className={`${styles.panel} legend`}>{heading}</div>
                  {body}
                </div>
              ) : (
                <div key={g} className={styles.group}>
                  {body}
                </div>
              );
            })}
            <p className={styles.foot}>
              {next && (
                <TrailLink
                  href={`#${next.id}`}
                  arrow="↓"
                  aria-label={`${L.nextWaypoint}: ${next.nav}`}
                  className={`${styles.footLink} hud-label map-halo`}
                  data-quiet-zone
                >
                  {L.nextWaypoint}
                </TrailLink>
              )}
              <TrailLink href="#main" arrow="↑" className={`${styles.footLink} hud-label map-halo`} data-quiet-zone>
                {L.backToTop}
              </TrailLink>
            </p>
          </section>
        );
      })}
    </>
  );
}
