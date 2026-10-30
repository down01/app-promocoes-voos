-- 1) Abrir uma viagem não dispara mais busca se o preço do dia já está no calendário
--    (atualização geral). A lista de horários/companhias passa a ser pedida por botão.
-- 2) Registro de cada mudança de preço no calendário, para medir quantas vezes por dia o preço muda.

create or replace function public.pedir_busca(p_origem text, p_destino text, p_ida date, p_volta date default null)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  principal public.rotas;
  trecho public.rotas;
  rotas_da_busca bigint[];
  novos int := 0;
  id_rota bigint;
  tem_ida boolean;
  tem_volta boolean;
begin
  if p_origem !~* '^[A-Z]{3}$' or p_destino !~* '^[A-Z]{3}$' then
    raise exception 'Use o código de 3 letras do aeroporto (ex.: VIX)';
  end if;
  if (select count(*) from public.pedidos_busca where status = 'pendente') >= 50 then
    raise exception 'Muitas buscas na fila agora. Tente de novo em alguns minutos.';
  end if;

  principal := public.registrar_rota(p_origem, p_destino, p_ida, p_volta);
  rotas_da_busca := array[principal.id];
  if p_volta is not null then
    trecho := public.registrar_rota(p_origem, p_destino, p_ida, null);
    rotas_da_busca := rotas_da_busca || trecho.id;
    trecho := public.registrar_rota(p_destino, p_origem, p_volta, null);
    rotas_da_busca := rotas_da_busca || trecho.id;
  end if;

  -- Preço já salvo pela atualização geral? Então mostra o salvo e não busca de novo.
  tem_ida := exists (select 1 from public.calendario c where c.origem = upper(p_origem)
                     and c.destino = upper(p_destino) and c.data = p_ida);
  tem_volta := p_volta is null or exists (select 1 from public.calendario c where c.origem = upper(p_destino)
                     and c.destino = upper(p_origem) and c.data = p_volta);
  if tem_ida and tem_volta then
    return jsonb_build_object('rota_id', principal.id, 'pedidos_novos', 0);
  end if;

  foreach id_rota in array rotas_da_busca loop
    novos := novos + public.enfileirar_busca(id_rota);
  end loop;
  return jsonb_build_object('rota_id', principal.id, 'pedidos_novos', novos);
end $$;

-- Põe uma rota na fila do robô se o preço detalhado estiver velho e não houver pedido em andamento
create or replace function public.enfileirar_busca(p_rota bigint)
returns int
language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.rotas r where r.id = p_rota
             and (r.ultima_busca_em is null or r.ultima_busca_em < now() - interval '6 hours'))
     and not exists (select 1 from public.pedidos_busca p where p.rota_id = p_rota
                     and p.status in ('pendente', 'buscando')) then
    insert into public.pedidos_busca (rota_id) values (p_rota);
    return 1;
  end if;
  return 0;
end $$;

-- Botão "Ver horários e companhias": busca detalhada sob demanda da viagem e dos trechos
create or replace function public.pedir_voos(p_rota bigint)
returns int
language plpgsql security definer set search_path = '' as $$
declare
  r public.rotas;
  novos int := 0;
  t bigint;
begin
  select * into r from public.rotas where id = p_rota;
  if r.id is null then
    raise exception 'Viagem não encontrada';
  end if;
  if (select count(*) from public.pedidos_busca where status = 'pendente') >= 50 then
    raise exception 'Muitas buscas na fila agora. Tente de novo em alguns minutos.';
  end if;
  novos := public.enfileirar_busca(r.id);
  if r.data_volta is not null then
    for t in select id from public.rotas where data_volta is null and (
      (origem = r.origem and destino = r.destino and data_ida = r.data_ida) or
      (origem = r.destino and destino = r.origem and data_ida = r.data_volta)) loop
      novos := novos + public.enfileirar_busca(t);
    end loop;
  end if;
  return novos;
end $$;

revoke execute on function public.enfileirar_busca(bigint) from public, anon, authenticated;
revoke execute on function public.pedir_voos(bigint) from public;
grant execute on function public.pedir_voos(bigint) to anon, authenticated;

-- Medição: cada vez que o preço de um dia muda entre duas atualizações, fica registrado
create table public.calendario_mudancas (
  id bigint generated always as identity primary key,
  origem text not null,
  destino text not null,
  data date not null,
  preco_antes integer not null,
  preco_depois integer not null,
  mudou_em timestamptz not null default now()
);
create index calendario_mudancas_quando on public.calendario_mudancas (mudou_em);
alter table public.calendario_mudancas enable row level security;

create function public.registrar_mudanca_preco() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.preco <> old.preco then
    insert into public.calendario_mudancas (origem, destino, data, preco_antes, preco_depois)
    values (new.origem, new.destino, new.data, old.preco, new.preco);
  end if;
  return new;
end $$;
revoke execute on function public.registrar_mudanca_preco() from public, anon, authenticated;

create trigger ao_mudar_preco after update of preco on public.calendario
  for each row execute function public.registrar_mudanca_preco();
