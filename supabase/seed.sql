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
