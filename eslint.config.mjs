import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // A static export with images.unoptimized: next/image would add nothing, and the plates and
    // portraits are plain <img> elements on purpose (fixed sizes, decode on hover).
    rules: { "@next/next/no-img-element": "off" },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "scripts/terrain/.cache/**", ".name-swap/**"]),
]);
