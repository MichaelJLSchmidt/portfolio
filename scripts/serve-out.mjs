// Serves the static export in ./out the way a static host does, including the base path.
// Usage: node scripts/serve-out.mjs [--port 3000] [--dir out]   (reads NEXT_PUBLIC_BASE_PATH)
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { createGzip } from "node:zlib";

const dirArg = process.argv.indexOf("--dir");
const root = resolve(dirArg > -1 ? process.argv[dirArg + 1] : "out");
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
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
};

const compressible = new Set([".html", ".js", ".css", ".json", ".txt", ".svg"]);

// Gzip text like static hosts (Netlify included) do, so local measurements are realistic.
function send(res, status, file, req) {
  const headers = { "content-type": types[extname(file)] || "application/octet-stream" };
  const gzip = compressible.has(extname(file)) && /\bgzip\b/.test(req.headers["accept-encoding"] || "");
  if (gzip) headers["content-encoding"] = "gzip";
  res.writeHead(status, headers);
  if (req.method === "HEAD") return res.end();
  const stream = createReadStream(file);
  (gzip ? stream.pipe(createGzip()) : stream).pipe(res);
}

createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  let path = decodeURIComponent(url.pathname);
  if (base && !path.startsWith(`${base}/`) && path !== base) return send(res, 404, join(root, "404.html"), req);
  path = path.slice(base.length) || "/";
  const file = normalize(join(root, path));
  if (!file.startsWith(root)) return send(res, 404, join(root, "404.html"), req);
  if (existsSync(file) && statSync(file).isDirectory()) {
    if (!path.endsWith("/")) {
      res.writeHead(301, { location: `${base}${path}/` });
      return res.end();
    }
    const index = join(file, "index.html");
    if (existsSync(index)) return send(res, 200, index, req);
  }
  if (existsSync(file) && statSync(file).isFile()) return send(res, 200, file, req);
  return send(res, 404, join(root, "404.html"), req);
}).listen(port, () => console.log(`Serving ./out at http://localhost:${port}${base}/`));
