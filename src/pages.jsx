import { useEffect, useMemo, useRef, useState } from 'react';
import { CATS, DEFAULT_SIZES, discountPct, fmt, FREE_SHIP, inCat, PAYMENTS, SHIPPING, SLIDES } from './data.js';
import { go, useCatalog, useStore } from './store.jsx';
import { CartLine, EmptyCart, Icon, NewsForm, Photo, ProductCard, PromoBox, Reveal, ShipBar, Summary } from './ui.jsx';

function useTitle(title) {
  useEffect(() => { document.title = title ? `${title} — NStore Football` : 'NStore Football — Maillots de football'; }, [title]);
}

/* ================= Accueil ================= */
function HeroSlider() {
  const { byId } = useCatalog();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const startX = useRef(null);
  const n = SLIDES.length;
  const next = () => setI((v) => (v + 1) % n);
  const prev = () => setI((v) => (v - 1 + n) % n);

  return (
    <section className={'hero' + (paused ? ' is-paused' : '')} aria-roledescription="carrousel" aria-label="À la une"
      onPointerEnter={(e) => e.pointerType === 'mouse' && setPaused(true)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && setPaused(false)}
      onTouchStart={(e) => { startX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (startX.current == null) return;
        const dx = e.changedTouches[0].clientX - startX.current;
        if (Math.abs(dx) > 45) (dx < 0 ? next : prev)();
        startX.current = null;
      }}
      onKeyDown={(e) => { if (e.key === 'ArrowRight') next(); if (e.key === 'ArrowLeft') prev(); }}>
      <h1 className="sr-only">NStore Football, maillots de football</h1>
      {SLIDES.map((s, k) => {
        const p = byId(s.product);
        const live = p && p.active !== false;
        const on = k === i;
        return (
          <div key={s.product} className={'slide' + (on ? ' is-active' : '')} aria-hidden={!on}>
            <div className="slide__media">
              <Photo name={s.img} alt={on ? s.alt : ''} eager />
              <div className="marquee" aria-hidden="true">
                <div className="marquee__track">
                  {Array.from({ length: 12 }, (_, j) => <span key={j}>{s.word}</span>)}
                </div>
              </div>
            </div>
            <div className="container slide__in">
              <div className="slide__txt">
                <span className="tag">{s.tag}{live && p.compareAt ? ` · -${discountPct(p)} %` : ''}</span>
                <h2>{s.title}</h2>
                <p>{s.text}</p>
                {live && <div className="slide__price">{fmt(p.price)}{p.compareAt && <s>{fmt(p.compareAt)}</s>}</div>}
                <div className="slide__cta">
                  <a className="btn btn--light" href={live ? `#/produit/${p.id}` : '#/boutique'} tabIndex={on ? 0 : -1}>Découvrir le maillot <Icon name="arrow" size={18} /></a>
                  <a className="btn btn--glass" href="#/boutique" tabIndex={on ? 0 : -1}>Toute la collection</a>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      <div className="hero__nav">
        <div className="container hero__nav-in">
          <div className="hero__bars">
            {SLIDES.map((s, k) => (
              <button key={s.product} className={'bar' + (k === i ? ' is-on' : k < i ? ' is-done' : '')} onClick={() => setI(k)}
                aria-label={`Afficher la diapositive ${k + 1} : ${s.title}`} aria-current={k === i}>
                <span onAnimationEnd={k === i ? next : undefined} />
              </button>
            ))}
          </div>
          <span className="hero__count">0{i + 1} / 0{n}</span>
          <div className="hero__arrows">
            <button onClick={prev} aria-label="Diapositive précédente"><Icon name="left" /></button>
            <button onClick={next} aria-label="Diapositive suivante"><Icon name="chevron" /></button>
          </div>
        </div>
      </div>
    </section>
  );
}

const ASSURE = [
  ['truck', 'Livraison offerte', 'Dès 100 € d\'achat'],
  ['refresh', 'Retours gratuits', 'Sous 30 jours'],
  ['box', 'Expédition sous 48 h', 'Colis suivi jusqu\'à chez vous'],
  ['lock', 'Paiement sécurisé', 'Carte, PayPal ou à la livraison']
];
const BEAMS = [
  ['4%', '-34deg', '9deg', '7s', '0s'], ['4%', '-18deg', '11deg', '8.5s', '-3s'],
  ['50%', '-6deg', '12deg', '9s', '-1.5s'], ['50%', '8deg', '12deg', '10s', '-5s'],
  ['96%', '20deg', '11deg', '8s', '-2s'], ['96%', '34deg', '9deg', '7.5s', '-4.5s']
];
const TILES = [['homme', 'cat-homme'], ['femme', 'cat-femme']];

export function Home() {
  useTitle('');
  const { products: PRODUCTS, byId } = useCatalog();
  const news = PRODUCTS.filter((p) => p.isNew);
  const barca = byId('barcelone-crop-femme');
  return (
    <>
      <HeroSlider />

      <section className="section section--tight">
        <div className="container">
          <Reveal className="assure">
            {ASSURE.map(([ic, t, d]) => (
              <div className="assure__item" key={t}><Icon name={ic} size={24} /><div><strong>{t}</strong><span>{d}</span></div></div>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 32 }}>
        <div className="container">
          <Reveal className="section__head">
            <div><p className="eyebrow">Parcourir</p><h2>Choisissez votre vestiaire</h2></div>
            <a className="link" href="#/boutique">Tout voir <Icon name="arrow" size={16} /></a>
          </Reveal>
          <div className="cats">
            {TILES.map(([cat, img], k) => (
              <Reveal key={cat} delay={k * 90}>
                <a className="cat" href={`#/boutique?cat=${cat}`}>
                  <Photo name={img} alt="" />
                  <div className="cat__label">
                    <div><strong>{CATS[cat]}</strong><span>{((n) => `${n} ${n > 1 ? 'maillots' : 'maillot'}`)(PRODUCTS.filter((p) => inCat(p, cat)).length)}</span></div>
                    <Icon name="arrow" />
                  </div>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <Reveal className="section__head">
            <div><p className="eyebrow">La collection</p><h2>Tous nos maillots</h2></div>
            <a className="link" href="#/boutique">Ouvrir la boutique <Icon name="arrow" size={16} /></a>
          </Reveal>
          <div className="grid">{PRODUCTS.map((p, k) => <ProductCard key={p.id} p={p} index={k} />)}</div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <Reveal className="feature">
            {/* Décor, lumières, puis le maillot détouré par-dessus : la lumière passe derrière lui */}
            <div className="feature__stage">
              <Photo name="promo-barca" alt="Maillot FC Barcelone Crop Top Femme dans un stade baigné de violet" />
              <div className="feature__lights" aria-hidden="true">
                {BEAMS.map(([x, a, sw, t, d], k) => (
                  <i key={k} className="beam" style={{ '--x': x, '--a': a, '--s': sw, '--t': t, '--d': d }} />
                ))}
              </div>
              <span className="feature__bloom" aria-hidden="true" />
              <span className="feature__shade" aria-hidden="true" />
              <Photo name="promo-barca-cut" ext="webp" />
            </div>
            <div className="feature__txt">
              <h2>Barça, côté <em>nuit</em>.</h2>
              <p>Le crop top noir qui fond vers le violet, marquages dorés.</p>
              {barca && <div className="feature__price">{fmt(barca.price)}</div>}
              <a className="btn btn--violet" href="#/produit/barcelone-crop-femme">
                <span className="lbl-long">Découvrir le maillot</span><span className="lbl-short">Découvrir</span>
                <Icon name="arrow" size={18} />
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <Reveal className="section__head"><div><p className="eyebrow">Tout juste arrivés</p><h2>Nouveautés</h2></div></Reveal>
          <div className="grid">{news.map((p, k) => <ProductCard key={p.id} p={p} index={k} />)}</div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <Reveal className="newsletter">
            <div><h2>Soyez prévenu des nouveautés.</h2><p>Les éditions spéciales partent vite. Recevez l'annonce une fois par mois, sans relance.</p></div>
            <NewsForm id="news-home" />
          </Reveal>
        </div>
      </section>
    </>
  );
}

/* ================= Boutique ================= */
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export function Shop({ params }) {
  const cat = CATS[params.cat] ? params.cat : 'tous';
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('pertinence');
  const input = useRef(null);
  const { products: PRODUCTS } = useCatalog();
  useTitle(cat === 'tous' ? 'Boutique' : CATS[cat]);
  useEffect(() => { if (params.focus) input.current?.focus(); }, [params.focus]);

  const list = useMemo(() => {
    const l = PRODUCTS.filter((p) => inCat(p, cat) && (!q || norm(`${p.name} ${p.league} ${p.type} ${CATS[p.cat]}`).includes(norm(q))));
    if (sort === 'asc') l.sort((a, b) => a.price - b.price);
    if (sort === 'desc') l.sort((a, b) => b.price - a.price);
    if (sort === 'new') l.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    return l;
  }, [cat, q, sort, PRODUCTS]);

  const chips = [['tous', 'Tous'], ...Object.entries(CATS)];
  return (
    <div className="container">
      <Reveal className="page-head">
        <p className="eyebrow">Boutique</p>
        <h1>{cat === 'tous' ? 'Tous les maillots' : `Maillots ${CATS[cat].toLowerCase()}`}</h1>
        <p>Tissu respirant, finitions soignées, expédition sous 48 h.</p>
      </Reveal>
      <div className="toolbar">
        <div className="chips">
          {chips.map(([c, label]) => (
            <a key={c} className={'chip' + (c === cat ? ' is-on' : '')} href={c === 'tous' ? '#/boutique' : `#/boutique?cat=${c}`}>{label}</a>
          ))}
        </div>
        <div className="toolbar__right">
          <label className="search"><Icon name="search" size={18} /><span className="sr-only">Rechercher</span>
            <input ref={input} type="search" placeholder="Rechercher une équipe" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <label><span className="sr-only">Trier</span>
            <select className="select" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="pertinence">Pertinence</option>
              <option value="asc">Prix croissant</option>
              <option value="desc">Prix décroissant</option>
              <option value="new">Nouveautés</option>
            </select>
          </label>
        </div>
      </div>
      <p className="count">{list.length} {list.length > 1 ? 'maillots' : 'maillot'}</p>
      <div className="grid" style={{ paddingBottom: 96 }} key={cat + sort}>
        {list.length ? list.map((p, k) => <ProductCard key={p.id} p={p} index={k} />) : (
          <div className="empty" style={{ gridColumn: '1 / -1' }}>
            <Icon name="search" size={40} /><h2>Aucun maillot trouvé</h2><p>Essayez un autre nom d'équipe ou de pays.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= Fiche produit ================= */
export function Product({ id }) {
  const { ready, byId, products: PRODUCTS } = useCatalog();
  const found = byId(id);
  const p = found && found.active !== false ? found : null;
  const { add, setLayer } = useStore();
  const [size, setSize] = useState(null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState(null);
  const sizesRef = useRef(null);
  useTitle(p ? p.name : ready ? 'Page introuvable' : '');
  if (!ready) return <div className="container" style={{ minHeight: '60vh' }} />;
  if (!p) return <NotFound />;

  const sizes = p.sizes || DEFAULT_SIZES;
  const unit = p.price;
  const related = PRODUCTS.filter((x) => x.id !== p.id).sort((a, b) => (a.cat === p.cat ? 0 : 1) - (b.cat === p.cat ? 0 : 1)).slice(0, 4);

  const item = () => {
    if (!size) {
      setError('Sélectionnez une taille pour continuer.');
      sizesRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return null;
    }
    return { id: p.id, size, qty };
  };
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };

  return (
    <div className="container">
      <nav className="crumbs" aria-label="Fil d'Ariane">
        <a href="#/">Accueil</a><Icon name="chevron" size={14} />
        <a href={`#/boutique?cat=${p.cat}`}>{CATS[p.cat]}</a><Icon name="chevron" size={14} />
        <span>{p.name}</span>
      </nav>
      <div className="pdp">
        <Reveal className="pdp__media">
          <div className={'pdp__stage' + (zoom ? ' is-zoom' : '')} onMouseMove={onMove} onMouseLeave={() => setZoom(null)}>
            {p.compareAt && <span className="card__badge card__badge--sale">-{discountPct(p)} %</span>}
            <div className="pdp__zoom" style={zoom ? { transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}>
              <Photo name={p.img} alt={`Maillot ${p.name}`} eager />
            </div>
            <span className="pdp__hint"><Icon name="zoom" size={16} />Survolez pour zoomer</span>
          </div>
        </Reveal>

        <Reveal className="pdp__info" delay={120}>
          <p className="eyebrow">{CATS[p.cat]} · {p.league} · {p.type}</p>
          <h1>Maillot {p.name}</h1>
          <div className="pdp__price">
            <span>{fmt(unit)}</span>
            {p.compareAt && <><s>{fmt(p.compareAt)}</s><span className="tag-sale">-{discountPct(p)} %</span></>}
          </div>
          <p className="pdp__tax">TVA incluse. Expédié sous 48 h.</p>
          <p className="pdp__desc">{p.desc}</p>

          <div className="field-head">
            <span>Taille{size ? ` : ${size}` : ''}</span>
            <button type="button" onClick={() => setLayer('sizes')}><Icon name="ruler" size={16} />Guide des tailles</button>
          </div>
          <div className="sizes" role="group" aria-label="Choisir une taille" ref={sizesRef} style={{ gridTemplateColumns: `repeat(${sizes.length}, 1fr)` }}>
            {sizes.map((s) => (
              <button key={s} className={'size' + (s === size ? ' is-on' : '')} aria-pressed={s === size} onClick={() => { setSize(s); setError(''); }}>{s}</button>
            ))}
          </div>
          <p className="size-error" role="alert">{error}</p>

          <div className="buy">
            <div className="qty">
              <button onClick={() => setQty((v) => Math.max(1, v - 1))} aria-label="Diminuer la quantité"><Icon name="minus" size={18} /></button>
              <span>{qty}</span>
              <button onClick={() => setQty((v) => Math.min(10, v + 1))} aria-label="Augmenter la quantité"><Icon name="plus" size={18} /></button>
            </div>
            <button className="btn btn--primary" onClick={() => { const it = item(); if (it) { add(it); setLayer('cart'); } }}>
              <Icon name="bag" size={18} />Ajouter au panier · {fmt(unit * qty)}
            </button>
            <button className="btn btn--ghost" onClick={() => { const it = item(); if (it) { add(it); go('#/commande'); } }}>Commander maintenant</button>
          </div>

          <ul className="perks">
            <li><Icon name="truck" />Livraison offerte dès {fmt(FREE_SHIP)} d'achat</li>
            <li><Icon name="refresh" />Retours gratuits sous 30 jours</li>
            <li><Icon name="lock" />Paiement sécurisé</li>
          </ul>

          <div className="acc">
            <details open>
              <summary>Description<Icon name="down" size={18} /></summary>
              <div className="acc__body"><p>{p.desc} Maille légère et respirante, coupe droite : ni ajustée, ni ample.</p></div>
            </details>
            <details>
              <summary>Composition et entretien<Icon name="down" size={18} /></summary>
              <div className="acc__body"><ul>
                <li>100 % polyester, maille respirante à séchage rapide</li>
                <li>Lavage à 30 °C sur l'envers, pas de sèche-linge</li>
                <li>Ne pas repasser sur les marquages</li>
              </ul></div>
            </details>
            <details>
              <summary>Livraison et retours<Icon name="down" size={18} /></summary>
              <div className="acc__body"><ul>
                <li>Standard : 2 à 4 jours ouvrés, offerte dès {fmt(FREE_SHIP)}</li>
                <li>Point relais : 3 à 5 jours ouvrés</li>
                <li>Express : le lendemain avant 13 h</li>
                <li>Retour gratuit sous 30 jours, article non porté</li>
              </ul></div>
            </details>
          </div>
        </Reveal>
      </div>

      <section className="section" style={{ paddingTop: 48 }}>
        <Reveal className="section__head"><h2>Vous aimerez aussi</h2></Reveal>
        <div className="grid">{related.map((x, k) => <ProductCard key={x.id} p={x} index={k} />)}</div>
      </section>
    </div>
  );
}

/* ================= Panier ================= */
export function Cart() {
  useTitle('Panier');
  const { cart, count } = useStore();
  if (!cart.length) return <div className="container"><EmptyCart /></div>;
  return (
    <div className="container">
      <Reveal className="page-head"><h1>Votre panier</h1><p>{count} {count > 1 ? 'articles' : 'article'}</p></Reveal>
      <div className="cols">
        <Reveal>
          <div className="cart-list">{cart.map((l) => <CartLine key={[l.id, l.size, l.name, l.number].join('|')} l={l} />)}</div>
          <p style={{ marginTop: 20 }}><a className="link" href="#/boutique">Continuer mes achats</a></p>
        </Reveal>
        <Reveal as="aside" className="panel panel--sticky" delay={120}>
          <h2>Récapitulatif</h2>
          <ShipBar />
          <PromoBox />
          <div style={{ marginTop: 14 }}><Summary /></div>
          <div className="foot-actions"><a className="btn btn--primary btn--block" href="#/commande">Passer la commande <Icon name="arrow" size={18} /></a></div>
          <p className="sum-note"><Icon name="lock" size={14} />Paiement sécurisé</p>
        </Reveal>
      </div>
    </div>
  );
}

/* ================= Commande ================= */
function Field({ id, label, full, ...rest }) {
  return (
    <div className={full ? 'full' : ''}>
      <label className="label" htmlFor={id}>{label}</label>
      <input className="input" id={id} name={id} {...rest} />
    </div>
  );
}
const PAYS = ['France', 'Belgique', 'Suisse', 'Luxembourg', 'Algérie', 'Maroc', 'Tunisie', 'Canada'];
const PAY = {
  carte: ['card', 'Carte bancaire', 'Visa, Mastercard, CB'],
  paypal: ['wallet', 'PayPal', 'Vous serez redirigé pour valider le paiement'],
  livraison: ['box', 'Paiement à la livraison', 'En espèces ou par carte, à la remise du colis']
};

export function Checkout() {
  useTitle('Commande');
  const { cart, totals, promo, ship, setShip, placeOrder, notify } = useStore();
  const { byId } = useCatalog();
  const [pay, setPay] = useState('carte');
  const [sending, setSending] = useState(false);
  const [card, setCard] = useState({ num: '', exp: '', cvc: '' });
  if (!cart.length) return <div className="container"><EmptyCart /></div>;

  const submit = async (e) => {
    e.preventDefault();
    if (sending) return;
    const f = new FormData(e.currentTarget);
    const v = (k) => String(f.get(k) || '').trim();
    const m = SHIPPING[ship];
    setSending(true);
    try {
      await placeOrder({
        customer: { prenom: v('prenom'), nom: v('nom'), email: v('email'), tel: v('tel') },
        address: { adresse: v('adresse'), complement: v('complement'), cp: v('cp'), ville: v('ville'), pays: v('pays') },
        shipping: { method: ship, label: m.label, delay: m.delay, price: totals.shipping },
        payment: pay,
        promo,
        lines: cart.map((l) => { const p = byId(l.id); return { id: l.id, name: p.name, img: p.img, size: l.size, qty: l.qty, unit: p.price }; }),
        subtotal: totals.sub, discount: totals.discount, total: totals.total
      });
      go('#/confirmation');
    } catch (err) {
      notify(err.message || 'La commande n\'a pas pu être enregistrée.');
      setSending(false);
    }
  };

  return (
    <div className="container">
      <nav className="crumbs" aria-label="Étapes">
        <a href="#/panier">Panier</a><Icon name="chevron" size={14} />
        <span className="crumbs__on">Commande</span><Icon name="chevron" size={14} /><span>Confirmation</span>
      </nav>
      <div className="page-head" style={{ paddingTop: 20 }}><h1>Finaliser la commande</h1></div>
      <form className="cols" onSubmit={submit}>
        <div>
          <Reveal as="section" className="co-step">
            <h2><i>1</i>Coordonnées</h2>
            <div className="form-grid">
              <Field id="email" label="Adresse e-mail" type="email" required autoComplete="email" placeholder="vous@exemple.fr" />
              <Field id="tel" label="Téléphone" type="tel" required autoComplete="tel" placeholder="06 12 34 56 78" />
            </div>
          </Reveal>
          <Reveal as="section" className="co-step" delay={60}>
            <h2><i>2</i>Adresse de livraison</h2>
            <div className="form-grid">
              <Field id="prenom" label="Prénom" required autoComplete="given-name" />
              <Field id="nom" label="Nom" required autoComplete="family-name" />
              <Field id="adresse" label="Adresse" full required autoComplete="address-line1" placeholder="Numéro et nom de rue" />
              <Field id="complement" label="Complément (facultatif)" full autoComplete="address-line2" placeholder="Bâtiment, étage, interphone" />
              <Field id="cp" label="Code postal" required autoComplete="postal-code" inputMode="numeric" />
              <Field id="ville" label="Ville" required autoComplete="address-level2" />
              <div className="full">
                <label className="label" htmlFor="pays">Pays</label>
                <select className="input" id="pays" name="pays" autoComplete="country-name">{PAYS.map((c) => <option key={c}>{c}</option>)}</select>
              </div>
            </div>
          </Reveal>
          <Reveal as="section" className="co-step" delay={120}>
            <h2><i>3</i>Mode de livraison</h2>
            <div className="opts">
              {Object.entries(SHIPPING).map(([k, m]) => (
                <label className="opt" key={k}>
                  <input type="radio" name="ship" value={k} checked={ship === k} onChange={() => setShip(k)} />
                  <span className="opt__txt"><strong>{m.label}</strong><span>{m.delay}</span></span>
                  <span className="opt__price">{totals.priceOf(k) ? fmt(totals.priceOf(k)) : 'Offerte'}</span>
                </label>
              ))}
            </div>
          </Reveal>
          <Reveal as="section" className="co-step" delay={180}>
            <h2><i>4</i>Paiement</h2>
            <div className="opts">
              {Object.entries(PAY).map(([k, [ic, title, sub]]) => (
                <label className="opt" key={k}>
                  <input type="radio" name="pay" value={k} checked={pay === k} onChange={() => setPay(k)} />
                  <span className="opt__txt"><strong>{title}</strong><span>{sub}</span></span>
                  <Icon name={ic} size={22} />
                </label>
              ))}
            </div>
            {pay === 'carte' && (
              <div className="card-fields">
                <div className="form-grid">
                  <Field id="cardnum" label="Numéro de carte" full required inputMode="numeric" autoComplete="cc-number" placeholder="1234 5678 9012 3456" maxLength={19}
                    value={card.num} onChange={(e) => setCard({ ...card, num: e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})(?=.)/g, '$1 ') })} />
                  <Field id="cardexp" label="Expiration" required inputMode="numeric" autoComplete="cc-exp" placeholder="MM/AA" maxLength={5}
                    value={card.exp} onChange={(e) => { const d = e.target.value.replace(/\D/g, '').slice(0, 4); setCard({ ...card, exp: d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d }); }} />
                  <Field id="cardcvc" label="Cryptogramme" required inputMode="numeric" autoComplete="cc-csc" placeholder="123" maxLength={4}
                    value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) })} />
                  <Field id="cardname" label="Titulaire de la carte" full required autoComplete="cc-name" />
                </div>
              </div>
            )}
          </Reveal>
        </div>

        <Reveal as="aside" className="panel panel--sticky" delay={120}>
          <h2>Votre commande</h2>
          <div className="co-mini">{cart.map((l) => <CartLine key={[l.id, l.size, l.name, l.number].join('|')} l={l} mini />)}</div>
          <PromoBox />
          <div style={{ marginTop: 12 }}><Summary withShipping /></div>
          <button className="btn btn--primary btn--block" type="submit" style={{ marginTop: 18 }} disabled={sending}>
            <Icon name="lock" size={18} />{sending ? 'Enregistrement…' : <>{pay === 'livraison' ? 'Confirmer la commande' : 'Payer'} · {fmt(totals.total)}</>}
          </button>
          <p className="legal">En validant, vous acceptez nos conditions générales de vente.</p>
          <p className="sum-note"><Icon name="lock" size={14} />Paiement chiffré et sécurisé</p>
        </Reveal>
      </form>
    </div>
  );
}

export function Confirmation() {
  useTitle('Commande confirmée');
  const { order: o } = useStore();
  useEffect(() => { if (!o) go('#/'); }, [o]);
  if (!o) return null;
  return (
    <div className="container">
      <Reveal className="confirm">
        <div className="confirm__icon"><Icon name="check" size={30} /></div>
        <h1>Merci {o.customer.prenom}, c'est commandé.</h1>
        <p>Commande <strong>{o.num}</strong>. Un récapitulatif est envoyé à {o.customer.email}.</p>
        <div className="panel">
          <div className="co-mini">{o.lines.map((l) => <CartLine key={l.id + l.size} l={l} mini />)}</div>
          <div className="sum-row"><span>Sous-total</span><b>{fmt(o.subtotal)}</b></div>
          {o.discount > 0 && <div className="sum-row"><span>Code {o.promo}</span><span className="green">- {fmt(o.discount)}</span></div>}
          <div className="sum-row"><span>{o.shipping.label}</span>{o.shipping.price ? <b>{fmt(o.shipping.price)}</b> : <span className="green">Offerte</span>}</div>
          <div className="sum-row"><span>Paiement</span><b>{PAYMENTS[o.payment]}</b></div>
          <div className="sum-row sum-row--total"><span>Total TTC</span><strong>{fmt(o.total)}</strong></div>
          <div className="sum-row" style={{ marginTop: 14, alignItems: 'flex-start' }}>
            <span style={{ display: 'inline-flex', gap: 8 }}><Icon name="pin" size={18} />Livraison</span>
            <span style={{ textAlign: 'right' }}>
              {[`${o.customer.prenom} ${o.customer.nom}`, o.address.adresse, o.address.complement, `${o.address.cp} ${o.address.ville}`, o.address.pays]
                .filter(Boolean).map((a) => <span key={a} style={{ display: 'block' }}>{a}</span>)}
              <span className="muted">{o.shipping.delay}</span>
            </span>
          </div>
        </div>
        <a className="btn btn--primary" href="#/boutique">Retour à la boutique</a>
      </Reveal>
    </div>
  );
}

export function NotFound() {
  useTitle('Page introuvable');
  return (
    <div className="container">
      <div className="empty">
        <Icon name="search" size={40} /><h2>Page introuvable</h2>
        <p>Ce maillot n'existe pas ou n'est plus disponible.</p>
        <a className="btn btn--primary" href="#/boutique">Voir la boutique</a>
      </div>
    </div>
  );
}
