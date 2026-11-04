import { color, relief } from "@/styles/tokens";
import type { ReliefMode, ReliefOptions } from "./relief-core";

const rgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.replace("#", ""), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

/** The relief fill's options from the tokens; the gate serialises the same object (holding.mjs). */
export function reliefOptions(mode: ReliefMode, fine: boolean, coordinates: string): ReliefOptions {
  return {
    mode,
    fine,
    colors: { sheet: rgb(color.sheet), glacier: rgb(color.glacier), band: rgb(color.fieldLine) },
    ink: color.text3,
    coordinates,
    dprMax: 2,
    timing: { ...relief },
  };
}
