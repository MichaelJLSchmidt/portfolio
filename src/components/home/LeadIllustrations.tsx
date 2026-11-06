import type { ReactNode } from "react";
import styles from "./Home.module.css";

/**
 * The four "How I lead" illustrations: monoline drawings (1.5 px, non-scaling, in the contour
 * colour; route red only where a line is the route), a few dozen paths each, inlined and hidden
 * from screen readers (the principle's text says what they show). Every path has pathLength 1, so
 * the stylesheet can draw it on with the scroll in full motion (Home.module.css). Each is a
 * waypoint of the page's red route, which passes behind it (RouteLayer).
 */
const route = (d: string) => <path className={styles.illoRoute} d={d} pathLength={1} />;
const line = (d: string) => <path d={d} pathLength={1} />;

const drawings: Record<string, ReactNode> = {
  /** A boulder moved off the path, and a figure stepping aside to let others pass. */
  path: (
    <>
      {route("M8 150C48 142 82 132 112 120S176 92 232 70")}
      {line("M36 74 46 54 66 46 86 52 94 70 82 84 56 86Z")}
      {line("M52 62 60 70M70 56 74 66")}
      {line("M98 74C106 68 114 68 120 72")}
      {line("M114 66 121 72 113 77")}
      {line("M30 92H100")}
      <circle cx="166" cy="70" r="7" pathLength={1} />
      {line("M166 77V104")}
      {line("M166 86 154 96M166 86 178 92")}
      {line("M166 104 156 124M166 104 184 116 192 112")}
      {line("M196 118C204 112 210 112 216 116")}
    </>
  ),
  /** Three climbers roped together on a ridge. */
  rope: (
    <>
      {route("M4 140 50 104 84 116 132 70 178 88 236 60")}
      {[
        [56, 104],
        [126, 76],
        [190, 82],
      ].map(([x, y]) => (
        <g key={x}>
          <circle cx={x} cy={y - 34} r="6" pathLength={1} />
          {line(`M${x} ${y - 28}V${y - 8}`)}
          {line(`M${x} ${y - 22}l-9 8M${x} ${y - 22}l10 6`)}
          {line(`M${x} ${y - 8}l-7 ${8}M${x} ${y - 8}l7 ${8}`)}
        </g>
      ))}
      {line("M56 84C76 100 104 66 126 58")}
      {line("M126 58C146 70 168 50 190 64")}
      {line("M200 34l6-10 6 10")}
    </>
  ),
  /** A height profile with an altimeter's ticks: measure the climb before changing it. */
  profile: (
    <>
      {line("M28 20V148H232")}
      {[36, 60, 84, 108, 132].map((y, i) => (
        <path key={y} d={`M28 ${y}h${i % 2 ? 6 : 12}`} pathLength={1} />
      ))}
      {route("M28 140C60 136 76 120 98 112S140 84 164 68 206 44 232 36")}
      {line("M98 112V148M164 68V148")}
      <circle cx="98" cy="112" r="4" pathLength={1} />
      <circle cx="164" cy="68" r="4" pathLength={1} />
      {line("M98 100h-12M164 56h-12")}
      {line("M44 20h16M44 28h10")}
    </>
  ),
  /** A hand painting a white-red-white trail blaze on a rock. */
  blaze: (
    <>
      {line("M20 150 34 40 92 18 168 26 214 70 222 150")}
      {line("M58 70H122V112H58Z")}
      {line("M58 84H122M58 98H122")}
      <path className={styles.illoBlaze} d="M58 84H122V98H58Z" pathLength={1} />
      {line("M150 98 128 92")}
      {line("M150 98C162 92 176 96 184 108L196 134")}
      {line("M156 106C168 104 176 110 180 120")}
      {line("M150 98 160 116 172 140")}
      {line("M122 90 132 88 136 96 126 98Z")}
    </>
  ),
};

export function LeadIllustration({ name }: { name: string }) {
  const drawing = drawings[name];
  if (!drawing) return null;
  return (
    <svg className={styles.illo} viewBox="0 0 240 160" aria-hidden="true" focusable="false" data-route={`lead-${name}`} data-route-anchor="center">
      {drawing}
    </svg>
  );
}
