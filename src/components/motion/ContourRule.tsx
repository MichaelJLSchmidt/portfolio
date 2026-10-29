/**
 * Contour rule: a 1 px line that draws from its start as it scrolls into view (once per session;
 * the reveal controller, reveal.ts). In the first viewport and in still mode it is simply there.
 * Decorative by default; `separator` makes it an <hr> for a real thematic break.
 */
export function ContourRule({ className, separator = false }: { className?: string; separator?: boolean }) {
  const props = { className: className ? `contour-rule ${className}` : "contour-rule", "data-reveal": "rule" };
  return separator ? <hr {...props} /> : <div {...props} aria-hidden="true" />;
}
