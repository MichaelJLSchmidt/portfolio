// Reads a window of the swisstopo elevation COG with HTTP range requests (geotiff.js),
// so only the tiles covering the region are downloaded. Results are cached on disk.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fromUrl } from "geotiff";

export async function resolveCogUrl({ stacApi, collection, item }) {
  const res = await fetch(`${stacApi}/collections/${collection}/items/${item}`);
  if (!res.ok) throw new Error(`STAC request failed: ${res.status} ${res.statusText}`);
  const feature = await res.json();
  const asset = Object.values(feature.assets).find((a) => String(a.type).includes("geotiff"));
  if (!asset) throw new Error(`No GeoTIFF asset on ${collection}/${item}`);
  return { href: asset.href, updated: feature.properties?.updated ?? feature.properties?.datetime ?? null };
}

/**
 * Reads [minE, minN, maxE, maxN] (LV95 metres) at native resolution.
 * Returns { data: Float32Array (row-major, north-up), width, height, bbox, resolution }.
 */
export async function readWindow({ href, bboxLv95, cacheDir, refresh = false, log = console.log }) {
  mkdirSync(cacheDir, { recursive: true });
  const tiff = await fromUrl(href);
  const image = await tiff.getImage(0);
  const [originX, , , originY] = image.getBoundingBox();
  const [resX] = image.getResolution();
  const [minE, minN, maxE, maxN] = bboxLv95;
  const x0 = Math.floor((minE - originX) / resX);
  const x1 = Math.ceil((maxE - originX) / resX);
  const y0 = Math.floor((originY - maxN) / resX);
  const y1 = Math.ceil((originY - minN) / resX);
  const width = x1 - x0;
  const height = y1 - y0;
  const bbox = [originX + x0 * resX, originY - y1 * resX, originX + x1 * resX, originY - y0 * resX];
  const key = join(cacheDir, `window_${x0}_${y0}_${x1}_${y1}.f32`);

  if (!refresh && existsSync(key)) {
    log(`  cache hit ${key}`);
    const buf = readFileSync(key);
    return { data: new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4), width, height, bbox, resolution: resX };
  }

  log(`  reading ${width}×${height} px window via range requests (this downloads ~100 MB once)…`);
  const started = Date.now();
  const raster = await image.readRasters({ window: [x0, y0, x1, y1], samples: [0], interleave: true });
  const nodata = image.getGDALNoData();
  const data = Float32Array.from(raster, (v) => (v === nodata || !Number.isFinite(v) || v > 1e30 ? NaN : v));
  writeFileSync(key, Buffer.from(data.buffer));
  log(`  done in ${((Date.now() - started) / 1000).toFixed(1)} s, cached at ${key}`);
  return { data, width, height, bbox, resolution: resX };
}
