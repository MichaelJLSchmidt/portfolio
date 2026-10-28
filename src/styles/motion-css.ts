import { spring as springEasing } from "motion";
import { spring, type SpringToken } from "./tokens.ts";

/**
 * The Motion springs as CSS: each spring token becomes `--spring-<name>`, a duration plus a
 * `linear()` easing sampled from Motion's own spring (e.g. `350ms linear(0, 0.28, …, 1)`), so CSS
 * transitions move on the same springs as Motion animations:
 *
 *   transition: transform var(--spring-press);
 *
 * Server-only: the root layout inlines the result, so Motion never reaches a bundle for this.
 */
export function springCss(name: SpringToken): string {
  const s = spring[name];
  const generator =
    "visualDuration" in s ? springEasing(s.visualDuration, s.bounce) : springEasing({ keyframes: [0, 1], ...s });
  return generator.toString();
}

export function springsToCss(): string {
  const vars = (Object.keys(spring) as SpringToken[]).map((k) => `--spring-${k}:${springCss(k)}`);
  return `:root{${vars.join(";")}}`;
}
