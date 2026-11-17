// Prépare le logo NStore Football à partir de l'image fournie (fond blanc).
// Usage : node tools/make-logo.mjs <logo.png|webp|jpg>
// Produit dans public/img :
//   logo-mark(-light).webp  le N couronné
//   logo-word(-light).webp  « NSTORE FOOTBALL »
//   logo-full.webp          le logo complet, empilé
// et public/favicon.png + public/apple-touch-icon.png.
// « -light » = version pour fond sombre : le noir devient blanc, le rouge reste rouge.
import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = (f) => path.join(root, 'public', f);
const src = process.argv[2];

const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height;

// Retire le fond blanc : l'opacité dépend de l'écart au blanc, puis on « dé-mélange » la couleur
// pour garder des bords nets sans liseré blanc.
function cutout(light) {
  const rgba = Buffer.alloc(W * H * 4);
  for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const min = Math.min(r, g, b);
    let a = Math.max(0, Math.min(1, (255 - min - 6) / (255 - 6))); // les gris très clairs du fond deviennent transparents
    if (a <= 0) { rgba[j + 3] = 0; continue; }
    const un = (c) => Math.max(0, Math.min(255, Math.round((c - 255 * (1 - a)) / a)));
    let R = un(r), G = un(g), B = un(b);
    const neutral = Math.max(R, G, B) - Math.min(R, G, B) < 70; // noir et gris (pas le rouge)
    if (light && neutral) { R = G = B = 255; }
    rgba[j] = R; rgba[j + 1] = G; rgba[j + 2] = B; rgba[j + 3] = Math.round(a * 255);
  }
  return sharp(rgba, { raw: { width: W, height: H, channels: 4 } });
}

// Zones mesurées sur l'image d'origine (1536 × 1024)
const pad = 8;
const box = (x0, y0, x1, y1) => ({ left: x0 - pad, top: y0 - pad, width: x1 - x0 + 1 + 2 * pad, height: y1 - y0 + 1 + 2 * pad });
const MARK = box(460, 94, 1071, 574);
const WORD = box(151, 625, 1384, 832);
const FULL = box(151, 94, 1384, 832);

const save = async (img, region, size, file) => {
  const buf = await img.clone().extract(region).png().toBuffer();
  await sharp(buf).resize(size).webp({ quality: 92, alphaQuality: 100, effort: 6 }).toFile(out('img/' + file));
};

for (const light of [false, true]) {
  const img = cutout(light);
  const sfx = light ? '-light' : '';
  await save(img, MARK, { height: 200 }, `logo-mark${sfx}.webp`);
  await save(img, WORD, { height: 120 }, `logo-word${sfx}.webp`);
  if (!light) await save(img, FULL, { width: 720 }, 'logo-full.webp');
}

// Icônes : N couronné sur fond blanc arrondi, lisible sur les onglets clairs comme sombres
const markPng = await cutout(false).extract(MARK).png().toBuffer();
async function icon(size, file, radius) {
  const inner = Math.round(size * 0.78);
  const mark = await sharp(markPng).resize({ width: inner, height: inner, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  const bg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" fill="#ffffff"/></svg>`);
  await sharp(bg).composite([{ input: mark, gravity: 'center' }]).png().toFile(out(file));
}
await icon(64, 'favicon.png', 14);
await icon(180, 'apple-touch-icon.png', 0);
console.log('ok');
