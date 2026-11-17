-- =====================================================================
-- NStore Football : schéma Supabase
-- Tables, règles de sécurité (RLS), fonctions et stockage des photos.
-- Le script peut être relancé sans risque (idempotent).
--
-- Rôles :
--   admin   : tout, y compris codes promo et utilisateurs
--   employe : commandes et produits
--   (vide)  : aucun accès à l'admin
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Profils : un par compte, créé automatiquement à l'inscription
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role text check (role in ('admin', 'employe')),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('admin', 'employe') from public.profiles where id = auth.uid()), false)
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false)
$$;

-- Le tout premier compte créé devient administrateur ; les suivants n'ont aucun rôle
-- tant qu'un administrateur ne leur en donne pas un.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    nullif(left(new.raw_user_meta_data ->> 'full_name', 80), ''),
    case when not exists (select 1 from public.profiles where role = 'admin') then 'admin' end
  );
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop policy if exists "profils : lecture" on public.profiles;
create policy "profils : lecture" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());

-- Indique à la page de connexion s'il faut proposer la création du premier administrateur
create or replace function public.admin_exists() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where role = 'admin')
$$;

-- Liste complète des comptes (administrateurs uniquement)
create or replace function public.admin_list_users()
returns table (id uuid, email text, full_name text, role text, created_at timestamptz, last_sign_in_at timestamptz)
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not public.is_admin() then
    raise exception 'Accès réservé aux administrateurs.' using errcode = '42501';
  end if;
  return query
    select p.id, p.email, p.full_name, p.role, p.created_at, u.last_sign_in_at
    from public.profiles p join auth.users u on u.id = p.id
    order by p.created_at;
end $$;

-- Changer le rôle et le nom d'un compte (administrateurs uniquement)
create or replace function public.admin_update_user(target uuid, new_role text, new_name text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Accès réservé aux administrateurs.' using errcode = '42501';
  end if;
  if new_role is not null and new_role not in ('admin', 'employe') then
    raise exception 'Rôle inconnu.';
  end if;
  if (select role from public.profiles where id = target) = 'admin'
     and new_role is distinct from 'admin'
     and (select count(*) from public.profiles where role = 'admin') <= 1 then
    raise exception 'Il doit rester au moins un administrateur.';
  end if;
  update public.profiles
     set role = new_role, full_name = nullif(left(new_name, 80), '')
   where id = target;
end $$;

-- Supprimer un compte (administrateurs uniquement, jamais le sien ni le dernier admin)
create or replace function public.admin_delete_user(target uuid)
returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.is_admin() then
    raise exception 'Accès réservé aux administrateurs.' using errcode = '42501';
  end if;
  if target = auth.uid() then
    raise exception 'Vous ne pouvez pas supprimer votre propre compte.';
  end if;
  if (select role from public.profiles where id = target) = 'admin'
     and (select count(*) from public.profiles where role = 'admin') <= 1 then
    raise exception 'Il doit rester au moins un administrateur.';
  end if;
  delete from auth.users where id = target;
end $$;

-- ---------------------------------------------------------------------
-- Produits
-- ---------------------------------------------------------------------
create table if not exists public.products (
  id text primary key,
  name text not null,
  cat text not null check (cat in ('homme', 'femme')),
  league text not null default '',
  type text not null default '',
  price numeric(10, 2) not null check (price > 0),
  compare_at numeric(10, 2) check (compare_at is null or compare_at > price),
  description text not null default '',
  sizes text[] not null default '{S,M,L,XL,XXL}',
  img text not null,
  is_new boolean not null default false,
  active boolean not null default true,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.products enable row level security;

drop policy if exists "produits : lecture" on public.products;
create policy "produits : lecture" on public.products
  for select using (active or public.is_staff());

drop policy if exists "produits : gestion par l'équipe" on public.products;
create policy "produits : gestion par l'équipe" on public.products
  for all to authenticated using (public.is_staff()) with check (public.is_staff());

-- ---------------------------------------------------------------------
-- Codes promo (gérés par les administrateurs, vérifiés par la boutique)
-- ---------------------------------------------------------------------
create table if not exists public.promos (
  code text primary key check (code ~ '^[A-Z0-9]{3,20}$'),
  percent int not null check (percent between 1 and 90),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.promos enable row level security;

drop policy if exists "codes promo : administrateurs" on public.promos;
create policy "codes promo : administrateurs" on public.promos
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- La boutique demande seulement si un code existe, sans pouvoir lister les codes
create or replace function public.check_promo(promo_code text) returns int
language sql stable security definer set search_path = public as $$
  select percent from public.promos where code = upper(promo_code) and active
$$;

-- ---------------------------------------------------------------------
-- Commandes
-- ---------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  num text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  status text not null default 'nouvelle'
    check (status in ('nouvelle', 'preparation', 'expediee', 'livree', 'annulee')),
  customer jsonb not null,
  address jsonb not null,
  shipping jsonb not null,
  payment text not null check (payment in ('carte', 'paypal', 'livraison')),
  promo text,
  lines jsonb not null,
  subtotal numeric(10, 2) not null,
  discount numeric(10, 2) not null default 0,
  total numeric(10, 2) not null
);
alter table public.orders enable row level security;

drop policy if exists "commandes : lecture par l'équipe" on public.orders;
create policy "commandes : lecture par l'équipe" on public.orders
  for select to authenticated using (public.is_staff());

drop policy if exists "commandes : statut par l'équipe" on public.orders;
create policy "commandes : statut par l'équipe" on public.orders
  for update to authenticated using (public.is_staff()) with check (public.is_staff());

-- Les clients passent commande uniquement par cette fonction : les prix, la remise
-- et la livraison sont recalculés ici à partir de la base, pas repris du navigateur.
create or replace function public.create_order(payload jsonb) returns public.orders
language plpgsql security definer set search_path = public as $$
declare
  item jsonb;
  p public.products;
  q int;
  v_lines jsonb := '[]'::jsonb;
  v_sub numeric := 0;
  v_rate int;
  v_disc numeric := 0;
  v_after numeric;
  v_code text := upper(nullif(trim(payload ->> 'promo'), ''));
  v_method text := coalesce(payload -> 'shipping' ->> 'method', 'standard');
  v_payment text := payload ->> 'payment';
  v_ship_label text;
  v_ship_delay text;
  v_ship_price numeric;
  c jsonb := payload -> 'customer';
  a jsonb := payload -> 'address';
  o public.orders;
begin
  if jsonb_typeof(payload -> 'lines') is distinct from 'array' or jsonb_array_length(payload -> 'lines') = 0 then
    raise exception 'Le panier est vide.';
  end if;
  if jsonb_array_length(payload -> 'lines') > 30 then
    raise exception 'Trop d''articles dans le panier.';
  end if;
  if coalesce(trim(c ->> 'email'), '') !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
     or coalesce(trim(c ->> 'prenom'), '') = '' or coalesce(trim(c ->> 'nom'), '') = ''
     or coalesce(trim(a ->> 'adresse'), '') = '' or coalesce(trim(a ->> 'cp'), '') = ''
     or coalesce(trim(a ->> 'ville'), '') = '' then
    raise exception 'Coordonnées incomplètes.';
  end if;
  if v_payment is null or v_payment not in ('carte', 'paypal') then
    raise exception 'Mode de paiement inconnu.';
  end if;

  for item in select value from jsonb_array_elements(payload -> 'lines') loop
    select * into p from public.products where id = item ->> 'id' and active;
    if not found then
      raise exception 'Un maillot du panier n''est plus disponible.';
    end if;
    if not ((item ->> 'size') = any (p.sizes)) then
      raise exception 'Taille indisponible pour %.', p.name;
    end if;
    q := greatest(1, least(10, coalesce((item ->> 'qty')::int, 1)));
    v_lines := v_lines || jsonb_build_object('id', p.id, 'name', p.name, 'img', p.img, 'size', item ->> 'size', 'qty', q, 'unit', p.price);
    v_sub := v_sub + p.price * q;
  end loop;

  if v_code is not null then
    select percent into v_rate from public.promos where code = v_code and active;
    if v_rate is null then v_code := null; else v_disc := round(v_sub * v_rate / 100.0, 2); end if;
  end if;
  v_after := v_sub - v_disc;

  -- Mêmes règles que SHIPPING dans src/data.js
  if v_method = 'relais' then
    v_ship_label := 'Point relais'; v_ship_delay := '3 à 5 jours ouvrés, près de chez vous';
    v_ship_price := case when v_after >= 100 then 0 else 3.90 end;
  elsif v_method = 'express' then
    v_ship_label := 'Livraison express'; v_ship_delay := 'Le lendemain avant 13 h';
    v_ship_price := 9.90;
  else
    v_method := 'standard';
    v_ship_label := 'Livraison standard'; v_ship_delay := '2 à 4 jours ouvrés, à domicile';
    v_ship_price := case when v_after >= 100 then 0 else 4.90 end;
  end if;

  insert into public.orders (num, customer, address, shipping, payment, promo, lines, subtotal, discount, total)
  values (
    'NS-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)),
    jsonb_build_object(
      'prenom', left(trim(c ->> 'prenom'), 80), 'nom', left(trim(c ->> 'nom'), 80),
      'email', left(trim(c ->> 'email'), 160), 'tel', left(trim(coalesce(c ->> 'tel', '')), 40)),
    jsonb_build_object(
      'adresse', left(trim(a ->> 'adresse'), 200), 'complement', left(trim(coalesce(a ->> 'complement', '')), 200),
      'cp', left(trim(a ->> 'cp'), 20), 'ville', left(trim(a ->> 'ville'), 100),
      'region', left(trim(coalesce(a ->> 'region', '')), 100), 'pays', left(trim(coalesce(a ->> 'pays', 'France')), 80)),
    jsonb_build_object('method', v_method, 'label', v_ship_label, 'delay', v_ship_delay, 'price', v_ship_price),
    v_payment, v_code, v_lines, v_sub, v_disc, v_after + v_ship_price
  )
  returning * into o;
  return o;
end $$;

-- ---------------------------------------------------------------------
-- Qui peut appeler quelles fonctions
-- ---------------------------------------------------------------------
revoke execute on function public.admin_list_users() from public, anon;
revoke execute on function public.admin_update_user(uuid, text, text) from public, anon;
revoke execute on function public.admin_delete_user(uuid) from public, anon;
grant execute on function public.admin_list_users() to authenticated;
grant execute on function public.admin_update_user(uuid, text, text) to authenticated;
grant execute on function public.admin_delete_user(uuid) to authenticated;
grant execute on function public.admin_exists() to anon, authenticated;
grant execute on function public.check_promo(text) to anon, authenticated;
grant execute on function public.create_order(jsonb) to anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Photos des produits : dossier public en lecture, modifiable par l'équipe
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do update set public = true;

drop policy if exists "photos produits : ajout par l'équipe" on storage.objects;
create policy "photos produits : ajout par l'équipe" on storage.objects
  for insert to authenticated with check (bucket_id = 'products' and public.is_staff());

drop policy if exists "photos produits : modification par l'équipe" on storage.objects;
create policy "photos produits : modification par l'équipe" on storage.objects
  for update to authenticated using (bucket_id = 'products' and public.is_staff());

drop policy if exists "photos produits : suppression par l'équipe" on storage.objects;
create policy "photos produits : suppression par l'équipe" on storage.objects
  for delete to authenticated using (bucket_id = 'products' and public.is_staff());
