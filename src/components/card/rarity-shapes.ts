/** The rarity marks' shapes (12×12): rarity is always shape + letter + colour, never colour alone. */
export const rarityShapes: Record<string, string> = {
  circle: "M6 1a5 5 0 1 1 0 10A5 5 0 0 1 6 1Z",
  diamond: "M6 0.5 L11.5 6 L6 11.5 L0.5 6 Z",
  triangle: "M6 0.8 L11.5 10.6 H0.5 Z",
  star: "M6 0 L7.4 4.6 L12 6 L7.4 7.4 L6 12 L4.6 7.4 L0 6 L4.6 4.6 Z",
};
