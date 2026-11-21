-- Catalogue de départ (8 maillots) et code BIENVENUE10. Ne remplace pas ce qui existe déjà.
insert into public.products (id, name, cat, league, type, price, compare_at, description, sizes, img, is_new, active, position) values
  ('bayern-munich-domicile', 'Bayern Munich Domicile', 'homme', 'Allemagne', 'Domicile', 89.9, null, 'Rouge vif à fines rayures ton sur ton, col et bords de manches blancs soulignés d''or.', '{S,M,L,XL,XXL}', 'p1', true, true, 1),
  ('arsenal-exterieur', 'Arsenal Extérieur', 'homme', 'Angleterre', 'Extérieur', 89.9, null, 'Jaune pâle au motif graphique discret, col et poignets rayés bordeaux et marine.', '{S,M,L,XL,XXL}', 'p2', false, true, 2),
  ('tottenham-third', 'Tottenham Third', 'homme', 'Angleterre', 'Third', 89.9, null, 'Bleu nuit traversé d''éclats violets, roses et orangés en diagonale.', '{S,M,L,XL,XXL}', 'p3', true, true, 3),
  ('arsenal-third', 'Arsenal Third', 'homme', 'Angleterre', 'Third', 84.9, 104.9, 'Bleu marine au motif géométrique ton sur ton, col en V rouge et jaune, marquages jaunes.', '{S,M,L,XL,XXL}', 'p4', false, true, 4),
  ('barcelone-golf', 'FC Barcelone Édition Golf', 'homme', 'Espagne', 'Édition spéciale', 94.9, null, 'Rayures blaugrana en dégradé et marquage jaune sur la poitrine.', '{S,M,L,XL,XXL}', 'p5', false, true, 5),
  ('barcelone-crop-femme', 'FC Barcelone Crop Top Femme', 'femme', 'Espagne', 'Coupe femme', 79.9, null, 'Coupe courte pour femme, noir texturé qui fond vers le violet, marquages dorés.', '{XS,S,M,L}', 'p6', false, true, 6),
  ('espagne-noir', 'Espagne Édition Noire', 'homme', 'Europe', 'Édition spéciale', 94.9, null, 'Noir au motif arabesque ton sur ton, col en V et poignets bordeaux et jaune.', '{S,M,L,XL,XXL}', 'p7', false, true, 7),
  ('espagne-bordeaux', 'Espagne Édition Bordeaux', 'homme', 'Europe', 'Édition spéciale', 94.9, null, 'Bordeaux au motif arabesque ton sur ton, col en V et détails jaunes.', '{S,M,L,XL,XXL}', 'p8', true, true, 8)
on conflict (id) do nothing;

insert into public.promos (code, percent, active) values
  ('BIENVENUE10', 10, true)
on conflict (code) do nothing;

-- Sélections et PSG (face et dos)
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
