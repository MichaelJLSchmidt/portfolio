import type { CSSProperties } from "react";
import styles from "./Logbook.module.css";

export type LogbookProps = {
  /** The table's caption: what the log records (visible). */
  caption: string;
  /** Column headings; the first column is the date or year, read as a spot height on the trail. */
  columns: readonly string[];
  /** Newest first. The first cell is the row's header (its date). */
  rows: readonly (readonly string[])[];
  /** Every n-th mark on the trail is heavier, like an index contour (default 5). */
  every?: number;
  className?: string;
  id?: string;
};

/**
 * A logbook: a real table with a caption, its first column standing on a hairline trail as mono
 * spot heights (a tick at each row, every fifth heavier). On phones each row folds onto two
 * lines: the date and the first value, then the rest. The table keeps its semantics in every
 * layout (explicit roles, since the phone layout changes the rows' display). Used for the home
 * page's earlier work and a case study's after-launch log. Nothing moves.
 */
export function Logbook({ caption, columns, rows, every = 5, className, id }: LogbookProps) {
  return (
    <div className={className ? `${styles.wrap} ${className}` : styles.wrap}>
      <table className={styles.table} role="table" id={id}>
        <caption className={`${styles.caption} hud-label`}>{caption}</caption>
        <thead role="rowgroup">
          <tr role="row">
            {columns.map((c) => (
              <th key={c} scope="col" role="columnheader" className="hud-label">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody role="rowgroup">
          {rows.map((cells, i) => (
            <tr key={`${cells[0]}-${i}`} role="row" data-index={(i + 1) % every === 0 ? "" : undefined} style={{ "--i": i } as CSSProperties}>
              <th scope="row" role="rowheader" className={`${styles.mark} hud-label`}>
                {cells[0]}
              </th>
              {cells.slice(1).map((cell, j) => (
                <td key={j} role="cell" data-col={j + 1}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
