/**
 * Dev-time image pipeline (sprint §2).
 * assets/shots/*.png  ->  public/shots/{name}-1600.webp (w1600 q78)
 *                         public/shots/{name}-800.webp  (w800  q75)
 * plus public/og.jpg: 1200x630 center-crop of 04-board-kanban-dark.png.
 * Every WebP must be <= 400 KB — quality steps down automatically if needed.
 */
import { readdir, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const SRC = path.join(ROOT, 'assets', 'shots');
const OUT = path.join(ROOT, 'public', 'shots');
const MAX_BYTES = 400 * 1024;

async function toWebp(srcFile, outFile, width, quality) {
  let q = quality;
  for (;;) {
    await sharp(srcFile).resize({ width, withoutEnlargement: true }).webp({ quality: q, effort: 5 }).toFile(outFile);
    const { size } = await stat(outFile);
    if (size <= MAX_BYTES || q <= 40) {
      if (size > MAX_BYTES) console.warn(`  WARN ${path.basename(outFile)} still ${(size / 1024).toFixed(0)} KB at q${q}`);
      return { size, q };
    }
    q -= 8;
  }
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const files = (await readdir(SRC)).filter((f) => f.toLowerCase().endsWith('.png'));
  if (!files.length) throw new Error(`No PNGs found in ${SRC}`);

  for (const f of files) {
    const name = path.basename(f, '.png');
    const src = path.join(SRC, f);
    const big = await toWebp(src, path.join(OUT, `${name}-1600.webp`), 1600, 78);
    const small = await toWebp(src, path.join(OUT, `${name}-800.webp`), 800, 75);
    console.log(
      `${name}: 1600w ${(big.size / 1024).toFixed(0)} KB (q${big.q}) | 800w ${(small.size / 1024).toFixed(0)} KB (q${small.q})`
    );
  }

  // OG image: 1200x630 center-crop of the kanban board (dark).
  const ogSrc = path.join(SRC, '04-board-kanban-dark.png');
  await sharp(ogSrc)
    .resize(1200, 630, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(path.join(ROOT, 'public', 'og.jpg'));
  const og = await stat(path.join(ROOT, 'public', 'og.jpg'));
  console.log(`og.jpg: ${(og.size / 1024).toFixed(0)} KB`);
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
