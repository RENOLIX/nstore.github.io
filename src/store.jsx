import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { byId, FREE_SHIP, PROMOS, SHIPPING } from './data.js';

function load(key, def) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; }
}
function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* stockage indisponible */ }
}

export const lineKey = (l) => [l.id, l.size].join('|');
export const lineUnit = (l) => byId(l.id).price;

export function computeTotals(cart, promo, ship) {
  const sub = cart.reduce((n, l) => n + lineUnit(l) * l.qty, 0);
  const discount = promo ? Math.round(sub * PROMOS[promo] * 100) / 100 : 0;
  const after = sub - discount;
  const priceOf = (k) => (SHIPPING[k].freeOver && after >= FREE_SHIP ? 0 : SHIPPING[k].price);
  const shipping = cart.length ? priceOf(ship) : 0;
  return { sub, discount, after, shipping, total: after + shipping, priceOf };
}

const Ctx = createContext(null);
export const useStore = () => useContext(Ctx);

export function StoreProvider({ children }) {
  const [cart, setCart] = useState(() => load('nstore_cart', []).filter((l) => byId(l.id)).map(({ id, size, qty }) => ({ id, size, qty })));
  const [promo, setPromo] = useState(() => { const p = load('nstore_promo', null); return PROMOS[p] ? p : null; });
  const [ship, setShip] = useState('standard');
  const [layer, setLayer] = useState(null); // 'cart' | 'menu' | 'sizes'
  const [toast, setToast] = useState('');
  const [order, setOrder] = useState(null);
  const [bump, setBump] = useState(0);
  const timer = useRef();

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
    if (PROMOS[code]) { setPromo(code); notify('Code ' + code + ' appliqué.'); return true; }
    notify(code ? 'Ce code n\'est pas valide.' : 'Saisissez un code promo.');
    return false;
  }, [notify]);
  const placeOrder = useCallback((o) => { setOrder(o); setCart([]); setPromo(null); }, []);

  const value = useMemo(() => ({
    cart, promo, ship, layer, toast, order, bump,
    count: cart.reduce((n, l) => n + l.qty, 0),
    totals: computeTotals(cart, promo, ship),
    add, setQty, remove, applyPromo, removePromo: () => setPromo(null),
    setShip, setLayer, notify, placeOrder
  }), [cart, promo, ship, layer, toast, order, bump, add, setQty, remove, applyPromo, notify, placeOrder]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/* Routage par ancre : #/, #/boutique?cat=clubs, #/produit/<id>, #/panier, #/commande, #/confirmation */
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
