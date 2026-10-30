-- Dia mais barato de cada rota no calendário (para a lista "Mais baratas agora" do site)
create view public.promocoes with (security_invoker = true) as
select distinct on (origem, destino) origem, destino, data, preco, atualizado_em
from public.calendario
where data >= current_date
order by origem, destino, preco, data;
