// A minimal ZIP reader (stored and deflated entries) on Node's zlib, so scripts read swisstopo's
// zipped downloads the same way on Windows, macOS and Linux, without an unzip binary.
import { inflateRawSync } from "node:zlib";

/** The entries of a ZIP archive: { name, read() → Buffer }. */
export function zipEntries(buf) {
  // The end-of-central-directory record: the last 22 bytes, or before a trailing comment.
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("Not a ZIP archive (no end of central directory).");
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const entries = [];
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error("Corrupt ZIP central directory.");
    const method = buf.readUInt16LE(p + 10);
    const compressed = buf.readUInt32LE(p + 20);
    const nameLength = buf.readUInt16LE(p + 28);
    const extraLength = buf.readUInt16LE(p + 30);
    const commentLength = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.subarray(p + 46, p + 46 + nameLength).toString("utf8");
    entries.push({
      name,
      read() {
        const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
        const data = buf.subarray(start, start + compressed);
        if (method === 0) return Buffer.from(data);
        if (method === 8) return inflateRawSync(data);
        throw new Error(`${name}: unsupported ZIP compression method ${method}.`);
      },
    });
    p += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}
