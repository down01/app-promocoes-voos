-- Promoções começam amanhã: voos de hoje podem já ter saído ou não estar mais à venda
create or replace view public.promocoes with (security_invoker = true) as
select distinct on (origem, destino) origem, destino, data, preco, atualizado_em
from public.calendario
where data > current_date
order by origem, destino, preco, data;
