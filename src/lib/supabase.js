/* Backend Supabase : mêmes fonctions que local.js, données partagées et protégées.
   Le schéma (tables, règles de sécurité, fonctions) est dans supabase/schema.sql. */
import { createClient } from '@supabase/supabase-js';

export const name = 'supabase';
export const authMode = 'password';

const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
// Créé seulement si le projet est configuré (sinon le site reste en mode démo local)
const db = URL && KEY ? createClient(URL, KEY, { auth: { storageKey: 'nstore-auth' } }) : null;

/* Messages d'erreur de Supabase traduits pour l'admin */
const MESSAGES = [
  [/invalid login credentials/i, 'E-mail ou mot de passe incorrect.'],
  [/already registered|already been registered|already exists/i, 'Un compte existe déjà avec cette adresse e-mail.'],
  [/password should be at least (\d+)/i, (m) => `Le mot de passe doit faire au moins ${m[1]} caractères.`],
  [/email not confirmed/i, "Cette adresse e-mail n'est pas confirmée. Désactivez la confirmation par e-mail dans Supabase."],
  [/rate limit/i, 'Trop de tentatives, réessayez dans quelques minutes.'],
  [/signups not allowed|signup.*disabled/i, 'Les inscriptions sont désactivées dans Supabase (Authentication, Sign In / Providers).'],
  [/unable to validate email|invalid.*email/i, "Cette adresse e-mail n'est pas valide."],
  [/failed to fetch|network/i, 'Connexion à Supabase impossible. Vérifiez votre connexion internet.']
];
function fail(error) {
  const msg = error?.message || String(error);
  for (const [re, fr] of MESSAGES) {
    const m = msg.match(re);
    if (m) throw new Error(typeof fr === 'function' ? fr(m) : fr);
  }
  throw new Error(msg);
}
const run = async (promise) => {
  const { data, error } = await promise;
  if (error) fail(error);
  return data;
};

/* ---------- Produits ---------- */
const fromProduct = (r) => ({
  id: r.id, name: r.name, cat: r.cat, league: r.league, type: r.type,
  price: Number(r.price), ...(r.compare_at != null ? { compareAt: Number(r.compare_at) } : {}),
  desc: r.description, sizes: r.sizes, img: r.img, isNew: r.is_new, active: r.active
});
const toProduct = (p) => ({
  id: p.id, name: p.name, cat: p.cat, league: p.league || '', type: p.type || '',
  price: p.price, compare_at: p.compareAt ?? null, description: p.desc || '',
  sizes: p.sizes, img: p.img, is_new: !!p.isNew, active: p.active !== false, updated_at: new Date().toISOString()
});
const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export async function listProducts() {
  const rows = await run(db.from('products').select('*').order('position').order('created_at', { ascending: false }));
  return rows.map(fromProduct);
}

// Une photo choisie dans l'admin arrive en data URL : on l'envoie dans le stockage et on garde son adresse.
async function uploadIfNeeded(img) {
  if (!img?.startsWith('data:')) return img;
  const blob = await (await fetch(img)).blob();
  const ext = blob.type.split('/')[1] || 'webp';
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  await run(db.storage.from('products').upload(path, blob, { contentType: blob.type, cacheControl: '31536000' }));
  return db.storage.from('products').getPublicUrl(path).data.publicUrl;
}

export async function saveProduct(input) {
  const p = { ...input, img: await uploadIfNeeded(input.img) };
  if (!p.id) {
    const base = slug(p.name) || 'maillot';
    const taken = new Set((await run(db.from('products').select('id').like('id', `${base}%`))).map((r) => r.id));
    let id = base, n = 2;
    while (taken.has(id)) id = `${base}-${n++}`;
    p.id = id;
    return fromProduct(await run(db.from('products').insert(toProduct(p)).select().single()));
  }
  return fromProduct(await run(db.from('products').update(toProduct(p)).eq('id', p.id).select().single()));
}
export async function deleteProduct(id) {
  await run(db.from('products').delete().eq('id', id));
}

/* ---------- Codes promo ---------- */
export async function listPromos() {
  // Hors administrateurs, la règle de sécurité renvoie une liste vide : c'est voulu.
  return run(db.from('promos').select('code, percent, active').order('created_at'));
}
export async function savePromo(promo) {
  return run(db.from('promos').upsert({ code: promo.code, percent: promo.percent, active: promo.active }).select().single());
}
export async function deletePromo(code) {
  await run(db.from('promos').delete().eq('code', code));
}
export async function checkPromo(code) {
  return run(db.rpc('check_promo', { promo_code: code }));
}

/* ---------- Commandes ---------- */
const fromOrder = (r) => ({
  id: r.id, num: r.num, createdAt: r.created_at, status: r.status,
  customer: r.customer, address: r.address,
  shipping: { ...r.shipping, price: Number(r.shipping.price) },
  payment: r.payment, promo: r.promo,
  lines: r.lines.map((l) => ({ ...l, unit: Number(l.unit) })),
  subtotal: Number(r.subtotal), discount: Number(r.discount), total: Number(r.total)
});
export async function listOrders() {
  return (await run(db.from('orders').select('*').order('created_at', { ascending: false }))).map(fromOrder);
}
// Les prix, la remise et la livraison sont recalculés par la base (fonction create_order).
export async function createOrder(o) {
  const payload = {
    customer: o.customer, address: o.address, payment: o.payment, promo: o.promo,
    shipping: { method: o.shipping.method },
    lines: o.lines.map(({ id, size, qty }) => ({ id, size, qty }))
  };
  return fromOrder(await run(db.rpc('create_order', { payload })));
}
export async function updateOrderStatus(id, status) {
  return fromOrder(await run(db.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', id).select().single()));
}

/* ---------- Comptes ---------- */
async function withProfile(session) {
  if (!session) return null;
  const profile = await run(db.from('profiles').select('role, full_name').eq('id', session.user.id).maybeSingle());
  return { user: { id: session.user.id, email: session.user.email }, role: profile?.role || null, name: profile?.full_name || '' };
}
export async function getSession() {
  const { data } = await db.auth.getSession();
  return withProfile(data.session);
}
export async function signIn(email, password) {
  const data = await run(db.auth.signInWithPassword({ email: email.trim(), password }));
  return withProfile(data.session);
}
export async function signOut() {
  await db.auth.signOut();
}
export async function adminExists() {
  return run(db.rpc('admin_exists'));
}
// Premier compte : la base lui donne automatiquement le rôle administrateur.
export async function createFirstAdmin({ email, password, fullName }) {
  const data = await run(db.auth.signUp({ email: email.trim(), password, options: { data: { full_name: fullName } } }));
  if (!data.session) throw new Error('Compte créé, mais Supabase demande encore une confirmation par e-mail. Désactivez « Confirm email » puis connectez-vous.');
  return withProfile(data.session);
}

/* Utilisateurs (administrateurs uniquement, contrôlé par la base) */
export async function listUsers() {
  return (await run(db.rpc('admin_list_users'))).map((u) => ({
    id: u.id, email: u.email, name: u.full_name || '', role: u.role, createdAt: u.created_at, lastSignInAt: u.last_sign_in_at
  }));
}
// On crée le compte avec un second client qui ne garde pas de session :
// l'administrateur connecté reste connecté. La base attribue ensuite le rôle.
export async function createUser({ email, password, name: fullName, role }) {
  const temp = createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'nstore-signup' } });
  const data = await run(temp.auth.signUp({ email: email.trim(), password, options: { data: { full_name: fullName } } }));
  if (!data.user || !data.user.identities?.length) throw new Error('Un compte existe déjà avec cette adresse e-mail.');
  await run(db.rpc('admin_update_user', { target: data.user.id, new_role: role || null, new_name: fullName || '' }));
  return data.user.id;
}
export async function updateUser(id, { role, name: fullName }) {
  await run(db.rpc('admin_update_user', { target: id, new_role: role || null, new_name: fullName || '' }));
}
export async function deleteUser(id) {
  await run(db.rpc('admin_delete_user', { target: id }));
}
