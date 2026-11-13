// Serves dist/ under BASE_PATH like GitHub Pages does (index.html per folder, 404.html).
// Usage: BASE_PATH=/random/ node scripts/serve-static.mjs [port]
import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'

const root = join(process.cwd(), 'dist')
const base = (process.env.BASE_PATH ?? '/').replace(/\/?$/, '/')
const port = Number(process.argv[2] ?? 4100)
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.bin': 'application/octet-stream',
  '.ico': 'image/x-icon',
}

createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://x')
  if (!url.pathname.startsWith(base)) return send(res, 404, join(root, '404.html'))
  let file = normalize(join(root, decodeURIComponent(url.pathname.slice(base.length))))
  if (!file.startsWith(root)) return send(res, 403)
  if (existsSync(file) && statSync(file).isDirectory()) {
    if (!url.pathname.endsWith('/')) {
      res.writeHead(301, { Location: `${url.pathname}/` })
      return res.end()
    }
    file = join(file, 'index.html')
  }
  if (!existsSync(file) && existsSync(`${file}.html`)) file = `${file}.html`
  if (!existsSync(file)) return send(res, 404, join(root, '404.html'))
  send(res, 200, file)
}).listen(port, () => console.log(`Serving dist/ at http://localhost:${port}${base}`))

function send(res, status, file) {
  if (!file || !existsSync(file)) {
    res.writeHead(status)
    return res.end()
  }
  res.writeHead(status, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' })
  createReadStream(file).pipe(res)
}
