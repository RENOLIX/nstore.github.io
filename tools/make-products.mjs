// Photos produit (face + dos) aux formats du site : PC 1170 x 1090 et téléphone 640 x 596, en JPEG.
// Usage : node tools/make-products.mjs <dossier source> <nom>=<face.jpg>,<dos.jpg> ...
//   ex. node tools/make-products.mjs ./photos algerie-exterieur=32.jpg,31.jpg
// Sortie : public/img/<nom>-desktop.jpg, <nom>-mobile.jpg, <nom>-dos-desktop.jpg, <nom>-dos-mobile.jpg
import path from 'node:path';
import sharp from 'sharp';

const [src, ...pairs] = process.argv.slice(2);
if (!src || !pairs.length) throw new Error('Usage : node tools/make-products.mjs <dossier> <nom>=<face>,<dos> ...');
const out = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..', 'public', 'img');
const SIZES = { desktop: [1170, 1090], mobile: [640, 596] };

for (const pair of pairs) {
  const [name, files] = pair.split('=');
  const [front, back] = files.split(',');
  for (const [suffix, file] of [['', front], ['-dos', back]]) {
    for (const [variant, [w, h]] of Object.entries(SIZES)) {
      await sharp(path.join(src, file))
        .resize(w, h, { fit: 'cover', position: 'centre', kernel: 'lanczos3' })
        .jpeg({ quality: variant === 'desktop' ? 84 : 80, mozjpeg: true, progressive: true })
        .toFile(path.join(out, `${name}${suffix}-${variant}.jpg`));
    }
  }
  console.log('ok', name);
}
