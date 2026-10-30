import { WeightTitle } from "@/components/type/WeightTitle";
import { ContourRule } from "./ContourRule";

/**
 * A section title: the line leads. A contour rule draws as the title scrolls into view, and the
 * title arrives on its weight (WeightTitle: one element, wght 200 → 800 at a fixed line length,
 * full motion only). In the first viewport and in still mode both are simply there.
 */
export function RuledHeading({
  as = "h2",
  id,
  text,
  className,
  ruleClassName,
  flood,
}: {
  as?: "h2" | "h3";
  id?: string;
  text: string;
  className?: string;
  ruleClassName?: string;
  /** The contour flood on the title (src/content/flood.ts). */
  flood?: boolean;
}) {
  return (
    <>
      <ContourRule className={ruleClassName} />
      <WeightTitle as={as} id={id} text={text} className={className} flood={flood} />
    </>
  );
}
