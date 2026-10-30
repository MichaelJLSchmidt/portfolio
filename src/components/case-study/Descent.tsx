import type { CSSProperties } from "react";
import styles from "./Descent.module.css";

export type Lesson = { lesson: string; nextTime: string };
export type TeamRole = { role: string; count: string; line: string };

/**
 * The descent: what the project taught me beside the team that did it. "Looking back" lists each
 * lesson with what I would do next time; "Team" lists the roles on one rope (a line through
 * their knots, each role a knot with its people's count), so the team reads as roped together.
 * Two columns on desktop, one after the other on phones. Nothing moves.
 */
export function Descent({
  lookingBack,
  team,
}: {
  lookingBack: { heading: string; lessons: readonly Lesson[] };
  team: { heading: string; roles: readonly TeamRole[] };
}) {
  return (
    <div className={styles.descent} data-vt-exit>
      <section className={`${styles.column} legend`} aria-labelledby="looking-back">
        <h2 id="looking-back" className={`${styles.heading} display`}>
          {lookingBack.heading}
        </h2>
        <ol className={styles.lessons}>
          {lookingBack.lessons.map((l) => (
            <li key={l.lesson} className="body-copy">
              <p className={styles.lesson}>{l.lesson}</p>
              <p className={styles.nextTime}>{l.nextTime}</p>
            </li>
          ))}
        </ol>
      </section>
      <section className={`${styles.column} legend`} aria-labelledby="team">
        <h2 id="team" className={`${styles.heading} display`}>
          {team.heading}
        </h2>
        <ul className={styles.rope}>
          {team.roles.map((r, i) => (
            <li key={r.role} style={{ "--i": i } as CSSProperties}>
              <span className={styles.knot} aria-hidden="true" />
              <p className={styles.role}>
                <span className={`${styles.count} hud-label`}>{r.count}</span> {r.role}
              </p>
              <p className={`${styles.line} body-copy`}>{r.line}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
