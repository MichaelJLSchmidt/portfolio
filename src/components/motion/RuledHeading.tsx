import { duration } from "@/styles/tokens";
import { ContourRule } from "./ContourRule";
import { SettleText, type SettleTrigger } from "./SettleText";

/**
 * A ruled heading: the line leads. A contour rule draws as the heading scrolls into view, and the
 * heading settles a moment later (--dur-short) as one block, every letter in its rest-width box,
 * so line breaks never change (SettleText mode="block" wrap). Headings take turns (channel
 * "heading": one settle at a time, snapping while the reader scrolls fast). In the first viewport
 * and in still mode both are simply there. For section and waypoint headings (H2).
 */
export function RuledHeading({
  as = "h2",
  id,
  text,
  className,
  ruleClassName,
  role = "display",
  trigger = "inview",
  glint = false,
}: {
  as?: "h2" | "h3";
  id?: string;
  text: string;
  className?: string;
  ruleClassName?: string;
  /** display (default: the display cut, letter boxes at their measured widths) or label. */
  role?: "display" | "label";
  trigger?: SettleTrigger;
  /** One glint after its first settle this session (the page's last signature: the contact band). */
  glint?: boolean;
}) {
  return (
    <>
      <ContourRule className={ruleClassName} />
      <SettleText
        as={as}
        id={id}
        text={text}
        mode="block"
        wrap
        role={role}
        widths={role === "display" ? "display" : undefined}
        trigger={trigger}
        delay={duration.short}
        channel="heading"
        glint={glint}
        className={className}
      />
    </>
  );
}
