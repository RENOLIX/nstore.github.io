// Prépare les photos des tuiles de catégories : une version PC et une version téléphone.
// Usage : node tools/make-tiles.mjs <clubs> <selections> <promos>   (chemins des trois photos)
import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const out = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'img');
const [clubs, selections, promos] = process.argv.slice(2);
const jobs = { 'cat-clubs': clubs, 'cat-selections': selections, 'cat-promos': promos };

for (const [name, src] of Object.entries(jobs)) {
  const meta = await sharp(src).metadata();
  const small = meta.width < 800; // petite photo : agrandie puis légèrement accentuée
  const make = (w, h, file) => {
    let img = sharp(src).resize({ width: w, height: h, fit: 'cover', position: 'top', kernel: 'lanczos3' });
    if (small) img = img.sharpen({ sigma: 0.8 });
    return img.modulate({ saturation: 1.04 }).jpeg({ quality: 86, mozjpeg: true }).toFile(path.join(out, file));
  };
  await make(900, 1010, `${name}-desktop.jpg`);  // tuile PC, format portrait
  await make(800, 740, `${name}-mobile.jpg`);    // tuile téléphone, presque carrée
  console.log(name, `${meta.width}x${meta.height}`, small ? '(agrandie)' : '');
}
