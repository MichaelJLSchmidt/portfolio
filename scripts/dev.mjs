// `npm run dev`: Next.js dev server plus a tiny local endpoint the dev-only tuning panel
// uses to persist values into src/config/contour-field.json. Works on Windows, macOS, Linux.
import { spawn, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const configFile = join(root, "src/config/contour-field.json");
const PORT = 4319;

createServer((req, res) => {
  const origin = req.headers.origin ?? "";
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    res.setHeader("access-control-allow-origin", origin);
    res.setHeader("access-control-allow-methods", "POST, OPTIONS");
    res.setHeader("access-control-allow-headers", "content-type");
  }
  if (req.method === "OPTIONS") return res.writeHead(204).end();
  if (req.method !== "POST" || req.url !== "/contour-field") return res.writeHead(404).end();
  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", () => {
    try {
      const incoming = JSON.parse(body);
      const current = JSON.parse(readFileSync(configFile, "utf8"));
      // Only keys that already exist are accepted, so the file keeps its shape.
      const next = Object.fromEntries(Object.keys(current).map((k) => [k, k in incoming ? incoming[k] : current[k]]));
      writeFileSync(configFile, `${JSON.stringify(next, null, 2)}\n`);
      console.log("[tuning] wrote src/config/contour-field.json");
      res.writeHead(200, { "content-type": "application/json" }).end('{"ok":true}');
    } catch (error) {
      res.writeHead(400).end(String(error));
    }
  });
})
  .listen(PORT, "127.0.0.1", () => console.log(`[tuning] save endpoint on http://localhost:${PORT}`))
  .on("error", (e) => console.warn(`[tuning] endpoint disabled: ${e.message}`));

// Display titles' width compensation and the footer wordmark, from the current copy (npm run
// titles, npm run wordmark).
for (const script of ["measure-titles.mjs", "wordmark.mjs"]) spawnSync(process.execPath, [join(root, "scripts", script)], { stdio: "inherit", cwd: root });

const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");
const child = spawn(process.execPath, [nextBin, "dev", ...process.argv.slice(2)], { stdio: "inherit", cwd: root });
child.on("exit", (code) => process.exit(code ?? 0));
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
