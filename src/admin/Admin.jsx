/* Espace administrateur NStore Football : #/admin, #/admin/commandes, #/admin/produits, #/admin/codes
   Toutes les lectures et écritures passent par src/lib/backend.js (local aujourd'hui, Supabase ensuite). */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ALL_SIZES, CATS, DEFAULT_SIZES, discountPct, fmt, ORDER_STATUS, PAYMENTS } from '../data.js';
import { backend } from '../lib/backend.js';
import { useCatalog } from '../store.jsx';
import { isUrl, Logo, Photo } from '../ui.jsx';
import './admin.css';

/* ---------- Icônes ---------- */
const P = {
  grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
  orders: '<path d="M6 3.5h12a1 1 0 0 1 1 1V21l-3-2-2.5 2L11 19l-2.5 2L6 19V4.5a1 1 0 0 1 0-1Z"/><path d="M9 8h6M9 12h6"/>',
  shirt: '<path d="m8 3-5 3 2 5 2-1v11h10V10l2 1 2-5-5-3c0 2-1.8 3.5-4 3.5S8 5 8 3Z"/>',
  percent: '<path d="M19 5 5 19"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/>',
  store: '<path d="M4 9.5 5.5 4h13L20 9.5"/><path d="M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0"/><path d="M5 11.5V20h14v-8.5"/><path d="M10 20v-5h4v5"/>',
  logout: '<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M10 16l-4-4 4-4M6 12h10"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  edit: '<path d="m4 20 1-4L16.5 4.5l3 3L8 19l-4 1Z"/>',
  trash: '<path d="M4 7h16M10 4h4M6 7l1 13h10l1-13M10 11v5M14 11v5"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
  refresh: '<path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.5"/><path d="M20 4v4.5h-4.5"/><path d="M20 12a8 8 0 0 1-13.7 5.6L4 15.5"/><path d="M4 20v-4.5h4.5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  euro: '<path d="M17 6.5a7 7 0 1 0 0 11"/><path d="M4 10h9M4 14h9"/>',
  basket: '<path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V7a3 3 0 0 1 6 0v1"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  pin: '<path d="M12 21s7-6.2 7-11.5a7 7 0 0 0-14 0C5 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  truck: '<path d="M3 6h11v10H3zM14 9h4l3 3.5V16h-7z"/><circle cx="7.5" cy="17.5" r="1.8"/><circle cx="17.5" cy="17.5" r="1.8"/>',
  card: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3 10h18"/>'
};
function I({ n, s = 18 }) {
  return <svg className="adm-ico" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: P[n] }} />;
}

const SECTIONS = [
  ['tableau', 'Tableau de bord', 'grid'],
  ['commandes', 'Commandes', 'orders'],
  ['produits', 'Produits', 'shirt'],
  ['codes', 'Codes promo', 'percent']
];
const dateFmt = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
const dayFmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
const numFmt = new Intl.NumberFormat('fr-FR');
const counted = (o) => o.status !== 'annulee';
const itemsOf = (o) => o.lines.reduce((n, l) => n + l.qty, 0);

/* ================= Racine ================= */
export default function Admin({ section }) {
  const [session, setSession] = useState(undefined);
  const [orders, setOrders] = useState(null);
  const [toast, setToast] = useState('');
  const timer = useRef();
  const catalog = useCatalog();

  const notify = useCallback((msg) => {
    setToast(msg); clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(''), 2600);
  }, []);
  const loadOrders = useCallback(async () => {
    try { setOrders(await backend.listOrders()); } catch (e) { notify(e.message); setOrders([]); }
  }, [notify]);

  useEffect(() => { document.title = 'Admin — NStore Football'; backend.getSession().then(setSession); }, []);
  useEffect(() => { if (session) loadOrders(); }, [session, loadOrders]);

  if (session === undefined) return <div className="adm-boot" />;
  if (!session) return <Login onDone={setSession} />;

  const current = SECTIONS.find(([k]) => k === section) || SECTIONS[0];
  const todo = (orders || []).filter((o) => o.status === 'nouvelle').length;
  const ctx = { orders, loadOrders, setOrders, notify, catalog };

  return (
    <div className="adm">
      <aside className="adm-side">
        <a className="adm-brand" href="#/admin"><Logo light /><span>Admin</span></a>
        <nav className="adm-nav" aria-label="Sections de l'admin">
          {SECTIONS.map(([k, label, ic]) => (
            <a key={k} href={k === 'tableau' ? '#/admin' : `#/admin/${k}`} className={current[0] === k ? 'is-on' : ''} aria-current={current[0] === k ? 'page' : undefined}>
              <I n={ic} /><span>{label}</span>
              {k === 'commandes' && todo > 0 && <b className="adm-count">{todo}</b>}
            </a>
          ))}
        </nav>
        <div className="adm-side__foot">
          <a href="#/"><I n="store" /><span>Voir la boutique</span></a>
          <button type="button" onClick={async () => { await backend.signOut(); setSession(null); }}><I n="logout" /><span>Se déconnecter</span></button>
        </div>
      </aside>

      <div className="adm-main">
        <header className="adm-top">
          <h1>{current[1]}</h1>
          <div className="adm-top__right">
            {backend.name === 'local' && (
              <span className="adm-mode" title="Les données restent dans ce navigateur. Le branchement Supabase les rendra partagées et protégées.">
                <I n="info" s={15} />Mode local
              </span>
            )}
            <button type="button" className="adm-btn adm-btn--ghost adm-btn--icon" onClick={() => { loadOrders(); catalog.reload(); notify('Données actualisées.'); }} aria-label="Actualiser"><I n="refresh" /></button>
          </div>
        </header>
        <main className="adm-content" key={current[0]}>
          {current[0] === 'tableau' && <Dashboard {...ctx} />}
          {current[0] === 'commandes' && <Orders {...ctx} />}
          {current[0] === 'produits' && <Products {...ctx} />}
          {current[0] === 'codes' && <Promos {...ctx} />}
        </main>
      </div>
      <div className={'adm-toast' + (toast ? ' is-on' : '')} role="status" aria-live="polite">{toast}</div>
    </div>
  );
}

/* ================= Connexion ================= */
function Login({ onDone }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const f = new FormData(e.currentTarget);
      onDone(await backend.signIn(String(f.get('email') || ''), String(f.get('password') || '')));
    } catch (ex) { setErr(ex.message || 'Connexion impossible.'); setBusy(false); }
  };
  return (
    <div className="adm-login">
      <form className="adm-login__card" onSubmit={submit}>
        <Logo />
        <h1>Espace administrateur</h1>
        {backend.authMode === 'password' ? (
          <>
            <p className="adm-muted">Connectez-vous avec votre compte administrateur.</p>
            <label className="adm-field"><span>Adresse e-mail</span><input className="adm-input" name="email" type="email" required autoComplete="username" /></label>
            <label className="adm-field"><span>Mot de passe</span><input className="adm-input" name="password" type="password" required autoComplete="current-password" /></label>
          </>
        ) : (
          <div className="adm-note">
            <I n="info" />
            <p><strong>Mode démo local.</strong> Il n'y a pas encore de vrais comptes : les produits et les commandes restent dans ce navigateur et chaque visiteur a sa propre copie. La connexion par e-mail et mot de passe arrive avec Supabase.</p>
          </div>
        )}
        {err && <p className="adm-error" role="alert">{err}</p>}
        <button className="adm-btn adm-btn--primary adm-btn--block" disabled={busy}>
          <I n="lock" />{busy ? 'Connexion…' : backend.authMode === 'password' ? 'Se connecter' : "Entrer dans l'admin"}
        </button>
        <a className="adm-login__back" href="#/">Retour à la boutique</a>
      </form>
    </div>
  );
}

/* ================= Éléments communs ================= */
function StatusPill({ status }) {
  return <span className={`adm-pill adm-pill--${status}`}><i aria-hidden="true" />{ORDER_STATUS[status]}</span>;
}
function Empty({ icon, title, children }) {
  return <div className="adm-empty"><I n={icon} s={30} /><h3>{title}</h3>{children && <p>{children}</p>}</div>;
}
function Drawer({ open, onClose, title, sub, children, foot }) {
  useEffect(() => {
    if (!open) return undefined;
    const esc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', esc);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', esc); document.body.style.overflow = ''; };
  }, [open, onClose]);
  return (
    <>
      <div className={'adm-veil' + (open ? ' is-on' : '')} onClick={onClose} />
      <aside className={'adm-drawer' + (open ? ' is-on' : '')} aria-hidden={!open} role="dialog" aria-modal="true" aria-label={title}>
        {open && (
          <>
            <div className="adm-drawer__head">
              <div><h2>{title}</h2>{sub && <div className="adm-muted">{sub}</div>}</div>
              <button type="button" className="adm-btn adm-btn--ghost adm-btn--icon" onClick={onClose} aria-label="Fermer"><I n="x" /></button>
            </div>
            <div className="adm-drawer__body">{children}</div>
            {foot && <div className="adm-drawer__foot">{foot}</div>}
          </>
        )}
      </aside>
    </>
  );
}
function Confirm({ text, onYes, onNo, busy }) {
  return (
    <div className="adm-modal" role="alertdialog" aria-modal="true" aria-label="Confirmation">
      <div className="adm-modal__box">
        <p>{text}</p>
        <div className="adm-modal__actions">
          <button type="button" className="adm-btn adm-btn--ghost" onClick={onNo}>Annuler</button>
          <button type="button" className="adm-btn adm-btn--danger" onClick={onYes} disabled={busy}><I n="trash" />Supprimer</button>
        </div>
      </div>
    </div>
  );
}
function Toggle({ checked, onChange, label }) {
  return (
    <label className="adm-toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <i aria-hidden="true" /><span className="sr-only">{label}</span>
    </label>
  );
}

/* ================= Tableau de bord ================= */
function Dashboard({ orders, catalog }) {
  if (!orders) return <div className="adm-skel" />;
  const ok = orders.filter(counted);
  const revenue = ok.reduce((n, o) => n + o.total, 0);
  const avg = ok.length ? revenue / ok.length : 0;
  const todo = orders.filter((o) => o.status === 'nouvelle' || o.status === 'preparation').length;
  const weekAgo = Date.now() - 7 * 864e5;
  const week = ok.filter((o) => new Date(o.createdAt).getTime() >= weekAgo);

  const best = {};
  ok.forEach((o) => o.lines.forEach((l) => {
    best[l.id] = best[l.id] || { id: l.id, name: l.name, img: l.img, qty: 0, total: 0 };
    best[l.id].qty += l.qty; best[l.id].total += l.qty * l.unit;
  }));
  const top = Object.values(best).sort((a, b) => b.qty - a.qty).slice(0, 5);

  const tiles = [
    ['euro', "Chiffre d'affaires", fmt(revenue), `${fmt(week.reduce((n, o) => n + o.total, 0))} sur 7 jours`],
    ['orders', 'Commandes', numFmt.format(ok.length), `${week.length} sur 7 jours`],
    ['basket', 'Panier moyen', fmt(avg), `${numFmt.format(ok.reduce((n, o) => n + itemsOf(o), 0))} maillots vendus`],
    ['clock', 'À traiter', numFmt.format(todo), 'Nouvelles ou en préparation']
  ];

  return (
    <div className="adm-stack">
      <section className="adm-tiles">
        {tiles.map(([ic, label, value, sub]) => (
          <div className="adm-tile" key={label}>
            <div className="adm-tile__label"><I n={ic} s={16} />{label}</div>
            <div className="adm-tile__value">{value}</div>
            <div className="adm-tile__sub">{sub}</div>
          </div>
        ))}
      </section>

      <section className="adm-card">
        <div className="adm-card__head"><h2>Ventes des 14 derniers jours</h2><span className="adm-muted">Hors commandes annulées</span></div>
        <SalesChart orders={ok} />
      </section>

      <div className="adm-cols">
        <section className="adm-card">
          <div className="adm-card__head"><h2>Dernières commandes</h2><a className="adm-link" href="#/admin/commandes">Tout voir <I n="arrow" s={15} /></a></div>
          {orders.length === 0 ? (
            <Empty icon="orders" title="Aucune commande pour l'instant">Passez une commande sur la boutique : elle apparaîtra ici.</Empty>
          ) : (
            <ul className="adm-list">
              {orders.slice(0, 6).map((o) => (
                <li key={o.id}>
                  <div><strong>{o.num}</strong><span className="adm-muted">{o.customer.prenom} {o.customer.nom} · {dateFmt.format(new Date(o.createdAt))}</span></div>
                  <div className="adm-list__end"><span className="adm-num">{fmt(o.total)}</span><StatusPill status={o.status} /></div>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="adm-card">
          <div className="adm-card__head"><h2>Meilleures ventes</h2><span className="adm-muted">{catalog.all.length} maillots au catalogue</span></div>
          {top.length === 0 ? (
            <Empty icon="shirt" title="Pas encore de ventes" />
          ) : (
            <ul className="adm-list">
              {top.map((t, k) => (
                <li key={t.id}>
                  <div className="adm-list__prod"><span className="adm-rank">{k + 1}</span><span className="adm-thumb"><Photo name={catalog.byId(t.id)?.img || t.img} /></span><strong>{catalog.byId(t.id)?.name || t.name}</strong></div>
                  <div className="adm-list__end"><span className="adm-muted">{t.qty} vendus</span><span className="adm-num">{fmt(t.total)}</span></div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

/* Graphique : une barre par jour, chiffre d'affaires, info-bulle au survol */
function SalesChart({ orders }) {
  const [hover, setHover] = useState(null);
  // Le dessin prend la largeur réelle du bloc : les textes gardent leur taille sur téléphone
  const box = useRef(null);
  const [width, setWidth] = useState(720);
  useEffect(() => {
    const el = box.current;
    if (!el || !('ResizeObserver' in window)) return undefined;
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const days = useMemo(() => {
    const out = [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    for (let k = 13; k >= 0; k--) {
      const d = new Date(today); d.setDate(d.getDate() - k);
      out.push({ d, key: d.toDateString(), total: 0, count: 0 });
    }
    const map = new Map(out.map((x) => [x.key, x]));
    orders.forEach((o) => {
      const slot = map.get(new Date(o.createdAt).toDateString());
      if (slot) { slot.total += o.total; slot.count += 1; }
    });
    return out;
  }, [orders]);

  const W = Math.max(280, width), H = W < 520 ? 200 : 240, L = 56, R = 8, T = 12, B = 28;
  const pw = W - L - R, ph = H - T - B, base = T + ph;
  const peak = Math.max(...days.map((x) => x.total));
  const step = peak <= 0 ? 50 : [10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000].find((s) => s * 4 >= peak) || Math.ceil(peak / 4 / 1000) * 1000;
  const max = step * 4;
  const band = pw / days.length;
  const bw = Math.max(4, Math.min(26, band - 6));
  const every = W < 420 ? 3 : W < 620 ? 2 : 1;
  const y = (v) => base - (v / max) * ph;
  const bar = (x, top) => {
    const h = base - top; const r = Math.min(4, h, bw / 2);
    return `M${x},${base} V${top + r} Q${x},${top} ${x + r},${top} H${x + bw - r} Q${x + bw},${top} ${x + bw},${top + r} V${base} Z`;
  };
  const h = hover != null ? days[hover] : null;

  return (
    <div className="adm-chart" ref={box}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Chiffre d'affaires par jour sur les 14 derniers jours (détail dans le tableau qui suit)">
        {[0, 1, 2, 3, 4].map((g) => (
          <g key={g}>
            <line x1={L} x2={W - R} y1={y(g * step)} y2={y(g * step)} className={g === 0 ? 'adm-chart__base' : 'adm-chart__grid'} />
            <text x={L - 10} y={y(g * step)} className="adm-chart__y" dominantBaseline="middle" textAnchor="end">{numFmt.format(g * step)} €</text>
          </g>
        ))}
        {days.map((x, k) => {
          const cx = L + band * k + band / 2;
          return (
            <g key={x.key}>
              {x.total > 0 && <path d={bar(cx - bw / 2, y(x.total))} className={'adm-chart__bar' + (hover === k ? ' is-on' : '')} />}
              {(days.length - 1 - k) % every === 0 && <text x={cx} y={H - 8} className="adm-chart__x" textAnchor="middle">{x.d.getDate()}/{x.d.getMonth() + 1}</text>}
              <rect x={L + band * k} y={T} width={band} height={ph} fill="transparent" onMouseEnter={() => setHover(k)} onMouseLeave={() => setHover(null)} />
            </g>
          );
        })}
      </svg>
      {h && (
        <div className="adm-tip" style={{ left: `${((L + band * hover + band / 2) / W) * 100}%`, top: `${(Math.min(y(h.total), base - 8) / H) * 100}%` }}>
          <div className="adm-tip__date">{dayFmt.format(h.d)}</div>
          <div className="adm-tip__val">{fmt(h.total)}</div>
          <div className="adm-muted">{h.count} commande{h.count > 1 ? 's' : ''}</div>
        </div>
      )}
      {peak <= 0 && <p className="adm-chart__empty">Aucune vente sur la période.</p>}
      <table className="sr-only">
        <caption>Chiffre d'affaires par jour</caption>
        <thead><tr><th>Jour</th><th>Chiffre d'affaires</th><th>Commandes</th></tr></thead>
        <tbody>{days.map((x) => <tr key={x.key}><td>{dayFmt.format(x.d)}</td><td>{fmt(x.total)}</td><td>{x.count}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

/* ================= Commandes ================= */
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function Orders({ orders, setOrders, notify, catalog }) {
  const [filter, setFilter] = useState('toutes');
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState(null);
  const [saving, setSaving] = useState(false);
  if (!orders) return <div className="adm-skel" />;

  const counts = Object.fromEntries(Object.keys(ORDER_STATUS).map((k) => [k, orders.filter((o) => o.status === k).length]));
  const list = orders.filter((o) => (filter === 'toutes' || o.status === filter)
    && (!q || norm(`${o.num} ${o.customer.prenom} ${o.customer.nom} ${o.customer.email} ${o.address.ville}`).includes(norm(q))));
  const open = orders.find((o) => o.id === openId);

  const setStatus = async (status) => {
    setSaving(true);
    try {
      const saved = await backend.updateOrderStatus(open.id, status);
      setOrders((all) => all.map((o) => (o.id === saved.id ? saved : o)));
      notify(`${saved.num} : ${ORDER_STATUS[status].toLowerCase()}.`);
    } catch (e) { notify(e.message); }
    setSaving(false);
  };

  return (
    <div className="adm-stack">
      <div className="adm-toolbar">
        <div className="adm-chips" role="tablist" aria-label="Filtrer par statut">
          <button type="button" role="tab" aria-selected={filter === 'toutes'} className={filter === 'toutes' ? 'is-on' : ''} onClick={() => setFilter('toutes')}>Toutes <b>{orders.length}</b></button>
          {Object.entries(ORDER_STATUS).map(([k, label]) => (
            <button key={k} type="button" role="tab" aria-selected={filter === k} className={filter === k ? 'is-on' : ''} onClick={() => setFilter(k)}>{label} <b>{counts[k]}</b></button>
          ))}
        </div>
        <label className="adm-search"><I n="search" s={17} /><span className="sr-only">Rechercher</span>
          <input type="search" placeholder="N°, client, e-mail, ville" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      </div>

      <section className="adm-card adm-card--flush">
        {list.length === 0 ? (
          <Empty icon="orders" title={orders.length ? 'Aucune commande ne correspond' : "Aucune commande pour l'instant"}>
            {orders.length ? 'Changez le filtre ou la recherche.' : 'Les commandes passées sur la boutique arrivent ici.'}
          </Empty>
        ) : (
          <table className="adm-table">
            <thead><tr><th>Commande</th><th>Client</th><th>Articles</th><th>Paiement</th><th className="r">Total</th><th>Statut</th></tr></thead>
            <tbody>
              {list.map((o) => (
                <tr key={o.id} tabIndex={0} onClick={() => setOpenId(o.id)} onKeyDown={(e) => { if (e.key === 'Enter') setOpenId(o.id); }}>
                  <td data-label="Commande"><strong>{o.num}</strong><span className="adm-muted">{dateFmt.format(new Date(o.createdAt))}</span></td>
                  <td data-label="Client">{o.customer.prenom} {o.customer.nom}<span className="adm-muted">{o.customer.email}</span></td>
                  <td data-label="Articles">{itemsOf(o)}</td>
                  <td data-label="Paiement">{PAYMENTS[o.payment]}</td>
                  <td data-label="Total" className="r adm-num">{fmt(o.total)}</td>
                  <td data-label="Statut"><StatusPill status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <Drawer open={!!open} onClose={() => setOpenId(null)} title={open ? `Commande ${open.num}` : ''} sub={open ? dateFmt.format(new Date(open.createdAt)) : ''}>
        {open && (
          <div className="adm-stack adm-stack--tight">
            <div>
              <div className="adm-label">Statut</div>
              <div className="adm-steps" role="radiogroup" aria-label="Statut de la commande">
                {Object.entries(ORDER_STATUS).map(([k, label]) => (
                  <button key={k} type="button" role="radio" aria-checked={open.status === k} disabled={saving}
                    className={`adm-step adm-step--${k}` + (open.status === k ? ' is-on' : '')} onClick={() => open.status !== k && setStatus(k)}>
                    <i aria-hidden="true" />{label}
                  </button>
                ))}
              </div>
            </div>
            <div className="adm-info">
              <div><div className="adm-label"><I n="user" s={15} />Client</div>
                <p>{open.customer.prenom} {open.customer.nom}<br /><a href={`mailto:${open.customer.email}`}>{open.customer.email}</a><br />{open.customer.tel}</p></div>
              <div><div className="adm-label"><I n="pin" s={15} />Livraison</div>
                <p>{open.address.adresse}{open.address.complement && <><br />{open.address.complement}</>}<br />{open.address.cp} {open.address.ville}<br />{open.address.pays}</p></div>
              <div><div className="adm-label"><I n="truck" s={15} />Mode</div><p>{open.shipping.label}<br /><span className="adm-muted">{open.shipping.delay}</span></p></div>
              <div><div className="adm-label"><I n="card" s={15} />Paiement</div><p>{PAYMENTS[open.payment]}</p></div>
            </div>
            <div>
              <div className="adm-label">Articles</div>
              <ul className="adm-lines">
                {open.lines.map((l) => (
                  <li key={l.id + l.size}>
                    <span className="adm-thumb"><Photo name={catalog.byId(l.id)?.img || l.img} /></span>
                    <div><strong>{l.name}</strong><span className="adm-muted">Taille {l.size} · {l.qty} × {fmt(l.unit)}</span></div>
                    <span className="adm-num">{fmt(l.qty * l.unit)}</span>
                  </li>
                ))}
              </ul>
              <div className="adm-sum">
                <div><span>Sous-total</span><span>{fmt(open.subtotal)}</span></div>
                {open.discount > 0 && <div><span>Code {open.promo}</span><span>- {fmt(open.discount)}</span></div>}
                <div><span>Livraison</span><span>{open.shipping.price ? fmt(open.shipping.price) : 'Offerte'}</span></div>
                <div className="adm-sum__total"><span>Total TTC</span><span>{fmt(open.total)}</span></div>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

/* ================= Produits ================= */
const EMPTY_PRODUCT = { name: '', cat: 'clubs', league: '', type: 'Domicile', price: '', compareAt: '', desc: '', sizes: DEFAULT_SIZES, isNew: false, active: true, img: '' };

// Réduit une photo envoyée depuis l'ordinateur (largeur 1000 px max, WebP) pour qu'elle reste légère.
async function shrinkImage(file) {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1000 / bmp.width);
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
  return c.toDataURL('image/webp', 0.82);
}

function Products({ catalog, notify }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('tous');
  const [edit, setEdit] = useState(null);     // fiche en cours d'édition
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  if (!catalog.ready) return <div className="adm-skel" />;

  const list = catalog.all.filter((p) => (cat === 'tous' || p.cat === cat) && (!q || norm(`${p.name} ${p.league} ${p.type}`).includes(norm(q))));
  const openEdit = (p) => {
    setErrors({});
    setEdit(p ? { ...EMPTY_PRODUCT, ...p, price: String(p.price), compareAt: p.compareAt ? String(p.compareAt) : '', sizes: p.sizes || DEFAULT_SIZES } : { ...EMPTY_PRODUCT });
  };
  const set = (k, v) => setEdit((e) => ({ ...e, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    const price = parseFloat(String(edit.price).replace(',', '.'));
    const compareAt = edit.compareAt ? parseFloat(String(edit.compareAt).replace(',', '.')) : null;
    const errs = {};
    if (!edit.name.trim()) errs.name = 'Le nom est obligatoire.';
    if (!(price > 0)) errs.price = 'Indiquez un prix supérieur à 0.';
    if (compareAt != null && !(compareAt > price)) errs.compareAt = 'Le prix barré doit être plus élevé que le prix.';
    if (!edit.sizes.length) errs.sizes = 'Choisissez au moins une taille.';
    if (!edit.img) errs.img = 'Ajoutez une photo.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const out = { ...edit, name: edit.name.trim(), league: edit.league.trim(), type: edit.type.trim(), desc: edit.desc.trim(), price, sizes: ALL_SIZES.filter((s) => edit.sizes.includes(s)) };
      if (compareAt) out.compareAt = compareAt; else delete out.compareAt;
      delete out.badge;
      if (!out.sizes.length) out.sizes = DEFAULT_SIZES;
      await backend.saveProduct(out);
      await catalog.reload();
      notify(edit.id ? 'Maillot enregistré.' : 'Maillot ajouté au catalogue.');
      setEdit(null);
    } catch (ex) { notify(ex.message || 'Enregistrement impossible.'); }
    setBusy(false);
  };
  const toggleActive = async (p, active) => {
    try { await backend.saveProduct({ ...p, active }); await catalog.reload(); notify(active ? `${p.name} visible en boutique.` : `${p.name} masqué de la boutique.`); }
    catch (ex) { notify(ex.message); }
  };
  const remove = async () => {
    setBusy(true);
    try { await backend.deleteProduct(toDelete.id); await catalog.reload(); notify('Maillot supprimé.'); setToDelete(null); setEdit(null); }
    catch (ex) { notify(ex.message); }
    setBusy(false);
  };
  const onFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setErrors((x) => ({ ...x, img: 'Choisissez un fichier image.' })); return; }
    try { set('img', await shrinkImage(file)); setErrors((x) => ({ ...x, img: undefined })); }
    catch { setErrors((x) => ({ ...x, img: "Cette image n'a pas pu être lue." })); }
  };

  return (
    <div className="adm-stack">
      <div className="adm-toolbar">
        <div className="adm-toolbar__left">
          <label className="adm-search"><I n="search" s={17} /><span className="sr-only">Rechercher</span>
            <input type="search" placeholder="Rechercher un maillot" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <label><span className="sr-only">Catégorie</span>
            <select className="adm-input adm-select" value={cat} onChange={(e) => setCat(e.target.value)}>
              <option value="tous">Toutes les catégories</option>
              <option value="clubs">Clubs</option>
              <option value="selections">Sélections</option>
            </select>
          </label>
        </div>
        <button type="button" className="adm-btn adm-btn--primary" onClick={() => openEdit(null)}><I n="plus" />Ajouter un maillot</button>
      </div>

      <section className="adm-card adm-card--flush">
        {list.length === 0 ? (
          <Empty icon="shirt" title={catalog.all.length ? 'Aucun maillot ne correspond' : 'Le catalogue est vide'}>
            {catalog.all.length ? 'Changez la recherche ou la catégorie.' : 'Ajoutez votre premier maillot.'}
          </Empty>
        ) : (
          <table className="adm-table adm-table--products">
            <thead><tr><th>Maillot</th><th>Catégorie</th><th>Tailles</th><th className="r">Prix</th><th>Visible</th><th className="r"><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className={p.active === false ? 'is-off' : ''}>
                  <td data-label="Maillot">
                    <div className="adm-prod">
                      <span className="adm-thumb adm-thumb--lg"><Photo name={p.img} /></span>
                      <div><strong>{p.name}</strong><span className="adm-muted">{[p.league, p.type].filter(Boolean).join(' · ')}{p.isNew ? ' · Nouveauté' : ''}</span></div>
                    </div>
                  </td>
                  <td data-label="Catégorie">{CATS[p.cat]}</td>
                  <td data-label="Tailles" className="adm-muted">{(p.sizes || DEFAULT_SIZES).join(' · ')}</td>
                  <td data-label="Prix" className="r adm-num">
                    {fmt(p.price)}
                    {p.compareAt && <span className="adm-sale"><s>{fmt(p.compareAt)}</s> -{discountPct(p)} %</span>}
                  </td>
                  <td data-label="Visible"><Toggle checked={p.active !== false} onChange={(v) => toggleActive(p, v)} label={`Afficher ${p.name} en boutique`} /></td>
                  <td className="r adm-actions">
                    <button type="button" className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => openEdit(p)}><I n="edit" s={16} />Modifier</button>
                    <button type="button" className="adm-btn adm-btn--ghost adm-btn--icon adm-btn--sm" onClick={() => setToDelete(p)} aria-label={`Supprimer ${p.name}`}><I n="trash" s={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <Drawer open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Modifier le maillot' : 'Nouveau maillot'} sub={edit?.id ? edit.name : 'Il apparaîtra en boutique dès l\'enregistrement.'}
        foot={edit && (
          <>
            {edit.id && <button type="button" className="adm-btn adm-btn--ghost adm-btn--danger-text" onClick={() => setToDelete(edit)}><I n="trash" s={16} />Supprimer</button>}
            <span className="adm-grow" />
            <button type="button" className="adm-btn adm-btn--ghost" onClick={() => setEdit(null)}>Annuler</button>
            <button type="submit" form="adm-product" className="adm-btn adm-btn--primary" disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button>
          </>
        )}>
        {edit && (
          <form id="adm-product" className="adm-form" onSubmit={save} noValidate>
            <div className="adm-photo">
              <div className="adm-photo__preview">{edit.img ? <Photo name={edit.img} alt="Aperçu" /> : <I n="shirt" s={34} />}</div>
              <div>
                <div className="adm-label">Photo</div>
                <label className="adm-btn adm-btn--ghost adm-btn--sm adm-file">
                  <I n="upload" s={16} />{edit.img ? 'Changer la photo' : 'Choisir une photo'}
                  <input type="file" accept="image/*" onChange={(e) => onFile(e.target.files[0])} />
                </label>
                <p className="adm-hint">{isUrl(edit.img) || !edit.img ? 'Format carré ou portrait conseillé. Réduite automatiquement à 1000 px.' : 'Photo fournie avec le site.'}</p>
                {errors.img && <p className="adm-error">{errors.img}</p>}
              </div>
            </div>

            <label className="adm-field adm-field--full"><span>Nom du maillot</span>
              <input className="adm-input" value={edit.name} onChange={(e) => set('name', e.target.value)} placeholder="Ex. : Real Madrid Domicile" aria-invalid={!!errors.name} />
              {errors.name && <em className="adm-error">{errors.name}</em>}
            </label>
            <label className="adm-field"><span>Catégorie</span>
              <select className="adm-input adm-select" value={edit.cat} onChange={(e) => set('cat', e.target.value)}>
                <option value="clubs">Clubs</option><option value="selections">Sélections</option>
              </select>
            </label>
            <label className="adm-field"><span>Pays ou championnat</span>
              <input className="adm-input" value={edit.league} onChange={(e) => set('league', e.target.value)} placeholder="Ex. : Espagne" />
            </label>
            <label className="adm-field"><span>Type</span>
              <input className="adm-input" list="adm-types" value={edit.type} onChange={(e) => set('type', e.target.value)} />
              <datalist id="adm-types"><option value="Domicile" /><option value="Extérieur" /><option value="Third" /><option value="Édition spéciale" /><option value="Coupe femme" /><option value="Rétro" /></datalist>
            </label>
            <label className="adm-field"><span>Prix (€)</span>
              <input className="adm-input" inputMode="decimal" value={edit.price} onChange={(e) => set('price', e.target.value)} placeholder="89,90" aria-invalid={!!errors.price} />
              {errors.price && <em className="adm-error">{errors.price}</em>}
            </label>
            <label className="adm-field"><span>Prix barré (€) <small>facultatif, active la promo</small></span>
              <input className="adm-input" inputMode="decimal" value={edit.compareAt} onChange={(e) => set('compareAt', e.target.value)} placeholder="Ex. : 104,90" aria-invalid={!!errors.compareAt} />
              {errors.compareAt && <em className="adm-error">{errors.compareAt}</em>}
            </label>
            <label className="adm-field adm-field--full"><span>Description</span>
              <textarea className="adm-input adm-textarea" rows={3} value={edit.desc} onChange={(e) => set('desc', e.target.value)} placeholder="Couleurs, motif, finitions…" />
            </label>
            <fieldset className="adm-field adm-field--full">
              <legend>Tailles disponibles</legend>
              <div className="adm-sizes">
                {ALL_SIZES.map((s) => (
                  <label key={s} className={'adm-size' + (edit.sizes.includes(s) ? ' is-on' : '')}>
                    <input type="checkbox" checked={edit.sizes.includes(s)} onChange={(e) => set('sizes', e.target.checked ? [...edit.sizes, s] : edit.sizes.filter((x) => x !== s))} />{s}
                  </label>
                ))}
              </div>
              {errors.sizes && <em className="adm-error">{errors.sizes}</em>}
            </fieldset>
            <div className="adm-switches adm-field--full">
              <label className="adm-switch"><Toggle checked={edit.active !== false} onChange={(v) => set('active', v)} label="Visible en boutique" /><span><strong>Visible en boutique</strong><small>Masqué, il reste dans l'admin mais disparaît du site.</small></span></label>
              <label className="adm-switch"><Toggle checked={!!edit.isNew} onChange={(v) => set('isNew', v)} label="Nouveauté" /><span><strong>Nouveauté</strong><small>Apparaît dans la section Nouveautés de l'accueil.</small></span></label>
            </div>
          </form>
        )}
      </Drawer>

      {toDelete && <Confirm text={`Supprimer « ${toDelete.name} » du catalogue ? Cette action est définitive.`} onYes={remove} onNo={() => setToDelete(null)} busy={busy} />}
    </div>
  );
}

/* ================= Codes promo ================= */
function Promos({ catalog, notify }) {
  const [code, setCode] = useState('');
  const [percent, setPercent] = useState('10');
  const [err, setErr] = useState('');
  const [toDelete, setToDelete] = useState(null);

  const add = async (e) => {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    const pct = parseInt(percent, 10);
    if (!/^[A-Z0-9]{3,20}$/.test(c)) return setErr('Le code fait 3 à 20 lettres ou chiffres, sans espace.');
    if (!(pct >= 1 && pct <= 90)) return setErr('La remise va de 1 à 90 %.');
    if (catalog.promos.some((p) => p.code === c)) return setErr('Ce code existe déjà.');
    setErr('');
    try { await backend.savePromo({ code: c, percent: pct, active: true }); await catalog.reload(); setCode(''); notify(`Code ${c} créé.`); }
    catch (ex) { notify(ex.message); }
  };
  const toggle = async (p, active) => {
    try { await backend.savePromo({ ...p, active }); await catalog.reload(); notify(active ? `Code ${p.code} activé.` : `Code ${p.code} désactivé.`); }
    catch (ex) { notify(ex.message); }
  };
  const remove = async () => {
    try { await backend.deletePromo(toDelete.code); await catalog.reload(); notify(`Code ${toDelete.code} supprimé.`); }
    catch (ex) { notify(ex.message); }
    setToDelete(null);
  };

  return (
    <div className="adm-stack">
      <section className="adm-card">
        <div className="adm-card__head"><h2>Nouveau code</h2></div>
        <form className="adm-promo-form" onSubmit={add} noValidate>
          <label className="adm-field"><span>Code</span>
            <input className="adm-input adm-mono" value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} placeholder="Ex. : ETE20" maxLength={20} />
          </label>
          <label className="adm-field"><span>Remise (%)</span>
            <input className="adm-input" inputMode="numeric" value={percent} onChange={(e) => setPercent(e.target.value.replace(/\D/g, '').slice(0, 2))} />
          </label>
          <button className="adm-btn adm-btn--primary"><I n="plus" />Créer le code</button>
        </form>
        {err && <p className="adm-error" role="alert">{err}</p>}
      </section>

      <section className="adm-card adm-card--flush">
        {catalog.promos.length === 0 ? <Empty icon="percent" title="Aucun code promo" /> : (
          <table className="adm-table">
            <thead><tr><th>Code</th><th>Remise</th><th>Actif</th><th className="r"><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {catalog.promos.map((p) => (
                <tr key={p.code} className={p.active ? '' : 'is-off'}>
                  <td data-label="Code"><span className="adm-code">{p.code}</span></td>
                  <td data-label="Remise">{p.percent} %</td>
                  <td data-label="Actif"><Toggle checked={!!p.active} onChange={(v) => toggle(p, v)} label={`Activer le code ${p.code}`} /></td>
                  <td className="r adm-actions"><button type="button" className="adm-btn adm-btn--ghost adm-btn--icon adm-btn--sm" onClick={() => setToDelete(p)} aria-label={`Supprimer le code ${p.code}`}><I n="trash" s={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      {toDelete && <Confirm text={`Supprimer le code ${toDelete.code} ? Les clients ne pourront plus l'utiliser.`} onYes={remove} onNo={() => setToDelete(null)} />}
    </div>
  );
}
