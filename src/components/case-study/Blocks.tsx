import { useId } from "react";
import { caseStudyLabels as L } from "@/content/case-study-labels";
import type { Block, CaseStudy, ListItem } from "@/lib/case-study";
import { Figure } from "./Figure";
import styles from "./Blocks.module.css";

const Item = ({ item }: { item: ListItem }) =>
  typeof item === "string" ? (
    <>{item}</>
  ) : (
    <>
      <strong>{item.lead}</strong> {item.text}
    </>
  );

/** A paragraph and its side note: in the margin on wide screens, an inline mono block below it on phones. */
function Paragraph({ block, note }: { block: Extract<Block, { kind: "p" }>; note?: number }) {
  return (
    <div className={styles.paragraph}>
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
        <aside className={`${styles.note} mono`} aria-label={L.sideNote(note)} data-quiet-zone>
          <span aria-hidden="true">{note}</span>
          <span>{block.note}</span>
        </aside>
      )}
    </div>
  );
}

function List({ block }: { block: Extract<Block, { kind: "list" }> }) {
  const Tag = block.ordered ? "ol" : "ul";
  return (
    <div className={styles.listBlock}>
      {block.intro && <p className="body-copy">{block.intro}</p>}
      <Tag className={`${styles.list} body-copy`} data-ordered={block.ordered || undefined}>
        {block.items.map((item, i) => (
          <li key={i}>
            <Item item={item} />
          </li>
        ))}
      </Tag>
    </div>
  );
}

/** The page's one key insight: an aside with a visible label. */
function KeyInsight({ text }: { text: string }) {
  const id = useId();
  return (
    <aside className={styles.insight} aria-labelledby={id} data-quiet-zone>
      <p id={id} className={`${styles.insightLabel} mono`}>
        {L.keyInsight}
      </p>
      <p className={styles.insightText}>{text}</p>
    </aside>
  );
}

export type Numbers = { figures: Map<string, number>; notes: Map<Block, number> };

/**
 * A run of a case study's blocks (paragraphs with side notes, lists, figures, the key insight), in
 * a chapter's flow: each block is a direct child that the chapter places on its grid (`data-block`:
 * text at the reading measure, figures by their size). Decisions are the pinned decision's.
 * `reveal`: blocks rise into view once (never on the sheet's bands).
 */
export function Blocks({ blocks, study, numbers, reveal = true }: { blocks: Block[]; study: CaseStudy; numbers: Numbers; reveal?: boolean }) {
  return (
    <>
      {blocks.map((b, i) => {
        const r = reveal ? "" : undefined;
        switch (b.kind) {
          case "p":
            return (
              <div key={i} data-block="text" data-reveal={r}>
                <Paragraph block={b} note={numbers.notes.get(b)} />
              </div>
            );
          case "list":
            return (
              <div key={i} data-block="text" data-reveal={r}>
                <List block={b} />
              </div>
            );
          case "insight":
            return (
              <div key={i} data-block="text" data-reveal={r}>
                <KeyInsight text={b.text} />
              </div>
            );
          case "figure": {
            const spec = study.figures?.[b.id];
            if (!spec) throw new Error(`Figure "${b.id}" is not defined in the case study's figures.`);
            return (
              <div key={i} data-block={spec.size === "wide" ? "wide" : "figure"}>
                <Figure spec={spec} images={study.images ?? {}} assets={study.assets ?? {}} number={numbers.figures.get(b.id)} />
              </div>
            );
          }
          default:
            return null;
        }
      })}
    </>
  );
}
