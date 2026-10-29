import { useId, type CSSProperties } from "react";
import { ContourRule } from "@/components/motion/ContourRule";
import { RollValue } from "@/components/motion/RollValue";
import { SettleText } from "@/components/motion/SettleText";
import { SignatureLink } from "@/components/motion/SignatureLink";
import { caseStudyLabels as L } from "@/content/cards";
import { duration } from "@/styles/tokens";
import { decisionNumbers, figureNumbers, type Block, type CaseStudy, type Decision, type Evidence, type ListItem, type Waypoint } from "@/lib/case-study";
import { EvidenceBadge, EvidenceLegend } from "./Evidence";
import { Figure } from "./Figure";
import styles from "./CaseStudy.module.css";

/** Consecutive running text shares one legend panel; everything else stands on its own. */
type Group = { text: Block[] } | { block: Block };
const isText = (b: Block) => b.kind === "p" || b.kind === "list" || b.kind === "quote";

function groups(blocks: Block[]): Group[] {
  const out: Group[] = [];
  for (const b of blocks) {
    const last = out[out.length - 1];
    if (isText(b) && last && "text" in last) last.text.push(b);
    else out.push(isText(b) ? { text: [b] } : { block: b });
  }
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

function TextBlock({ block }: { block: Block }) {
  switch (block.kind) {
    case "p":
      return (
        <p className="body-copy">
          {block.lead && <strong>{block.lead} </strong>}
          {block.text}
        </p>
      );
    case "list": {
      const List = block.ordered ? "ol" : "ul";
      return (
        <>
          {block.intro && <p className={`${styles.listIntro} body-copy`}>{block.intro}</p>}
          <List className={`${styles.list} body-copy`} data-ordered={block.ordered || undefined} data-reveal="list">
            {block.items.map((item, i) => (
              <li key={i} style={{ "--i": i } as CSSProperties}>
                <Item item={item} />
              </li>
            ))}
          </List>
        </>
      );
    }
    case "quote":
      return <PullQuote text={block.text} attribution={block.attribution} />;
    default:
      return null;
  }
}

/** At most one per page: a <blockquote> with its attribution. Its rule draws, then it fades in. */
export function PullQuote({ text, attribution }: { text: string; attribution: string }) {
  return (
    <figure className={styles.quote} data-reveal="quote">
      <blockquote>
        <p className="body-copy italic">{text}</p>
      </blockquote>
      <figcaption className="hud-label">— {attribution}</figcaption>
    </figure>
  );
}

/** The page's one key insight: an aside on the sheet colour with a visible label; it unfolds like a map sheet. */
export function KeyInsight({ text }: { text: string }) {
  const id = useId();
  return (
    <aside className={`${styles.insight} surface-copy`} aria-labelledby={id} data-reveal="sheet" data-fold="left">
      <p id={id} className={styles.insightLabel}>
        {L.keyInsight}
      </p>
      <p className={styles.insightText}>{text}</p>
    </aside>
  );
}

/**
 * A decision: an h3 "Decision n — question", the options as a real table (a contour marker draws
 * beside the chosen option as it scrolls into view), then chose / cost / mitigation.
 */
export function DecisionBlock({ decision: d, number }: { decision: Decision; number: number }) {
  const id = useId();
  return (
    <div className={`${styles.decision} legend`} id={d.id}>
      <SettleText as="h3" text={`${L.decision(number)} — ${d.title}`} mode="block" wrap role="text" trigger="inview" className={styles.decisionTitle} />
      {d.text?.map((t, i) => (
        <p key={i} className="body-copy">
          {t}
        </p>
      ))}
      {d.options && (
        // Scrolls sideways inside its panel on phones; focusable so the keyboard can scroll it.
        <div className={`${styles.tableScroll} knockout`} role="region" aria-labelledby={`${id}caption`} tabIndex={0}>
          <table className={styles.table}>
            <caption id={`${id}caption`}>{d.options.caption}</caption>
            <thead>
              <tr>
                {d.options.columns.map((c) => (
                  <th key={c} scope="col">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.options.rows.map((r) => (
                <tr key={r.option} data-chosen={r.chosen || undefined}>
                  <th scope="row">
                    {/* The chosen option: a contour marker draws down beside it. */}
                    {r.chosen && (
                      <svg className={styles.chosenMark} viewBox="0 0 6 100" preserveAspectRatio="none" aria-hidden="true" data-reveal="mark">
                        <path pathLength={1} d="M3 0C1 20 5 38 3 50S1 80 3 100" />
                      </svg>
                    )}
                    {r.option}
                    {r.chosen && <span className={`${styles.chosen} hud-label`}>{L.chosen}</span>}
                  </th>
                  <td>{r.pro}</td>
                  <td>{r.con}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <dl className={`${styles.verdict} body-copy`}>
        <div data-term="chose">
          <dt className="hud-label">{L.chose}</dt>
          <dd>{d.chose}</dd>
        </div>
        <div>
          <dt className="hud-label">{L.cost}</dt>
          <dd>{d.cost}</dd>
        </div>
        <div>
          <dt className="hud-label">{L.mitigation}</dt>
          <dd>{d.mitigation}</dd>
        </div>
      </dl>
      {d.after && <p className="body-copy">{d.after}</p>}
    </div>
  );
}

type Metrics = Extract<Block, { kind: "metrics" }>;
type Outcomes = Extract<Block, { kind: "outcomes" }>;

/** Metric tiles: the value (its number rolls once from a nearby one), what it measures, and how it was obtained. */
export function MetricTiles({ block }: { block: Metrics }) {
  return (
    <ul className={styles.metrics} aria-label={block.label}>
      {block.items.map((m) => (
        <li key={m.label} className={`${styles.metric} surface-copy`}>
          <RollValue value={m.value} only="last" className={styles.metricValue} />
          <span className={styles.metricLabel}>{m.label}</span>
          {m.detail && <span className={styles.metricDetail}>{m.detail}</span>}
          <EvidenceBadge kind={m.evidence} />
        </li>
      ))}
    </ul>
  );
}

/** Outcome table with evidence badges and the legend that explains them. */
export function OutcomeTable({ block, kinds }: { block: Outcomes; kinds: Evidence[] }) {
  const id = useId();
  return (
    <div className={`${styles.outcomes} legend`}>
      <div className={`${styles.tableScroll} knockout`} role="region" aria-labelledby={`${id}caption`} tabIndex={0}>
        <table className={styles.table}>
          <caption id={`${id}caption`}>{block.caption}</caption>
          <thead>
            <tr>
              {L.outcomeColumns.map((c) => (
                <th key={c} scope="col">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((r) => (
              <tr key={r.metric}>
                <th scope="row">{r.metric}</th>
                <td>{r.before}</td>
                <td className={styles.after}>{r.after}</td>
                <td>
                  <EvidenceBadge kind={r.evidence} />
                  {r.note && <span className={styles.note}>{r.note}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <EvidenceLegend kinds={kinds} notes={block.legend} />
    </div>
  );
}

/**
 * "Label — finding": the line leads. A contour rule draws, the label settles in mono, then the
 * finding settles as one block a moment later; headings take turns and snap while the reader
 * scrolls fast (SettleText channel "heading").
 */
function Heading({ waypoint: w, index }: { waypoint: Waypoint; index: number }) {
  const finding = w.finding ? `${w.finding[0].toUpperCase()}${w.finding.slice(1)}` : null;
  return (
    <>
      <ContourRule className={styles.headingRule} />
      <h2 id={`${w.id}-heading`} className={styles.heading}>
        <span className={`${styles.headingLabel} hud-label`}>
          <span aria-hidden="true">{String(index + 1).padStart(2, "0")} · </span>
          <SettleText as="span" text={finding ? `${w.label} —` : w.label} mode="chars" role="mono" trigger="inview" className={styles.headingLabelText} />
        </span>{" "}
        {finding && (
          <SettleText as="span" text={finding} mode="block" wrap role="text" trigger="inview" delay={duration.short} channel="heading" className={styles.headingFinding} />
        )}
      </h2>
    </>
  );
}

/**
 * The waypoints of a case study: headings that state the finding ("Label — finding"), running
 * text on legend panels, and figures, decisions, tiles and tables between them. Below 1200 px
 * each ends with "Next waypoint ↓ / Back to top ↑".
 */
export function Waypoints({ study, evidence }: { study: CaseStudy; evidence: Evidence[] }) {
  const numbers = figureNumbers(study);
  const decisions = decisionNumbers(study);
  const figures = study.figures ?? {};
  return (
    <>
      {study.waypoints.map((w, index) => {
        const next = study.waypoints[index + 1];
        const parts = groups(w.blocks);
        const heading = <Heading waypoint={w} index={index} />;
        const startsWithText = parts.length > 0 && "text" in parts[0];
        return (
          <section key={w.id} id={w.id} className={styles.waypoint} aria-labelledby={`${w.id}-heading`} data-waypoint>
            {!startsWithText && <div className={`${styles.panel} legend`}>{heading}</div>}
            {parts.map((part, i) => {
              if ("text" in part) {
                return (
                  <div key={i} className={`${styles.panel} legend`}>
                    {i === 0 && heading}
                    {part.text.map((b, j) => (
                      <TextBlock key={j} block={b} />
                    ))}
                  </div>
                );
              }
              const b = part.block;
              switch (b.kind) {
                case "figure": {
                  const spec = figures[b.id];
                  if (!spec) throw new Error(`Figure "${b.id}" is not defined in the case study's figures.`);
                  return <Figure key={i} spec={spec} images={study.images ?? {}} assets={study.assets ?? {}} number={numbers.get(b.id)} />;
                }
                case "insight":
                  return <KeyInsight key={i} text={b.text} />;
                case "decision":
                  return <DecisionBlock key={i} decision={b} number={decisions.get(b.id)!} />;
                case "metrics":
                  return <MetricTiles key={i} block={b} />;
                case "outcomes":
                  return <OutcomeTable key={i} block={b} kinds={evidence} />;
                default:
                  return null;
              }
            })}
            {!next && (
              <div className={`${styles.panel} legend`}>
                <p className="body-copy">
                  <strong>{L.didNotDo}: </strong>
                  {study.didNotDo}
                </p>
                <p className={`${styles.credits} body-copy`}>{study.credits}</p>
              </div>
            )}
            <p className={styles.foot}>
              {next && (
                <SignatureLink
                  href={`#${next.id}`}
                  variant="standalone"
                  role="mono"
                  label={L.nextWaypoint}
                  arrow="↓"
                  aria-label={`${L.nextWaypoint}: ${next.nav}`}
                  className={`${styles.footLink} hud-label`}
                />
              )}
              <SignatureLink href="#main" variant="standalone" role="mono" label={L.backToTop} arrow="↑" className={`${styles.footLink} hud-label`} />
            </p>
          </section>
        );
      })}
    </>
  );
}
