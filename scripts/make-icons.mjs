/**
 * Vygeneruje PWA ikony (PNG) bez externých závislostí – minimálny PNG encoder cez zlib.
 * Motív: kettlebell na tmavom podklade. Spúšťa sa cez `npm run icons` alebo pred buildom.
 */
import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')

const BG = [11, 17, 32]
const BELL = [56, 189, 248]
const RING = [232, 238, 252]

function crc32(buf) {
  let c
  const table = []
  for (let n = 0; n < 256; n++) {
    c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  let crc = 0xffffffff
  for (const b of buf) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const typeBuf = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])))
  return Buffer.concat([len, typeBuf, data, crc])
}

function png(width, height, rgb) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // truecolor
  const raw = Buffer.alloc((width * 3 + 1) * height)
  let p = 0
  for (let y = 0; y < height; y++) {
    raw[p++] = 0 // filter: none
    for (let x = 0; x < width; x++) {
      const [r, g, b] = rgb(x, y)
      raw[p++] = r
      raw[p++] = g
      raw[p++] = b
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/** Kettlebell: zvon (kruh + krčok) a rúčka (oblúk). Súradnice v podiele veľkosti. */
function kettlebell(size) {
  const s = size
  const bellCx = 0.5 * s
  const bellCy = 0.655 * s
  const bellR = 0.275 * s
  const neckTop = 0.44 * s
  const neckHalf = 0.115 * s
  const ringCx = 0.5 * s
  const ringCy = 0.40 * s
  const ringOuter = 0.225 * s
  const ringInner = 0.145 * s
  const radius = 0.18 * s // zaoblenie podkladu

  return (x, y) => {
    const px = x + 0.5
    const py = y + 0.5
    // zaoblený štvorec podkladu
    const cx = Math.min(Math.max(px, radius), s - radius)
    const cy = Math.min(Math.max(py, radius), s - radius)
    if (Math.hypot(px - cx, py - cy) > radius) return [0, 0, 0]

    const dBell = Math.hypot(px - bellCx, py - bellCy)
    const inNeck = py >= neckTop && py <= bellCy && Math.abs(px - bellCx) <= neckHalf
    if (dBell <= bellR || inNeck) return BELL

    const dRing = Math.hypot(px - ringCx, py - ringCy)
    if (dRing <= ringOuter && dRing >= ringInner && py <= ringCy + 0.03 * s) return RING

    return BG
  }
}

for (const size of [192, 512]) {
  writeFileSync(join(OUT, `pwa-${size}x${size}.png`), png(size, size, kettlebell(size)))
}
writeFileSync(join(OUT, 'apple-touch-icon.png'), png(180, 180, kettlebell(180)))

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="12" fill="#0b1120"/>
  <path d="M32 12a12 12 0 0 0-12 12h5a7 7 0 0 1 14 0h5a12 12 0 0 0-12-12z" fill="#e8eefc"/>
  <circle cx="32" cy="42" r="17" fill="#38bdf8"/>
  <rect x="25" y="26" width="14" height="12" fill="#38bdf8"/>
</svg>
`
writeFileSync(join(OUT, 'favicon.svg'), svg)
console.log('Ikony vygenerované do public/: pwa-192x192.png, pwa-512x512.png, apple-touch-icon.png, favicon.svg')
