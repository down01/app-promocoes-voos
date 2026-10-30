-- Busca feita pelo site (com ou sem login): registra a rota e os trechos separados
-- e, se o preço estiver velho (mais de 6h), coloca na fila do robô.
-- Tem limites próprios para ninguém conseguir encher a fila.
create or replace function public.pedir_busca(p_origem text, p_destino text, p_ida date, p_volta date default null)
returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  principal public.rotas;
  trecho public.rotas;
  rotas_da_busca bigint[];
  novos int := 0;
  id_rota bigint;
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

  foreach id_rota in array rotas_da_busca loop
    if exists (select 1 from public.rotas r where r.id = id_rota
               and (r.ultima_busca_em is null or r.ultima_busca_em < now() - interval '6 hours'))
       and not exists (select 1 from public.pedidos_busca p where p.rota_id = id_rota
                       and p.status in ('pendente', 'buscando')) then
      insert into public.pedidos_busca (rota_id) values (id_rota);
      novos := novos + 1;
    end if;
  end loop;

  return jsonb_build_object('rota_id', principal.id, 'pedidos_novos', novos);
end $$;

revoke execute on function public.pedir_busca(text, text, date, date) from public;
grant execute on function public.pedir_busca(text, text, date, date) to anon, authenticated;
