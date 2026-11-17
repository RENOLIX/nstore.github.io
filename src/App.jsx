import { lazy, Suspense, useEffect, useState } from 'react';
import { fmt } from './data.js';
import { useRoute, useStore } from './store.jsx';
import { CartLine, EmptyCart, Icon, Logo, NewsForm, ShipBar } from './ui.jsx';
import { Cart, Checkout, Confirmation, Home, NotFound, Product, Shop } from './pages.jsx';

// L'admin est chargé à part : les visiteurs de la boutique ne téléchargent pas son code.
const Admin = lazy(() => import('./admin/Admin.jsx'));

function Header({ route }) {
  const { count, bump, setLayer } = useStore();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  const active = route.name === 'boutique' ? route.params.cat || 'tous' : null;
  const link = (cat, label) => (
    <a href={cat === 'tous' ? '#/boutique' : `#/boutique?cat=${cat}`} className={active === cat ? 'is-active' : ''}>{label}</a>
  );
  return (
    <header className={'header' + (scrolled ? ' is-scrolled' : '')}>
      <div className="container header__in">
        <button className="icon-btn header__burger" onClick={() => setLayer('menu')} aria-label="Ouvrir le menu"><Icon name="menu" /></button>
        <a href="#/" aria-label="NStore Football, accueil" className="header__logo"><Logo /></a>
        <nav className="nav" aria-label="Navigation principale">
          {link('tous', 'Boutique')}
          {link('clubs', 'Clubs')}
          {link('selections', 'Sélections')}
          {link('promos', 'Promotions')}
          <button type="button" onClick={() => setLayer('sizes')}>Guide des tailles</button>
        </nav>
        <div className="header__actions">
          <a className="icon-btn" href="#/boutique?focus=1" aria-label="Rechercher"><Icon name="search" /></a>
          <button className="icon-btn cart-btn" onClick={() => setLayer('cart')} aria-label="Ouvrir le panier">
            <Icon name="bag" />
            {count > 0 && <span key={bump} className="cart-btn__count bump">{count}</span>}
          </button>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  const { setLayer } = useStore();
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__top">
          <div className="footer__brand">
            <a href="#/" aria-label="NStore Football, accueil"><Logo light /></a>
            <p>La boutique des maillots de football. Clubs, sélections et éditions spéciales, expédiés sous 48 heures.</p>
            <div className="footer__social">
              <a href="#/" aria-label="Instagram"><Icon name="instagram" /></a>
              <a href="#/" aria-label="YouTube"><Icon name="youtube" /></a>
              <a href="#/" aria-label="Nous écrire"><Icon name="mail" /></a>
            </div>
          </div>
          <div className="footer__col">
            <h3>Boutique</h3>
            <a href="#/boutique">Tous les maillots</a>
            <a href="#/boutique?cat=clubs">Clubs</a>
            <a href="#/boutique?cat=selections">Sélections</a>
            <a href="#/boutique?cat=promos">Promotions</a>
          </div>
          <div className="footer__col">
            <h3>Aide</h3>
            <button type="button" onClick={() => setLayer('sizes')}>Guide des tailles</button>
            <a href="#/panier">Mon panier</a>
            <a href="#/">Livraison et retours</a>
            <a href="#/">Suivre ma commande</a>
          </div>
          <div className="footer__col footer__news">
            <h3>Lettre d'information</h3>
            <p>Nouveautés et promotions, une fois par mois.</p>
            <NewsForm id="news-footer" />
          </div>
        </div>
        <div className="footer__bottom">
          <p>© 2026 NStore Football. Tous droits réservés.</p>
          <div className="footer__legal">
            <a href="#/">Mentions légales</a>
            <a href="#/">CGV</a>
            <a href="#/">Confidentialité</a>
          </div>
          <div className="footer__pay" aria-label="Moyens de paiement acceptés">
            <span>Carte bancaire</span><span>PayPal</span><span>À la livraison</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function CartDrawer() {
  const { cart, count, totals, promo, layer, setLayer } = useStore();
  const open = layer === 'cart';
  return (
    <aside className={'drawer drawer--right' + (open ? ' is-open' : '')} aria-label="Panier" aria-hidden={!open}>
      <div className="drawer__head">
        <h2>Panier {count > 0 && <span className="muted">({count})</span>}</h2>
        <button className="icon-btn" onClick={() => setLayer(null)} aria-label="Fermer le panier"><Icon name="x" /></button>
      </div>
      <div className="drawer__body">
        {cart.length === 0 ? <EmptyCart /> : (<><ShipBar />{cart.map((l) => <CartLine key={[l.id, l.size, l.name, l.number].join('|')} l={l} />)}</>)}
      </div>
      {cart.length > 0 && (
        <div className="drawer__foot">
          <div className="sum-row"><span>Sous-total</span><b>{fmt(totals.sub)}</b></div>
          {totals.discount > 0 && <div className="sum-row"><span>Code {promo}</span><span className="green">- {fmt(totals.discount)}</span></div>}
          <p className="hint">Taxes incluses. Livraison calculée à la commande.</p>
          <div className="foot-actions">
            <a className="btn btn--primary btn--block" href="#/commande" onClick={() => setLayer(null)}>Commander · {fmt(totals.after)}</a>
            <a className="btn btn--ghost btn--block" href="#/panier" onClick={() => setLayer(null)}>Voir le panier</a>
          </div>
        </div>
      )}
    </aside>
  );
}

function MenuDrawer() {
  const { layer, setLayer } = useStore();
  const open = layer === 'menu';
  const close = () => setLayer(null);
  return (
    <aside className={'drawer drawer--left' + (open ? ' is-open' : '')} aria-label="Menu" aria-hidden={!open}>
      <div className="drawer__head">
        <Logo />
        <button className="icon-btn" onClick={close} aria-label="Fermer le menu"><Icon name="x" /></button>
      </div>
      <nav className="mnav">
        <a href="#/" onClick={close}>Accueil</a>
        <a href="#/boutique" onClick={close}>Tous les maillots</a>
        <a href="#/boutique?cat=clubs" onClick={close}>Clubs</a>
        <a href="#/boutique?cat=selections" onClick={close}>Sélections</a>
        <a href="#/boutique?cat=promos" onClick={close}>Promotions</a>
        <button type="button" onClick={() => setLayer('sizes')}>Guide des tailles</button>
        <a href="#/panier" onClick={close}>Mon panier</a>
      </nav>
    </aside>
  );
}

function SizeGuide() {
  const { layer, setLayer } = useStore();
  const open = layer === 'sizes';
  const rows = [['XS', '80 – 88', '65 – 73', '162 – 168'], ['S', '88 – 96', '73 – 81', '168 – 174'], ['M', '96 – 104', '81 – 89', '174 – 180'],
    ['L', '104 – 112', '89 – 97', '180 – 186'], ['XL', '112 – 124', '97 – 109', '186 – 192'], ['XXL', '124 – 136', '109 – 121', '192 – 198']];
  return (
    <div className={'modal' + (open ? ' is-open' : '')} role="dialog" aria-modal="true" aria-labelledby="sg-title" aria-hidden={!open}>
      <div className="modal__box">
        <div className="modal__head">
          <h2 id="sg-title">Guide des tailles</h2>
          <button className="icon-btn" onClick={() => setLayer(null)} aria-label="Fermer"><Icon name="x" /></button>
        </div>
        <p className="muted">Mesures du corps en centimètres. Entre deux tailles, prenez la plus grande pour une coupe confortable.</p>
        <table className="sg-table">
          <thead><tr><th>Taille</th><th>Poitrine</th><th>Taille</th><th>Stature</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r[0]}>{r.map((c, i) => <td key={i}>{c}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}

export default function App() {
  const route = useRoute();
  const { layer, setLayer, toast } = useStore();

  useEffect(() => { setLayer(null); }, [route.key, setLayer]);
  useEffect(() => {
    document.body.classList.toggle('lock', !!layer);
    const esc = (e) => { if (e.key === 'Escape') setLayer(null); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [layer, setLayer]);

  if (route.name === 'admin') {
    return <Suspense fallback={<div className="adm-boot" />}><Admin section={route.arg || 'tableau'} /></Suspense>;
  }

  let page;
  switch (route.name) {
    case 'home': page = <Home />; break;
    case 'boutique': page = <Shop params={route.params} />; break;
    case 'produit': page = <Product key={route.arg} id={route.arg} />; break;
    case 'panier': page = <Cart />; break;
    case 'commande': page = <Checkout />; break;
    case 'confirmation': page = <Confirmation />; break;
    default: page = <NotFound />;
  }

  return (
    <>
      <a className="skip" href="#app">Aller au contenu</a>
      <div className="announce">
        <div className="container announce__in">
          <span><Icon name="truck" size={16} />Livraison offerte dès 100 € d'achat</span>
          <span className="announce__sep" aria-hidden="true" />
          <span className="announce__hide">Retours gratuits sous 30 jours</span>
        </div>
      </div>
      <Header route={route} />
      <main id="app" tabIndex={-1} key={route.name === 'boutique' ? 'boutique' : route.key} className="page">{page}</main>
      <Footer />
      <div className={'overlay' + (layer ? ' is-open' : '')} onClick={() => setLayer(null)} />
      <CartDrawer />
      <MenuDrawer />
      <SizeGuide />
      <div className={'toast' + (toast ? ' is-on' : '')} role="status" aria-live="polite">{toast}</div>
    </>
  );
}
