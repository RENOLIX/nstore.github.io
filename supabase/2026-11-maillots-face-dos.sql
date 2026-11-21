-- Photo de dos des maillots + 10 nouveaux maillots (Homme, 19,99 €), face et dos.
-- À lancer une fois dans Supabase > SQL Editor. Sans risque si on le relance.
alter table public.products add column if not exists img_back text;

insert into public.products (id, name, cat, league, type, price, compare_at, description, sizes, img, img_back, is_new, active, position) values
  ('algerie-exterieur', 'Algérie Extérieur', 'homme', 'Sélection nationale', 'Extérieur', 19.99, null, 'Blanc cassé à fines bandes dorées et motif ajouré, col et bords de manches vert émeraude liserés de rouge.', '{S,M,L,XL,XXL}', 'algerie-exterieur', 'algerie-exterieur-dos', true, true, 9),
  ('algerie-retro', 'Algérie Rétro', 'homme', 'Sélection nationale', 'Rétro', 19.99, null, 'Vert à rayures ton sur ton, épaules vert sapin, col cranté et bords de manches rouges.', '{S,M,L,XL,XXL}', 'algerie-retro', 'algerie-retro-dos', true, true, 10),
  ('argentine-edition-messi', 'Argentine Édition Messi', 'homme', 'Sélection nationale', 'Édition spéciale', 19.99, null, 'Bandes ciel et blanche traversées de rayons, col et manches noir et or, logo Messi sur la poitrine.', '{S,M,L,XL,XXL}', 'argentine-edition-messi', 'argentine-edition-messi-dos', true, true, 11),
  ('maroc-exterieur', 'Maroc Extérieur', 'homme', 'Sélection nationale', 'Extérieur', 19.99, null, 'Blanc au motif berbère sable sur toute la hauteur, col tressé rouge et vert, détails dorés.', '{S,M,L,XL,XXL}', 'maroc-exterieur', 'maroc-exterieur-dos', true, true, 12),
  ('france-exterieur', 'France Extérieur', 'homme', 'Sélection nationale', 'Extérieur', 19.99, null, 'Vert d''eau, coq et liserés cuivrés, poignets rayés bleu, blanc, rouge.', '{S,M,L,XL,XXL}', 'france-exterieur', 'france-exterieur-dos', true, true, 13),
  ('japon-edition-speciale', 'Japon Édition spéciale', 'homme', 'Sélection nationale', 'Édition spéciale', 19.99, null, 'Blanc à fines rayures multicolores, col en V et bords de manches rayés noir et blanc.', '{S,M,L,XL,XXL}', 'japon-edition-speciale', 'japon-edition-speciale-dos', true, true, 14),
  ('argentine-edition-noire', 'Argentine Édition noire', 'homme', 'Sélection nationale', 'Édition spéciale', 19.99, null, 'Noir aux arabesques bleues, badge de champion du monde 2022, col et manches liserés de blanc.', '{S,M,L,XL,XXL}', 'argentine-edition-noire', 'argentine-edition-noire-dos', true, true, 15),
  ('belgique-exterieur', 'Belgique Extérieur', 'homme', 'Sélection nationale', 'Extérieur', 19.99, null, 'Sphères roses et turquoise sur fond blanc, col en V et bords de manches noirs.', '{S,M,L,XL,XXL}', 'belgique-exterieur', 'belgique-exterieur-dos', true, true, 16),
  ('psg-exterieur', 'Paris Saint-Germain Extérieur', 'homme', 'France', 'Extérieur', 19.99, null, 'Blanc traversé d''une bande centrale rouge et bleue en dégradé, col et manches marine.', '{S,M,L,XL,XXL}', 'psg-exterieur', 'psg-exterieur-dos', true, true, 17),
  ('psg-domicile', 'Paris Saint-Germain Domicile', 'homme', 'France', 'Domicile', 19.99, null, 'Bleu roi à bande centrale rouge bordée de blanc, col en V et fins liserés rouges.', '{S,M,L,XL,XXL}', 'psg-domicile', 'psg-domicile-dos', true, true, 18)
on conflict (id) do nothing;
