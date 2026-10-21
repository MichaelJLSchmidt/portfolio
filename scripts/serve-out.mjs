// Serves the static export in ./out the way GitHub Pages does, including the base path.
// Usage: node scripts/serve-out.mjs [--port 3000]   (reads NEXT_PUBLIC_BASE_PATH)
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve("out");
const portArg = process.argv.indexOf("--port");
const port = Number(portArg > -1 ? process.argv[portArg + 1] : process.env.PORT || 3000);
const base = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/+$/, "");

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
};

function send(res, status, file) {
  res.writeHead(status, { "content-type": types[extname(file)] || "application/octet-stream" });
  createReadStream(file).pipe(res);
}

createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  let path = decodeURIComponent(url.pathname);
  if (base && !path.startsWith(`${base}/`) && path !== base) return send(res, 404, join(root, "404.html"));
  path = path.slice(base.length) || "/";
  const file = normalize(join(root, path));
  if (!file.startsWith(root)) return send(res, 404, join(root, "404.html"));
  if (existsSync(file) && statSync(file).isDirectory()) {
    if (!path.endsWith("/")) {
      res.writeHead(301, { location: `${base}${path}/` });
      return res.end();
    }
    const index = join(file, "index.html");
    if (existsSync(index)) return send(res, 200, index);
  }
  if (existsSync(file) && statSync(file).isFile()) return send(res, 200, file);
  return send(res, 404, join(root, "404.html"));
}).listen(port, () => console.log(`Serving ./out at http://localhost:${port}${base}/`));
