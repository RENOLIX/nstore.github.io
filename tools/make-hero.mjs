// Prépare les photos du carrousel : une version PC et une version téléphone, même cadrage.
// Usage : node tools/make-hero.mjs <dossier> nom=fichier[:marge] ...
//   marge = pixels ajoutés à gauche (bord prolongé et flouté) pour laisser la place au texte sur PC.
import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const out = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'img');
const [dir, ...jobs] = process.argv.slice(2);

for (const job of jobs) {
  const [name, rest] = job.split('=');
  const [file, extStr] = rest.split(':');
  const ext = Number(extStr || 0);
  const src = path.join(dir, file);
  const { width: w, height: h } = await sharp(src).metadata();

  // téléphone : la photo entière, au format d'origine
  await sharp(src).resize({ width: 1000 }).jpeg({ quality: 84, mozjpeg: true }).toFile(path.join(out, `${name}-mobile.jpg`));

  // PC : même photo, éventuellement prolongée à gauche
  let desktop = sharp(src);
  if (ext > 0) {
    const strip = await sharp(src).extract({ left: 0, top: 0, width: ext, height: h }).flop().blur(18).modulate({ brightness: 0.8 }).toBuffer();
    const base = await sharp(src).toBuffer();
    desktop = sharp({ create: { width: w + ext, height: h, channels: 3, background: '#000' } })
      .composite([{ input: strip, left: 0, top: 0 }, { input: base, left: ext, top: 0 }]);
    desktop = sharp(await desktop.jpeg({ quality: 95 }).toBuffer());
  }
  await desktop.resize({ width: 1920 }).jpeg({ quality: 84, mozjpeg: true }).toFile(path.join(out, `${name}-desktop.jpg`));
  console.log(name, `${w}x${h}`, ext ? `+${ext}px à gauche` : '');
}
