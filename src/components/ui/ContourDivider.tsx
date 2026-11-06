/**
 * A contour divider: a 1 px hairline with one heavier index tick, like the edge of a map sheet.
 * Static; aria-hidden.
 */
export function ContourDivider({ className }: { className?: string }) {
  return (
    <svg className={className} width="100%" height="9" aria-hidden="true" focusable="false" style={{ display: "block", overflow: "visible" }}>
      <line x1="0" x2="100%" y1="4.5" y2="4.5" stroke="var(--color-line)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <line x1="0" x2="0" y1="0" y2="9" stroke="var(--color-line-index)" strokeWidth="1.5" transform="translate(0.75 0)" />
    </svg>
  );
}
