/* Backend local : les données vivent dans le navigateur (localStorage).
   Il expose exactement les mêmes fonctions que le futur backend Supabase,
   pour que la boutique et l'admin n'aient rien à changer le jour du branchement.
   Attention : chaque visiteur a sa propre copie, rien n'est partagé ni protégé. */
import { SEED_PRODUCTS, SEED_PROMOS } from '../data.js';

export const name = 'local';
export const authMode = 'demo'; // Supabase : 'password'

const KEYS = { products: 'nstore_db_products', promos: 'nstore_db_promos', orders: 'nstore_db_orders', session: 'nstore_admin_session' };
const wait = () => new Promise((r) => setTimeout(r, 120)); // simule un aller-retour réseau

function read(key, seed) {
  try {
    const v = localStorage.getItem(key);
    if (v) return JSON.parse(v);
  } catch { /* stockage indisponible */ }
  return structuredClone(seed);
}
function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch { throw new Error('Stockage du navigateur plein ou indisponible.'); }
}

const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/* ---------- Produits ---------- */
export async function listProducts() {
  await wait();
  return read(KEYS.products, SEED_PRODUCTS.map((p) => ({ active: true, ...p })));
}
export async function saveProduct(input) {
  await wait();
  const list = read(KEYS.products, SEED_PRODUCTS.map((p) => ({ active: true, ...p })));
  const p = { ...input };
  if (!p.id) {
    const base = slug(p.name) || 'maillot';
    let id = base, n = 2;
    while (list.some((x) => x.id === id)) id = `${base}-${n++}`;
    p.id = id;
  }
  const i = list.findIndex((x) => x.id === p.id);
  if (i >= 0) list[i] = p; else list.unshift(p);
  write(KEYS.products, list);
  return p;
}
export async function deleteProduct(id) {
  await wait();
  write(KEYS.products, read(KEYS.products, SEED_PRODUCTS).filter((p) => p.id !== id));
}

/* ---------- Codes promo ---------- */
export async function listPromos() {
  await wait();
  return read(KEYS.promos, SEED_PROMOS);
}
export async function savePromo(promo) {
  await wait();
  const list = read(KEYS.promos, SEED_PROMOS);
  const i = list.findIndex((x) => x.code === promo.code);
  if (i >= 0) list[i] = promo; else list.push(promo);
  write(KEYS.promos, list);
  return promo;
}
export async function deletePromo(code) {
  await wait();
  write(KEYS.promos, read(KEYS.promos, SEED_PROMOS).filter((p) => p.code !== code));
}

/* ---------- Commandes ---------- */
export async function listOrders() {
  await wait();
  return read(KEYS.orders, []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export async function createOrder(order) {
  await wait();
  const list = read(KEYS.orders, []);
  const saved = {
    ...order,
    id: crypto.randomUUID(),
    num: 'NS-' + Date.now().toString(36).toUpperCase().slice(-6),
    createdAt: new Date().toISOString(),
    status: 'nouvelle'
  };
  list.push(saved);
  write(KEYS.orders, list);
  return saved;
}
export async function updateOrderStatus(id, status) {
  await wait();
  const list = read(KEYS.orders, []);
  const o = list.find((x) => x.id === id);
  if (o) { o.status = status; o.updatedAt = new Date().toISOString(); }
  write(KEYS.orders, list);
  return o;
}

/* ---------- Connexion admin ----------
   En local il n'y a pas de vrai compte : on entre en « mode démo ».
   Avec Supabase, ce sera une vraie connexion e-mail + mot de passe. */
export async function getSession() {
  try { return JSON.parse(sessionStorage.getItem(KEYS.session)); } catch { return null; }
}
export async function signIn() {
  await wait();
  const session = { user: { email: 'demo@local' }, demo: true };
  try { sessionStorage.setItem(KEYS.session, JSON.stringify(session)); } catch { /* ignore */ }
  return session;
}
export async function signOut() {
  try { sessionStorage.removeItem(KEYS.session); } catch { /* ignore */ }
}
