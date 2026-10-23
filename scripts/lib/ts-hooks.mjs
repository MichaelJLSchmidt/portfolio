// Lets Node import the app's TypeScript modules as they are written: "@/…" paths,
// extensionless relative imports and JSON imports without an import attribute. Node strips
// the types itself (22.18+); this only resolves and loads. Import it before those modules.
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));

registerHooks({
  resolve(specifier, context, nextResolve) {
    const withTs = (path) => [path, `${path}.ts`, join(path, "index.ts")].find((p) => existsSync(p) && !p.endsWith("/"));
    if (specifier.startsWith("@/")) {
      const file = withTs(join(root, "src", specifier.slice(2)));
      if (file) return nextResolve(pathToFileURL(file).href, context);
    }
    if (specifier.startsWith(".") && context.parentURL?.startsWith("file:") && !/\.[cm]?[jt]sx?$|\.json$/.test(specifier)) {
      const file = withTs(fileURLToPath(new URL(specifier, context.parentURL)));
      if (file) return nextResolve(pathToFileURL(file).href, context);
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    // The app imports JSON the bundler way (no `with { type: "json" }`).
    if (url.startsWith("file:") && url.endsWith(".json") && !context.importAttributes?.type) {
      return { format: "module", source: `export default ${readFileSync(fileURLToPath(url), "utf8")};`, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});
