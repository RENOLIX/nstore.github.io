/* Catalogue de départ de NStore Football.
   Ces maillots remplissent la base au premier lancement ; ensuite on les gère depuis la page admin (#/admin). */

export const SEED_PRODUCTS = [
  { id: 'bayern-munich-domicile', img: 'p1', name: 'Bayern Munich Domicile', cat: 'homme', league: 'Allemagne', type: 'Domicile',
    price: 89.9, badge: 'Nouveau', isNew: true,
    desc: 'Rouge vif à fines rayures ton sur ton, col et bords de manches blancs soulignés d\'or.' },
  { id: 'arsenal-exterieur', img: 'p2', name: 'Arsenal Extérieur', cat: 'homme', league: 'Angleterre', type: 'Extérieur',
    price: 89.9,
    desc: 'Jaune pâle au motif graphique discret, col et poignets rayés bordeaux et marine.' },
  { id: 'tottenham-third', img: 'p3', name: 'Tottenham Third', cat: 'homme', league: 'Angleterre', type: 'Third',
    price: 89.9, badge: 'Nouveau', isNew: true,
    desc: 'Bleu nuit traversé d\'éclats violets, roses et orangés en diagonale.' },
  { id: 'arsenal-third', img: 'p4', name: 'Arsenal Third', cat: 'homme', league: 'Angleterre', type: 'Third',
    price: 84.9, compareAt: 104.9,
    desc: 'Bleu marine au motif géométrique ton sur ton, col en V rouge et jaune, marquages jaunes.' },
  { id: 'barcelone-golf', img: 'p5', name: 'FC Barcelone Édition Golf', cat: 'homme', league: 'Espagne', type: 'Édition spéciale',
    price: 94.9, badge: 'Édition spéciale',
    desc: 'Rayures blaugrana en dégradé et marquage jaune sur la poitrine.' },
  { id: 'barcelone-crop-femme', img: 'p6', name: 'FC Barcelone Crop Top Femme', cat: 'femme', league: 'Espagne', type: 'Coupe femme',
    price: 79.9, sizes: ['XS', 'S', 'M', 'L'],
    desc: 'Coupe courte pour femme, noir texturé qui fond vers le violet, marquages dorés.' },
  { id: 'espagne-noir', img: 'p7', name: 'Espagne Édition Noire', cat: 'homme', league: 'Europe', type: 'Édition spéciale',
    price: 94.9, badge: 'Édition spéciale',
    desc: 'Noir au motif arabesque ton sur ton, col en V et poignets bordeaux et jaune.' },
  { id: 'espagne-bordeaux', img: 'p8', name: 'Espagne Édition Bordeaux', cat: 'homme', league: 'Europe', type: 'Édition spéciale',
    price: 94.9, isNew: true, badge: 'Nouveau',
    desc: 'Bordeaux au motif arabesque ton sur ton, col en V et détails jaunes.' }
];

/* Diapositives du carrousel d'accueil.
   deep / glow : couleurs du décor de stade ; word : grand mot en filigrane ; sticker : pastille sur la photo. */
export const SLIDES = [
  { img: 'hero-bayern', product: 'bayern-munich-domicile', tag: 'Nouveauté', title: 'Bayern Munich Domicile', word: 'FC BAYERN',
    alt: 'Maillot Bayern Munich Domicile',
    text: 'Le rouge de Munich, rayures ton sur ton et finitions dorées.' },
  { img: 'hero-arsenal', product: 'arsenal-third', tag: 'Promotion', title: 'Arsenal Third', word: 'ARSENAL',
    alt: 'Maillots Arsenal Extérieur et Third suspendus dans un vestiaire',
    text: 'Le bleu marine aux trois bandes jaunes, à prix réduit pour une durée limitée.' },
  { img: 'hero-espagne', product: 'espagne-noir', tag: 'Édition spéciale', title: 'Espagne, noir ou bordeaux', word: 'ESPAÑA',
    alt: 'Maillots Espagne édition noire et édition bordeaux suspendus dans un vestiaire',
    text: 'Deux éditions au motif arabesque ton sur ton, relevées de jaune.' },
  { img: 'hero-barca', product: 'barcelone-golf', tag: 'Série limitée', title: 'FC Barcelone Édition Golf', word: 'BARÇA',
    alt: 'Maillot FC Barcelone Édition Golf',
    text: 'Les rayures blaugrana revisitées, en série limitée.' }
];

export const CATS = { homme: 'Homme', femme: 'Femme' };
export const DEFAULT_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
export const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
export const FREE_SHIP = 100;
export const SEED_PROMOS = [{ code: 'BIENVENUE10', percent: 10, active: true }];
export const SHIPPING = {
  standard: { label: 'Livraison standard', delay: '2 à 4 jours ouvrés, à domicile', price: 4.9, freeOver: true },
  relais: { label: 'Point relais', delay: '3 à 5 jours ouvrés, près de chez vous', price: 3.9, freeOver: true },
  express: { label: 'Livraison express', delay: 'Le lendemain avant 13 h', price: 9.9, freeOver: false }
};

const eur = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
export const fmt = (n) => eur.format(n);
export const inCat = (p, cat) => cat === 'tous' || p.cat === cat;
export const discountPct = (p) => Math.round((1 - p.price / p.compareAt) * 100);
export const BASE = import.meta.env.BASE_URL;

/* Statuts de commande, dans l'ordre du traitement */
export const ORDER_STATUS = {
  nouvelle: 'Nouvelle',
  preparation: 'En préparation',
  expediee: 'Expédiée',
  livree: 'Livrée',
  annulee: 'Annulée'
};
export const PAYMENTS = { carte: 'Carte bancaire', paypal: 'PayPal' };

// Paiement : PayPal uniquement pour l'instant (la carte bancaire reviendra avec Stripe).
// Les paiements arrivent sur ce compte PayPal.
export const PAYPAL_EMAIL = 'ounishany@yahoo.fr';

// Lien de paiement PayPal d'une commande : montant et numéro repris de la commande enregistrée.
// Au retour, PayPal renvoie sur la page de confirmation (payé ou annulé).
export function paypalLink(order) {
  const site = window.location.origin + window.location.pathname;
  const params = new URLSearchParams({
    cmd: '_xclick',
    business: PAYPAL_EMAIL,
    item_name: `Commande ${order.num} - NStore Football`,
    invoice: order.num,
    amount: Number(order.total).toFixed(2),
    currency_code: 'EUR',
    no_shipping: '1',
    no_note: '1',
    lc: 'FR',
    charset: 'utf-8',
    return: `${site}#/confirmation?paypal=ok`,
    cancel_return: `${site}#/confirmation?paypal=annule`
  });
  return 'https://www.paypal.com/cgi-bin/webscr?' + params.toString();
}
