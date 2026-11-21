import { useEffect, useRef, useState } from 'react';
import { BASE, CATS, discountPct, fmt, FREE_SHIP } from './data.js';
import { lineKey, useCatalog, useStore } from './store.jsx';
import GlassSurface from './GlassSurface.jsx';

/* ---------- Icônes SVG ---------- */
const ICONS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/>',
  bag: '<path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V7a3 3 0 0 1 6 0v1"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  left: '<path d="m15 6-6 6 6 6"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  truck: '<path d="M3 6h11v10H3zM14 9h4l3 3.5V16h-7z"/><circle cx="7.5" cy="17.5" r="1.8"/><circle cx="17.5" cy="17.5" r="1.8"/>',
  refresh: '<path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.5"/><path d="M20 4v4.5h-4.5"/><path d="M20 12a8 8 0 0 1-13.7 5.6L4 15.5"/><path d="M4 20v-4.5h4.5"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  ruler: '<path d="m3 16 13-13 5 5L8 21l-5-5Z"/><path d="m7 12 2 2M10 9l2 2M13 6l2 2"/>',
  trash: '<path d="M4 7h16M10 4h4M6 7l1 13h10l1-13M10 11v5M14 11v5"/>',
  card: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h3"/>',
  wallet: '<path d="M4 7a2 2 0 0 1 2-2h11v4"/><path d="M4 7v10a2 2 0 0 0 2 2h14V9H6a2 2 0 0 1-2-2Z"/><circle cx="16.5" cy="14" r="1"/>',
  box: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/>',
  pin: '<path d="M12 21s7-6.2 7-11.5a7 7 0 0 0-14 0C5 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>',
  mail: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="m4 7 8 6 8-6"/>',
  instagram: '<rect x="4" y="4" width="16" height="16" rx="4.5"/><circle cx="12" cy="12" r="3.6"/><circle cx="16.6" cy="7.4" r=".6" fill="currentColor"/>',
  youtube: '<rect x="3" y="6" width="18" height="12" rx="3.5"/><path d="m10.5 9.5 4 2.5-4 2.5v-5Z"/>',
  pen: '<path d="m4 20 1-4L16.5 4.5l3 3L8 19l-4 1Z"/><path d="m14 7 3 3"/>',
  zoom: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6M11 8v6M8 11h6"/>'
};
export function Icon({ name, size = 20 }) {
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICONS[name] || '' }} />
  );
}

/* ---------- Logo NStore Football ---------- */
/* Logo NStore Football (images détourées, voir tools/make-logo.mjs).
   light : version blanc et rouge pour fond sombre ; stacked : logo complet empilé. */
export function Logo({ light = false, stacked = false }) {
  if (stacked) return <img className="logo logo--stacked" src={`${BASE}img/logo-full.webp`} alt="NStore Football" width="720" height="435" />;
  const sfx = light ? '-light' : '';
  return (
    <span className={'logo' + (light ? ' logo--light' : '')}>
      <img className="logo__mark" src={`${BASE}img/logo-mark${sfx}.webp`} alt="" width="253" height="200" />
      <img className="logo__word" src={`${BASE}img/logo-word${sfx}.webp`} alt="NStore Football" width="670" height="120" />
    </span>
  );
}

/* ---------- Photo : une source PC, une source téléphone ----------
   name est soit un nom d'image du dossier public/img (p1 → p1-desktop.jpg / p1-mobile.jpg),
   soit une adresse complète (image ajoutée depuis l'admin). */
export const isUrl = (name) => /^(data:|https?:|blob:)/.test(name || '');
export function Photo({ name, alt = '', eager = false, className, ext = 'jpg' }) {
  if (isUrl(name)) {
    return <picture><img className={className} src={name} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" /></picture>;
  }
  return (
    <picture>
      <source media="(max-width: 640px)" srcSet={`${BASE}img/${name}-mobile.${ext}`} />
      <img className={className} src={`${BASE}img/${name}-desktop.${ext}`} alt={alt} loading={eager ? 'eager' : 'lazy'} decoding="async" />
    </picture>
  );
}

/* ---------- Apparition des blocs au défilement ---------- */
export function Reveal({ as: Tag = 'div', delay = 0, className = '', children, ...rest }) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!('IntersectionObserver' in window)) { setOn(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } },
      { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref} className={`reveal${on ? ' is-in' : ''} ${className}`} style={{ transitionDelay: delay + 'ms' }} {...rest}>
      {children}
    </Tag>
  );
}

/* ---------- Produit ---------- */
export function Price({ p }) {
  return p.compareAt
    ? <span className="price price--sale"><s>{fmt(p.compareAt)}</s>{fmt(p.price)}</span>
    : <span className="price">{fmt(p.price)}</span>;
}
export function ProductCard({ p, index = 0 }) {
  return (
    <Reveal delay={(index % 4) * 70}>
      <a className="card" href={`#/produit/${p.id}`}>
        <div className="card__media">
          {p.compareAt && <span className="card__badge card__badge--sale">-{discountPct(p)} %</span>}
          <Photo name={p.img} alt={`Maillot ${p.name}`} />
          {p.imgBack && <span className="card__back" aria-hidden="true"><Photo name={p.imgBack} alt="" /></span>}
          <span className="card__cta" aria-hidden="true">
            <GlassSurface width="100%" height="100%" borderRadius={22} distortionScale={-180} displace={0.5} backgroundOpacity={0.1}>
              <span className="card__cta-label">Voir le maillot <Icon name="arrow" size={16} /></span>
            </GlassSurface>
          </span>
        </div>
        <div className="card__info">
          <div>
            <div className="card__name">{p.name}</div>
            <div className="card__sub">{CATS[p.cat]} · {p.type}</div>
          </div>
          <Price p={p} />
        </div>
      </a>
    </Reveal>
  );
}

/* ---------- Panier : lignes, barre de livraison, récapitulatif ---------- */
function lineMeta(l) {
  return 'Taille ' + l.size;
}
export function CartLine({ l, mini = false }) {
  const { setQty, remove } = useStore();
  const { byId } = useCatalog();
  // l.name / l.img / l.unit : copie enregistrée avec une commande, au cas où le maillot a changé depuis
  const p = byId(l.id) || (l.name ? { id: l.id, name: l.name, img: l.img, price: l.unit } : null);
  if (!p) return null;
  const unit = l.unit ?? p.price;
  const k = lineKey(l);
  if (mini) {
    return (
      <div className="line">
        <div className="line__img"><Photo name={p.img} alt="" /><span className="line__qty">{l.qty}</span></div>
        <div>
          <div className="line__top"><span className="line__name">{p.name}</span><span className="line__price">{fmt(unit * l.qty)}</span></div>
          <div className="line__meta">{lineMeta(l)}</div>
        </div>
      </div>
    );
  }
  return (
    <div className="line">
      <a className="line__img" href={`#/produit/${p.id}`} aria-label={p.name}><Photo name={p.img} alt="" /></a>
      <div>
        <div className="line__top">
          <div>
            <a className="line__name" href={`#/produit/${p.id}`}>{p.name}</a>
            <div className="line__meta">{lineMeta(l)}</div>
          </div>
          <span className="line__price">{fmt(unit * l.qty)}</span>
        </div>
        <div className="line__bottom">
          <div className="qty qty--sm">
            <button onClick={() => setQty(k, l.qty - 1)} aria-label="Diminuer la quantité"><Icon name="minus" size={16} /></button>
            <span>{l.qty}</span>
            <button onClick={() => setQty(k, l.qty + 1)} aria-label="Augmenter la quantité"><Icon name="plus" size={16} /></button>
          </div>
          <button className="line__remove" onClick={() => remove(k)}><Icon name="trash" size={16} />Retirer</button>
        </div>
      </div>
    </div>
  );
}
export function ShipBar() {
  const { totals } = useStore();
  const left = FREE_SHIP - totals.after;
  const pct = Math.min(100, Math.max(0, (totals.after / FREE_SHIP) * 100));
  return (
    <div className="ship-bar">
      {left > 0
        ? <>Plus que <strong>{fmt(left)}</strong> pour la livraison offerte</>
        : <span className="ok"><Icon name="check" size={16} />Livraison standard offerte</span>}
      <div className="ship-bar__track"><div className="ship-bar__fill" style={{ width: pct + '%' }} /></div>
    </div>
  );
}
export function EmptyCart() {
  return (
    <div className="empty">
      <Icon name="bag" size={40} />
      <h2>Votre panier est vide</h2>
      <p>Parcourez la collection et trouvez vos couleurs.</p>
      <a className="btn btn--primary" href="#/boutique">Voir la boutique</a>
    </div>
  );
}
export function PromoBox() {
  const { promo, applyPromo, removePromo } = useStore();
  const [code, setCode] = useState('');
  if (promo) {
    return <div className="promo-on"><span>Code {promo} appliqué</span><button type="button" onClick={removePromo}>Retirer</button></div>;
  }
  const submit = async () => { if (await applyPromo(code)) setCode(''); };
  return (
    <>
      <div className="promo">
        <label className="sr-only" htmlFor="promo-in">Code promo</label>
        <input className="input" id="promo-in" placeholder="Code promo" autoComplete="off" value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }} />
        <button className="btn btn--ghost btn--sm" type="button" onClick={submit}>Appliquer</button>
      </div>
      <p className="hint">Première commande : BIENVENUE10 pour 10 % de remise.</p>
    </>
  );
}
export function Summary({ withShipping = false, t: given, promoCode }) {
  const store = useStore();
  const t = given || store.totals;
  const promo = promoCode !== undefined ? promoCode : store.promo;
  return (
    <>
      <div className="sum-row"><span>Sous-total</span><b>{fmt(t.sub)}</b></div>
      {t.discount > 0 && <div className="sum-row"><span>Code {promo}</span><span className="green">- {fmt(t.discount)}</span></div>}
      <div className="sum-row">
        <span>Livraison</span>
        {withShipping
          ? (t.shipping ? <b>{fmt(t.shipping)}</b> : <span className="green">Offerte</span>)
          : (t.after >= FREE_SHIP ? <span className="green">Offerte</span> : <span>Calculée à l'étape suivante</span>)}
      </div>
      <div className="sum-row sum-row--total"><span>Total TTC</span><strong>{fmt(withShipping ? t.total : t.after)}</strong></div>
    </>
  );
}

/* ---------- Lettre d'information ---------- */
export function NewsForm({ id }) {
  const { notify } = useStore();
  const [mail, setMail] = useState('');
  const submit = (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail.trim())) { notify('Saisissez une adresse e-mail valide.'); return; }
    setMail(''); notify('Merci, votre inscription est enregistrée.');
  };
  return (
    <form className="news-form" onSubmit={submit} noValidate>
      <label className="sr-only" htmlFor={id}>Adresse e-mail</label>
      <input id={id} type="email" placeholder="Adresse e-mail" autoComplete="email" value={mail} onChange={(e) => setMail(e.target.value)} />
      <button type="submit" aria-label="S'inscrire"><Icon name="arrow" /></button>
    </form>
  );
}
