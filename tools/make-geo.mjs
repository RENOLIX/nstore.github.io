// Génère src/geo.json : tous les pays (noms en français) et leurs départements / régions / États.
// Source : listes ISO 3166-1 et ISO 3166-2 du projet Debian « iso-codes »
//   https://salsa.debian.org/iso-codes-team/iso-codes/-/tree/main/data
// Usage : node tools/make-geo.mjs <dossier contenant iso_3166-1.json et iso_3166-2.json>
import fs from 'node:fs';
import path from 'node:path';

const dir = process.argv[2];
if (!dir) throw new Error('Usage : node tools/make-geo.mjs <dossier des fichiers iso>');
const read = (f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
const countries = read('iso_3166-1.json')['3166-1'];
const subs = read('iso_3166-2.json')['3166-2'];

const fr = new Intl.DisplayNames(['fr'], { type: 'region' });
const coll = new Intl.Collator('fr', { sensitivity: 'base' });

// Pays : code ISO à deux lettres et nom français
const list = countries
  .map((c) => {
    const name = fr.of(c.alpha_2);
    return [c.alpha_2, name && name !== c.alpha_2 ? name : c.common_name || c.name];
  })
  .sort((a, b) => coll.compare(a[1], b[1]));

// Subdivisions : on garde le niveau le plus fin (ex. les départements en France, pas les régions),
// c'est-à-dire les entrées qui ne sont le parent d'aucune autre.
const parents = new Set(subs.filter((s) => s.parent).map((s) => s.parent));
// France : les départements uniquement. Les collectivités d'outre-mer (Saint-Martin, Polynésie…)
// ont leur propre code pays et apparaissent déjà dans la liste des pays.
const FR_KEEP = /^(\d{2}|2A|2B|75C|97\d)$/;
// Noms plus lisibles : « Bruxelles-Capitale, Région de » -> « Région de Bruxelles-Capitale », sans les annotations ISO « (EH) »
const clean = (n) => n.replace(/^(.+), (Région|Province|Territoire|Ville|Communauté)( de la| de l’| de l'| des| du| de)? ?$/, (m, a, b, c) => `${b}${c || ''} ${a}`.replace("l’ ", 'l’'))
  .replace(/\s*\((EH|EH-partial)\)$/, '').trim();
const byCountry = {};
for (const s of subs) {
  if (parents.has(s.code)) continue;
  const [cc, local] = s.code.split('-');
  if (cc === 'FR' && !FR_KEEP.test(local)) continue;
  (byCountry[cc] ||= []).push([cc === 'FR' && local === '75C' ? '75' : local, clean(s.name)]);
}
for (const cc of Object.keys(byCountry)) {
  // France : numéro de département dans l'ordre (01, 02… 2A, 2B… 971) ; ailleurs, ordre alphabétique
  byCountry[cc].sort(cc === 'FR' ? (a, b) => coll.compare(a[0].padStart(3, '0'), b[0].padStart(3, '0')) : (a, b) => coll.compare(a[1], b[1]));
}

const out = { countries: list, regions: byCountry };
const file = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..', 'src', 'geo.json');
fs.writeFileSync(file, JSON.stringify(out));
const n = Object.values(byCountry).reduce((t, a) => t + a.length, 0);
console.log(`${list.length} pays, ${n} subdivisions -> ${file} (${Math.round(fs.statSync(file).size / 1024)} Ko)`);
