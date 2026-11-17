import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Icon } from './ui.jsx';

// Recherche sans tenir compte des accents ni des majuscules
const norm = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/**
 * Liste déroulante avec champ de recherche (pays, départements…).
 * options : [{ value, label, hint }] ; hint s'affiche à droite (ex. numéro de département).
 * La valeur envoyée avec le formulaire est le libellé choisi (champ caché `name`).
 */
export default function Combobox({ id, name, label, options, value, onChange, placeholder = 'Rechercher…', required, disabled, autoComplete }) {
  const listId = useId();
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const selected = options.find((o) => o.value === value) || null;
  const [query, setQuery] = useState(selected ? selected.label : '');
  const [typing, setTyping] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  // La valeur change de l'extérieur (ex. nouveau pays) : on affiche son libellé
  useEffect(() => { if (!typing) setQuery(selected ? selected.label : ''); }, [selected, typing]);

  const shown = useMemo(() => {
    const q = norm(typing ? query : '');
    if (!q) return options;
    const starts = [];
    const contains = [];
    for (const o of options) {
      const l = norm(o.label);
      const h = o.hint ? norm(o.hint) : '';
      if (l.startsWith(q) || h === q) starts.push(o);
      else if (l.includes(q) || (h && h.startsWith(q))) contains.push(o);
    }
    return starts.concat(contains);
  }, [options, query, typing]);

  // L'option active reste visible quand on navigue au clavier
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.children[active];
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const openList = () => {
    if (disabled) return;
    setOpen(true);
    setActive(Math.max(0, typing ? 0 : options.findIndex((o) => o.value === value)));
  };
  const close = () => { setOpen(false); setTyping(false); };
  const pick = (o) => { onChange(o.value); setQuery(o.label); close(); };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) { openList(); return; }
      const d = e.key === 'ArrowDown' ? 1 : -1;
      setActive((a) => Math.min(shown.length - 1, Math.max(0, a + d)));
    } else if (e.key === 'Enter') {
      if (open && shown[active]) { e.preventDefault(); pick(shown[active]); }
    } else if (e.key === 'Escape') {
      if (open) { e.preventDefault(); setQuery(selected ? selected.label : ''); close(); }
    }
  };

  // En quittant le champ : un texte qui correspond exactement à une option la choisit, sinon on revient au choix précédent
  const onBlur = () => {
    if (typing) {
      const exact = options.find((o) => norm(o.label) === norm(query));
      if (exact) pick(exact);
      else if (!query.trim()) { onChange(''); close(); }
      else { setQuery(selected ? selected.label : ''); close(); }
    } else close();
  };

  return (
    <div className={'combo' + (open ? ' is-open' : '')}>
      <label className="label" htmlFor={id}>{label}</label>
      <div className="combo__field">
        <input
          ref={inputRef}
          className="input combo__input"
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && shown[active] ? `${listId}-${active}` : undefined}
          autoComplete={autoComplete || 'off'}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setTyping(true); setOpen(true); setActive(0); }}
          onFocus={(e) => { e.target.select(); openList(); }}
          onClick={() => { if (!open) openList(); }}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
        />
        <button type="button" className="combo__toggle" tabIndex={-1} aria-label={open ? 'Fermer la liste' : 'Ouvrir la liste'} disabled={disabled}
          onMouseDown={(e) => { e.preventDefault(); if (open) close(); else { inputRef.current.focus(); } }}>
          <Icon name="down" size={18} />
        </button>
      </div>
      {name && <input type="hidden" name={name} value={selected ? selected.label : ''} />}
      {open && (
        <ul className="combo__list" id={listId} role="listbox" ref={listRef} aria-label={label}>
          {shown.length ? shown.map((o, k) => (
            <li key={o.value} id={`${listId}-${k}`} role="option" aria-selected={o.value === value}
              className={(k === active ? 'is-active' : '') + (o.value === value ? ' is-on' : '')}
              onMouseDown={(e) => { e.preventDefault(); pick(o); }}
              onMouseMove={() => k !== active && setActive(k)}>
              <span>{o.label}</span>
              {o.hint && <small>{o.hint}</small>}
            </li>
          )) : <li className="combo__empty" role="presentation">Aucun résultat</li>}
        </ul>
      )}
    </div>
  );
}
