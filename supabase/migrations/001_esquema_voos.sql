-- Esquema do app de promoções de voos.
-- Rotas com data_volta nula são trechos só de ida. Uma rota de ida e volta
-- A→B (d1, d2) é acompanhada também pelos trechos A→B em d1 e B→A em d2.

create table public.rotas (
  id bigint generated always as identity primary key,
  origem text not null check (origem ~ '^[A-Z]{3}$'),
  destino text not null check (destino ~ '^[A-Z]{3}$'),
  data_ida date not null,
  data_volta date check (data_volta is null or data_volta >= data_ida),
  preco_atual integer,
  voos_atuais jsonb not null default '[]',
  link text,
  ultima_busca_em timestamptz,
  ultimo_interesse_em timestamptz not null default now(),
  criado_em timestamptz not null default now(),
  unique nulls not distinct (origem, destino, data_ida, data_volta)
);

create table public.precos (
  id bigint generated always as identity primary key,
  rota_id bigint not null references public.rotas on delete cascade,
  buscado_em timestamptz not null default now(),
  menor_preco integer not null,
  companhia text,
  saida text,
  chegada text,
  paradas text
);
create index precos_rota_data on public.precos (rota_id, buscado_em desc);

create table public.perfis (
  user_id uuid primary key references auth.users on delete cascade,
  email text,
  telegram_chat_id text,
  telegram_codigo text unique default substr(md5(random()::text), 1, 8),
  criado_em timestamptz not null default now()
);

create table public.alertas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  rota_id bigint not null references public.rotas on delete cascade,
  -- Limites em R$. Nulo = o robô decide sozinho (preço bem abaixo da média recente).
  limite_ida_volta integer,
  limite_ida integer,
  limite_volta integer,
  avisar_email boolean not null default true,
  avisar_telegram boolean not null default false,
  avisar_push boolean not null default false,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  unique (user_id, rota_id)
);
create index alertas_rota on public.alertas (rota_id) where ativo;

create table public.push_assinaturas (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  criado_em timestamptz not null default now()
);

create table public.avisos (
  id bigint generated always as identity primary key,
  alerta_id uuid not null references public.alertas on delete cascade,
  trecho text not null check (trecho in ('ida_volta', 'ida', 'volta')),
  preco integer not null,
  canais text[] not null default '{}',
  enviado_em timestamptz not null default now()
);
create index avisos_alerta on public.avisos (alerta_id, trecho, enviado_em desc);

-- Pedidos de busca imediata feitos pelo site (rota nova ou desatualizada)
create table public.pedidos_busca (
  id bigint generated always as identity primary key,
  rota_id bigint not null references public.rotas on delete cascade,
  status text not null default 'pendente' check (status in ('pendente', 'buscando', 'pronto', 'erro')),
  criado_em timestamptz not null default now(),
  concluido_em timestamptz
);

-- Cria o perfil quando alguém se cadastra
create function public.criar_perfil() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.perfis (user_id, email) values (new.id, new.email)
  on conflict (user_id) do nothing;
  return new;
end $$;

create trigger ao_criar_usuario after insert on auth.users
  for each row execute function public.criar_perfil();

-- O site chama esta função para registrar interesse numa rota (cria se não existir)
create function public.registrar_rota(p_origem text, p_destino text, p_ida date, p_volta date default null)
returns public.rotas
language plpgsql security definer set search_path = '' as $$
declare r public.rotas;
begin
  insert into public.rotas (origem, destino, data_ida, data_volta)
  values (upper(p_origem), upper(p_destino), p_ida, p_volta)
  on conflict (origem, destino, data_ida, data_volta)
    do update set ultimo_interesse_em = now()
  returning * into r;
  return r;
end $$;

-- Segurança: todo mundo vê preços; cada pessoa só vê e mexe nos próprios dados.
-- O robô usa a chave secreta (service role), que ignora estas regras.
alter table public.rotas enable row level security;
alter table public.precos enable row level security;
alter table public.perfis enable row level security;
alter table public.alertas enable row level security;
alter table public.push_assinaturas enable row level security;
alter table public.avisos enable row level security;
alter table public.pedidos_busca enable row level security;

create policy "precos são públicos" on public.rotas for select using (true);
create policy "histórico é público" on public.precos for select using (true);

create policy "ver o próprio perfil" on public.perfis for select using ((select auth.uid()) = user_id);
create policy "editar o próprio perfil" on public.perfis for update using ((select auth.uid()) = user_id);

create policy "ver os próprios alertas" on public.alertas for select using ((select auth.uid()) = user_id);
create policy "criar os próprios alertas" on public.alertas for insert with check ((select auth.uid()) = user_id);
create policy "editar os próprios alertas" on public.alertas for update using ((select auth.uid()) = user_id);
create policy "apagar os próprios alertas" on public.alertas for delete using ((select auth.uid()) = user_id);

create policy "ver as próprias assinaturas" on public.push_assinaturas for select using ((select auth.uid()) = user_id);
create policy "criar as próprias assinaturas" on public.push_assinaturas for insert with check ((select auth.uid()) = user_id);
create policy "apagar as próprias assinaturas" on public.push_assinaturas for delete using ((select auth.uid()) = user_id);

create policy "ver os próprios avisos" on public.avisos for select
  using (exists (select 1 from public.alertas a where a.id = alerta_id and a.user_id = (select auth.uid())));

create policy "ver pedidos" on public.pedidos_busca for select using (true);

revoke execute on function public.criar_perfil() from public, anon, authenticated;
grant execute on function public.registrar_rota(text, text, date, date) to anon, authenticated;
