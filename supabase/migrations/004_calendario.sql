-- Calendário de preços: menor preço só de ida por dia, para cada par de aeroportos.
-- Preenchido pela atualização geral (calendario.py) a cada 6 horas.
create table public.calendario (
  origem text not null check (origem ~ '^[A-Z]{3}$'),
  destino text not null check (destino ~ '^[A-Z]{3}$'),
  data date not null,
  preco integer not null,
  atualizado_em timestamptz not null default now(),
  primary key (origem, destino, data)
);

alter table public.calendario enable row level security;
create policy "calendário é público" on public.calendario for select using (true);
