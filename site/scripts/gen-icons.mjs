// Regenerates the raster icons from the SVG masters. Run from site/:
//   node scripts/gen-icons.mjs   (or: npm run icons)
//
// The initials are on the mark everywhere they can physically render. An ICO
// carries a separate image per size, so the 16px entry drops them (at 16 device
// pixels a letter stroke is well under one pixel and just fogs the nodes) while
// 32 and 48 keep them. The Apple touch icon comes from logo.svg, whose
// proportions are tuned for large display.
//
// resvg (which backs sharp) ignores @media, so both SVGs rasterise to their
// dark defaults — which is what an app icon should be.
import { readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const SRC = 'public/favicon.svg';
const APPLE_SRC = 'public/logo.svg';

/** Sizes that keep the engraved initials, and the one that doesn't. */
const ICO_SIZES = [16, 32, 48];
const MIN_LEGIBLE_INITIALS = 32;

const faviconSvg = await readFile(SRC, 'utf8');
/** Same master with the engraved initials removed, for the 16px entry. */
const faviconPlain = faviconSvg.replace(
  /\n\s*<g\s+class="engrave"[\s\S]*?\n\s*<\/g>\s*(?=\n<\/svg>)/,
  '\n'
);

if (faviconPlain === faviconSvg) {
  throw new Error(
    `Could not strip the .engrave group from ${SRC}. If that group was renamed ` +
      `or reshaped, update the pattern here — otherwise the 16px icon silently ` +
      `keeps unreadable initials.`
  );
}

/** Pack PNG buffers into an ICO container (ICONDIR + ICONDIRENTRY[] + data). */
function buildIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = icon
  header.writeUInt16LE(images.length, 4);

  const entries = [];
  let offset = 6 + images.length * 16;

  for (const { size, data } of images) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0); // 0 means 256
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2); // palette size
    e.writeUInt8(0, 3); // reserved
    e.writeUInt16LE(1, 4); // colour planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    entries.push(e);
    offset += data.length;
  }

  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

const images = [];
for (const size of ICO_SIZES) {
  const withInitials = size >= MIN_LEGIBLE_INITIALS;
  const data = await sharp(Buffer.from(withInitials ? faviconSvg : faviconPlain), {
    density: 1200,
  })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toBuffer();
  images.push({ size, data, withInitials });
}
await writeFile('public/favicon.ico', buildIco(images));
console.log(
  `favicon.ico   ${images
    .map((i) => `${i.size}${i.withInitials ? '+BJA' : ''}`)
    .join('/')} px`
);

// iOS masks to a rounded square and composites over white, so a transparent
// icon would end up in a white tile. The mark is inset on an opaque navy field
// instead, which is what a home-screen icon is supposed to look like.
const APPLE = 180;
const pad = Math.round(APPLE * 0.14);
const mark = await sharp(APPLE_SRC, { density: 1200 })
  .resize(APPLE - pad * 2, APPLE - pad * 2)
  .png()
  .toBuffer();

await sharp({
  create: {
    width: APPLE,
    height: APPLE,
    channels: 4,
    background: { r: 0x05, g: 0x10, b: 0x1c, alpha: 1 }, // #05101C, the bg token
  },
})
  .composite([{ input: mark, left: pad, top: pad }])
  .png({ compressionLevel: 9 })
  .toFile('public/apple-touch-icon.png');
console.log(`apple-touch-icon.png   ${APPLE}x${APPLE}`);
