/**
 * Numbers as Swiss German writes them (4’158 m), produced the same way on the server and in every
 * browser. Intl.NumberFormat("de-CH") is not: Node's ICU and Chromium's disagree on the grouping
 * separator, and a server-rendered number that differs from the client's breaks hydration
 * (React error #418, which also drops the motion attributes on <html>).
 */
const GROUP = "’";

/** A whole number with the Swiss grouping apostrophe: 4158 → "4’158", -12500 → "-12’500". */
export function formatInteger(value: number): string {
  const n = Math.round(value);
  const digits = String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, GROUP);
  return n < 0 ? `-${digits}` : digits;
}
