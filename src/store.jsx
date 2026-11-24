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
    return {
      ready: products !== null,
      error,
      all,                                            // tous les produits (admin)
      products: all.filter((p) => p.active !== false), // produits visibles en boutique
      promos,
      byId: (id) => map.get(id),
      reload
    };
  }, [products, promos, error, reload]);

  return <CatalogCtx.Provider value={value}>{children}</CatalogCtx.Provider>;
}

/* ---------- Panier ---------- */
export const lineKey = (l) => [l.id, l.size].join('|');

const cents = (n) => Math.round(n * 100) / 100; // évite les 89,80000000000001 €

export function computeTotals(cart, percent, ship, byId) {
  const sub = cents(cart.reduce((n, l) => n + (byId(l.id)?.price || 0) * l.qty, 0));
  const rate = (percent || 0) / 100;
  const discount = cents(sub * rate);
  const after = cents(sub - discount);
  const priceOf = (k) => (SHIPPING[k].freeOver && after >= FREE_SHIP ? 0 : SHIPPING[k].price);
  const shipping = cart.length ? priceOf(ship) : 0;
  return { sub, discount, after, shipping, total: cents(after + shipping), priceOf };
}

const Ctx = createContext(null);
export const useStore = () => useContext(Ctx);

export function StoreProvider({ children }) {
  const { ready, byId } = useCatalog();
  const [cart, setCart] = useState(() => load('nstore_cart', []).map(({ id, size, qty }) => ({ id, size, qty })));
  // Code promo appliqué : { code, percent }, vérifié auprès du backend
  const [promo, setPromo] = useState(() => { const p = load('nstore_promo', null); return p && typeof p === 'object' && p.code ? p : null; });
  const [ship, setShip] = useState('standard');
  const [layer, setLayer] = useState(null); // 'cart' | 'menu' | 'sizes'
  const [toast, setToast] = useState('');
  // Dernière commande, gardée pour l'onglet en cours : on la retrouve au retour de PayPal
  const [order, setOrder] = useState(() => { try { return JSON.parse(sessionStorage.getItem('nstore_order')) || null; } catch { return null; } });
  const [bump, setBump] = useState(0);
  const timer = useRef();

  // Une fois le catalogue chargé : on retire du panier les maillots supprimés ou masqués.
  useEffect(() => {
    if (!ready) return;
    setCart((c) => {
      const kept = c.filter((l) => byId(l.id) && byId(l.id).active !== false);
      return kept.length === c.length ? c : kept;
    });
  }, [ready, byId]);

  // Au chargement, on revérifie le code gardé en mémoire : il a pu être désactivé depuis.
  useEffect(() => {
    const code = load('nstore_promo', null)?.code;
    if (!code) return;
    backend.checkPromo(code)
      .then((percent) => setPromo((p) => (p?.code === code ? (percent ? { code, percent } : null) : p)))
      .catch(() => {});
  }, []);

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
  const applyPromo = useCallback(async (raw) => {
    const code = (raw || '').trim().toUpperCase();
    if (!code) { notify('Saisissez un code promo.'); return false; }
    let percent = null;
    try { percent = await backend.checkPromo(code); } catch { notify('Vérification du code impossible, réessayez.'); return false; }
    if (percent) { setPromo({ code, percent }); notify('Code ' + code + ' appliqué.'); return true; }
    notify('Ce code n\'est pas valide.');
    return false;
  }, [notify]);

  // Enregistre la commande dans le backend ; la confirmation affiche la version enregistrée.
  const placeOrder = useCallback(async (o) => {
    const saved = await backend.createOrder(o);
    setOrder(saved); setCart([]); setPromo(null);
    try { sessionStorage.setItem('nstore_order', JSON.stringify(saved)); } catch { /* stockage indisponible */ }
    return saved;
  }, []);

  const value = useMemo(() => ({
    cart, promo: promo?.code || null, ship, layer, toast, order, bump,
    count: cart.reduce((n, l) => n + l.qty, 0),
    totals: computeTotals(cart, promo?.percent, ship, byId),
    add, setQty, remove, applyPromo, removePromo: () => setPromo(null),
    setShip, setLayer, notify, placeOrder
  }), [cart, promo, ship, layer, toast, order, bump, byId, add, setQty, remove, applyPromo, notify, placeOrder]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/* Routage par adresse : /, /boutique?cat=homme, /produit/<id>, /panier, /commande, /confirmation, /admin/<section> */
// Anciens liens en « #/… » (avant le nom de domaine) : on les convertit en adresse normale.
if (window.location.hash.startsWith('#/')) {
  window.history.replaceState(null, '', window.location.hash.slice(1));
}
function parse() {
  const seg = window.location.pathname.split('/').filter(Boolean).map(decodeURIComponent);
  const params = Object.fromEntries(new URLSearchParams(window.location.search));
  return { name: seg[0] || 'home', arg: seg[1], params, key: window.location.pathname + window.location.search };
}
const NAV = 'nstore:navigate';
export const go = (to, { replace = false } = {}) => {
  if (to === window.location.pathname + window.location.search) return;
  window.history[replace ? 'replaceState' : 'pushState'](null, '', to);
  window.dispatchEvent(new Event(NAV));
};
// Lien interne (même site, clic normal) : on change de page sans recharger
function onLinkClick(e) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.target.closest('a[href]');
  if (!a || a.target || a.hasAttribute('download')) return;
  const href = a.getAttribute('href');
  if (!href.startsWith('/') || href.startsWith('//')) return;
  e.preventDefault();
  go(href);
}
export function useRoute() {
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const on = () => { setRoute(parse()); window.scrollTo(0, 0); };
    window.addEventListener('popstate', on);
    window.addEventListener(NAV, on);
    return () => { window.removeEventListener('popstate', on); window.removeEventListener(NAV, on); };
  }, []);
  return route;
}
// Un seul écouteur de clics pour tout le site
if (typeof document !== 'undefined' && !window.__nstoreLinks) {
  window.__nstoreLinks = true;
  document.addEventListener('click', onLinkClick);
}
