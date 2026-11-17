// Prépare les photos des deux tuiles de l'accueil (Homme, Femme), en version PC et téléphone.
// Usage : node tools/make-tiles.mjs <photo homme> <photo femme> [centre horizontal femme en px]
//   Homme : photo portrait, on garde le haut du corps.
//   Femme : photo paysage, recadrée autour du maillot (centre par défaut : 1105 px).
import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const out = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'img');
const [hommeSrc, femmeSrc, cxArg] = process.argv.slice(2);
const R = 1000 / 920; // format des tuiles

async function crop(src, centerX) {
  const m = await sharp(src).metadata();
  if (m.width / m.height < R) { // plus haute que la tuile : on garde le haut
    return sharp(src).extract({ left: 0, top: 0, width: m.width, height: Math.round(m.width / R) }).toBuffer();
  }
  const w = Math.round(m.height * R); // plus large : on centre sur centerX
  const left = Math.max(0, Math.min(m.width - w, Math.round((centerX ?? m.width / 2) - w / 2)));
  return sharp(src).extract({ left, top: 0, width: w, height: m.height }).toBuffer();
}

for (const [name, buf] of [['homme', await crop(hommeSrc)], ['femme', await crop(femmeSrc, Number(cxArg) || 1105)]]) {
  await sharp(buf).resize(1000, 920).jpeg({ quality: 84, mozjpeg: true }).toFile(path.join(out, `cat-${name}-desktop.jpg`));
  await sharp(buf).resize(700, 644).jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(out, `cat-${name}-mobile.jpg`));
  console.log(name, 'ok');
}
