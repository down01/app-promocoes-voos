-- A view de promoções percorria o calendário inteiro (~500 mil dias) a cada visita: ~2 s por
-- consulta, estourando o limite de tempo do banco. Agora fica pronta numa materialized view,
-- recalculada a cada 10 minutos e quando o robô corrige preços (rpc atualizar_promocoes).
drop view public.promocoes;

create materialized view public.promocoes as
select distinct on (origem, destino) origem, destino, data, preco, atualizado_em
from public.calendario
where data > current_date
order by origem, destino, preco, data;

create unique index promocoes_rota on public.promocoes (origem, destino);
create index promocoes_preco on public.promocoes (preco);

revoke all on public.promocoes from public, anon, authenticated;
grant select on public.promocoes to anon, authenticated, service_role;

create function public.atualizar_promocoes() returns void
language sql security definer set search_path = '' as $$
  refresh materialized view concurrently public.promocoes;
$$;
revoke execute on function public.atualizar_promocoes() from public, anon, authenticated;
grant execute on function public.atualizar_promocoes() to service_role;

select cron.schedule('atualizar-promocoes', '*/10 * * * *', 'select public.atualizar_promocoes()');
