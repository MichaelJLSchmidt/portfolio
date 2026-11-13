"""
About's contour heightmap: public/terrain/field.webp and src/components/background/terrain.ts.

The old password page's posters (public/contour-bg/contours.svg, contours-200.svg) were contoured
with d3-contour from the portfolio repository's region heightmap. This script derives a small
heightmap for the WebGL morph from that repository's 1536 x 1056 master, so the shader's lines
fall where the SVG's do, and bakes the SVG's lake path into the same image:

  R, G   heights packed as h = offset + (R * 65280 + G * 255) * scale  (R, G sampled as 0..1),
         i.e. offset + (R_byte * 256 + G_byte) * scale; offset and scale from the master's
         terrain.json (encoding.offset) and STEP below
  B      lake coverage 0..255, the SVG's lake path rasterised (nonzero, 4 x 4 samples per texel)

Steps: the master (1536 x 1056, 1 m steps) averaged 2 x 2 to 768 x 528, a light Gaussian blur
(SIGMA texels), heights rounded to STEP m. That is the smallest image whose contours still match
the posters (median distance about 0.09 viewBox units, measured at every SVG vertex) under the
150 KB budget. Lossless WebP; the encode is decoded again and compared byte for byte.

Usage (Pillow and numpy):
  python3 scripts/terrain/build-field.py <dir>
    reads <dir>/terrain/heightmap-1536.webp and <dir>/terrain/terrain.json. The master is kept in
    this repository's terrain/ folder (outside public/, never deployed), so from the repository
    root: python3 scripts/terrain/build-field.py .
"""

import hashlib
import io
import json
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SVG = ROOT / "public/contour-bg/contours.svg"
OUT_IMAGE = ROOT / "public/terrain/field.webp"
OUT_TS = ROOT / "src/components/background/terrain.ts"
DOWN = 2  # 1536 x 1056 -> 768 x 528
SIGMA = 0.6  # texels, after downsampling
STEP = 4  # metres per stored unit
SUPER = 4  # lake mask samples per texel and axis
VIEWBOX = (900, 619)


def blur(h, sigma):
    k = int(np.ceil(3 * sigma))
    x = np.arange(-k, k + 1)
    g = np.exp(-x * x / (2 * sigma * sigma))
    g /= g.sum()
    p = np.pad(h, k, mode="edge")
    rows = np.apply_along_axis(lambda r: np.convolve(r, g, "valid"), 1, p)
    return np.apply_along_axis(lambda c: np.convolve(c, g, "valid"), 0, rows)


def svg_paths(path):
    s = path.read_text()
    found = re.findall(r'<path d="([^"]*)"\s+fill="#8FC7E8"', s)
    if len(found) != 1:
        raise SystemExit(f"{path}: expected one lake path")
    return found[0]


def subpaths(d):
    """Absolute moveto, relative linetos, close: the posters' compact path syntax."""
    out = []
    for m in re.finditer(r"M([-\d.]+)[ ,]([-\d.]+)l([^Mm]*)", d):
        x, y = float(m.group(1)), float(m.group(2))
        nums = [float(v) for v in re.findall(r"-?\d*\.?\d+", m.group(3).replace("z", ""))]
        pts = [(x, y)]
        for i in range(0, len(nums) - 1, 2):
            x += nums[i]
            y += nums[i + 1]
            pts.append((x, y))
        out.append(pts)
    return out


def rasterise(polys, w, h, units_per_texel):
    """Nonzero-winding coverage of the polygons (viewBox units) on a w x h texel grid."""
    sw, sh = w * SUPER, h * SUPER
    # sample centres in viewBox units
    xs = (np.arange(sw) + 0.5) / SUPER * units_per_texel
    winding = np.zeros((sh, sw), np.int32)
    for poly in polys:
        pts = poly + [poly[0]]
        for (x0, y0), (x1, y1) in zip(pts[:-1], pts[1:]):
            if y0 == y1:
                continue
            up = y1 > y0
            ya, yb = (y0, y1) if up else (y1, y0)
            # sample rows whose centre lies in [ya, yb)
            r0 = int(np.ceil(ya / units_per_texel * SUPER - 0.5))
            r1 = int(np.ceil(yb / units_per_texel * SUPER - 0.5))
            for r in range(max(r0, 0), min(r1, sh)):
                yc = (r + 0.5) / SUPER * units_per_texel
                xc = x0 + (yc - y0) * (x1 - x0) / (y1 - y0)
                # crossing to the right of a sample: that sample's winding changes
                winding[r, xs < xc] += 1 if up else -1
    inside = (winding != 0).astype(np.float64)
    return inside.reshape(h, SUPER, w, SUPER).mean(axis=(1, 3))


def main():
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    src = Path(sys.argv[1])
    meta = json.loads((src / "terrain/terrain.json").read_text())
    master = next(m for m in meta["heightmaps"] if m["width"] == 1536)
    offset = meta["encoding"]["offset"]
    master_scale = meta["encoding"]["scale"]
    im = np.asarray(Image.open(src / "terrain/heightmap-1536.webp").convert("RGB")).astype(np.float64)
    if im.shape[:2] != (master["height"], master["width"]):
        raise SystemExit("unexpected master size")
    if hashlib.sha256(np.ascontiguousarray(im.astype(np.uint8)).tobytes()).hexdigest() != master["sha256"]:
        raise SystemExit("the master's raster does not match terrain.json's sha256")
    rel = (im[..., 0] * 256 + im[..., 1]) * master_scale  # metres above offset
    H, W = rel.shape
    rel = rel[: H // DOWN * DOWN, : W // DOWN * DOWN].reshape(H // DOWN, DOWN, W // DOWN, DOWN).mean(axis=(1, 3))
    rel = blur(rel, SIGMA)
    h, w = rel.shape
    units = np.clip(np.round(rel / STEP), 0, 65535).astype(np.int64)

    lake = rasterise(subpaths(svg_paths(SVG)), w, h, VIEWBOX[0] / w)

    rgb = np.zeros((h, w, 3), np.uint8)
    rgb[..., 0] = units >> 8
    rgb[..., 1] = units & 255
    rgb[..., 2] = np.round(lake * 255).astype(np.uint8)
    buf = io.BytesIO()
    Image.fromarray(rgb, "RGB").save(buf, "WEBP", lossless=True, quality=100, method=6, exact=True)
    data = buf.getvalue()
    back = np.asarray(Image.open(io.BytesIO(data)).convert("RGB"))
    if not np.array_equal(back, rgb):
        raise SystemExit("lossless WebP round trip changed the heightmap")
    OUT_IMAGE.parent.mkdir(parents=True, exist_ok=True)
    OUT_IMAGE.write_bytes(data)

    probe = []
    for j in range(4):
        for i in range(4):
            x = int((i + 0.5) / 4 * w)
            y = int((j + 0.5) / 4 * h)
            probe.append([x, y, int(rgb[y, x, 0]), int(rgb[y, x, 1]), int(rgb[y, x, 2])])
    # one probe on the lake, so the mask channel is checked too
    ly, lx = np.unravel_index(np.argmax(rgb[..., 2]), (h, w))
    probe.append([int(lx), int(ly), int(rgb[ly, lx, 0]), int(rgb[ly, lx, 1]), int(rgb[ly, lx, 2])])
    probe_ts = ",\n    ".join(f"[{', '.join(map(str, p))}]" for p in probe)
    lo = offset + units.min() * STEP
    hi = offset + units.max() * STEP
    OUT_TS.write_text(
        f"""/*
 * Generated by scripts/terrain/build-field.py: do not edit. About's region heightmap for the
 * contour morph (public/terrain/field.webp, lossless WebP, {len(data)} bytes), derived from the
 * portfolio repository's {W} x {H} master (swissALTIRegio, {meta['attribution']}).
 *
 *   R, G   h = offset + (R * 65280 + G * 255) * scale, R and G sampled as 0..1
 *   B      lake coverage 0..1 (the poster SVG's lake path)
 *
 * The image spans the posters' viewBox ({VIEWBOX[0]} x {VIEWBOX[1]}): texel x covers viewBox
 * units [x, x + 1) * {VIEWBOX[0]} / {w}. `probe` holds reference texels [x, y, R, G, B]: an upload is
 * read back once a session and compared, so a browser that alters the decode skips the morph.
 */
export const terrain = {{
  src: '/terrain/field.webp',
  width: {w},
  height: {h},
  offset: {offset},
  scale: {STEP},
  /** Lowest and highest height in the image (m). */
  range: [{lo:g}, {hi:g}],
  viewBox: [{VIEWBOX[0]}, {VIEWBOX[1]}],
  sha: '{hashlib.sha256(rgb.tobytes()).hexdigest()}',
  probe: [
    {probe_ts},
  ],
}} as const
"""
    )
    print(f"{OUT_IMAGE.relative_to(ROOT)}: {w} x {h}, {len(data)} bytes; lake texels {int((lake > 0.5).sum())}")


if __name__ == "__main__":
    main()
