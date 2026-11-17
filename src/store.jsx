import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { FREE_SHIP, SHIPPING } from './data.js';
import { backend } from './lib/backend.js';

function load(key, def) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; }
}
function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* stockage indisponible */ }
}

/* ---------- Catalogue : produits et codes promo, chargés depuis le backend ---------- */
const CatalogCtx = createContext(null);
export const useCatalog = () => useContext(CatalogCtx);

export function CatalogProvider({ children }) {
  const [products, setProducts] = useState(null);
  const [promos, setPromos] = useState([]);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    try {
      const [p, c] = await Promise.all([backend.listProducts(), backend.listPromos()]);
      setProducts(p); setPromos(c); setError('');
    } catch (e) {
      setProducts((v) => v || []); setError(e.message || 'Chargement impossible.');
    }
  }, []);
  useEffect(() => { reload(); }, [reload]);

  const value = useMemo(() => {
    const all = products || [];
    const map = new Map(all.map((p) => [p.id, p]));
    const rates = Object.fromEntries(promos.filter((p) => p.active).map((p) => [p.code, p.percent / 100]));
    return {
      ready: products !== null,
      error,
      all,                                            // tous les produits (admin)
      products: all.filter((p) => p.active !== false), // produits visibles en boutique
      promos,
      byId: (id) => map.get(id),
      promoRate: (code) => rates[code],
      reload
    };
  }, [products, promos, error, reload]);

  return <CatalogCtx.Provider value={value}>{children}</CatalogCtx.Provider>;
}

/* ---------- Panier ---------- */
export const lineKey = (l) => [l.id, l.size].join('|');

const cents = (n) => Math.round(n * 100) / 100; // évite les 89,80000000000001 €

export function computeTotals(cart, promo, ship, byId, promoRate) {
  const sub = cents(cart.reduce((n, l) => n + (byId(l.id)?.price || 0) * l.qty, 0));
  const rate = promo ? promoRate(promo) || 0 : 0;
  const discount = cents(sub * rate);
  const after = cents(sub - discount);
  const priceOf = (k) => (SHIPPING[k].freeOver && after >= FREE_SHIP ? 0 : SHIPPING[k].price);
  const shipping = cart.length ? priceOf(ship) : 0;
  return { sub, discount, after, shipping, total: cents(after + shipping), priceOf };
}

const Ctx = createContext(null);
export const useStore = () => useContext(Ctx);

export function StoreProvider({ children }) {
  const { ready, byId, promoRate } = useCatalog();
  const [cart, setCart] = useState(() => load('nstore_cart', []).map(({ id, size, qty }) => ({ id, size, qty })));
  const [promo, setPromo] = useState(() => load('nstore_promo', null));
  const [ship, setShip] = useState('standard');
  const [layer, setLayer] = useState(null); // 'cart' | 'menu' | 'sizes'
  const [toast, setToast] = useState('');
  const [order, setOrder] = useState(null);
  const [bump, setBump] = useState(0);
  const timer = useRef();

  // Une fois le catalogue chargé : on retire du panier les maillots supprimés ou masqués, et les codes désactivés.
  useEffect(() => {
    if (!ready) return;
    setCart((c) => {
      const kept = c.filter((l) => byId(l.id) && byId(l.id).active !== false);
      return kept.length === c.length ? c : kept;
    });
    setPromo((p) => (p && promoRate(p) ? p : null));
  }, [ready, byId, promoRate]);

  useEffect(() => save('nstore_cart', cart), [cart]);
  useEffect(() => save('nstore_promo', promo), [promo]);

  const notify = useCallback((msg) => {
    setToast(msg);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(''), 2800);
  }, []);

  const add = useCallback((item) => {
    setCart((c) => {
      const k = lineKey(item);
      return c.some((l) => lineKey(l) === k)
        ? c.map((l) => (lineKey(l) === k ? { ...l, qty: Math.min(10, l.qty + item.qty) } : l))
        : [...c, item];
    });
    setBump((b) => b + 1);
  }, []);
  const setQty = useCallback((key, qty) => {
    setCart((c) => (qty < 1 ? c.filter((l) => lineKey(l) !== key) : c.map((l) => (lineKey(l) === key ? { ...l, qty: Math.min(10, qty) } : l))));
  }, []);
  const remove = useCallback((key) => setCart((c) => c.filter((l) => lineKey(l) !== key)), []);
  const applyPromo = useCallback((raw) => {
    const code = (raw || '').trim().toUpperCase();
    if (promoRate(code)) { setPromo(code); notify('Code ' + code + ' appliqué.'); return true; }
    notify(code ? 'Ce code n\'est pas valide.' : 'Saisissez un code promo.');
    return false;
  }, [notify, promoRate]);

  // Enregistre la commande dans le backend ; la confirmation affiche la version enregistrée.
  const placeOrder = useCallback(async (o) => {
    const saved = await backend.createOrder(o);
    setOrder(saved); setCart([]); setPromo(null);
    return saved;
  }, []);

  const value = useMemo(() => ({
    cart, promo, ship, layer, toast, order, bump,
    count: cart.reduce((n, l) => n + l.qty, 0),
    totals: computeTotals(cart, promo, ship, byId, promoRate),
    add, setQty, remove, applyPromo, removePromo: () => setPromo(null),
    setShip, setLayer, notify, placeOrder
  }), [cart, promo, ship, layer, toast, order, bump, byId, promoRate, add, setQty, remove, applyPromo, notify, placeOrder]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/* Routage par ancre : #/, #/boutique?cat=clubs, #/produit/<id>, #/panier, #/commande, #/confirmation, #/admin/<section> */
function parse() {
  const [path, qs] = window.location.hash.replace(/^#\/?/, '').split('?');
  const seg = path.split('/').filter(Boolean);
  return { name: seg[0] || 'home', arg: seg[1], params: Object.fromEntries(new URLSearchParams(qs || '')), key: window.location.hash };
}
export function useRoute() {
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const on = () => { setRoute(parse()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}
export const go = (hash) => { window.location.hash = hash; };
