-- O calendário do Google às vezes mostra um preço que não existe na busca de verdade
-- (ex.: GRU→RAO em 02/12 a R$ 156 no calendário, R$ 566 nos voos). Quando o robô buscou os
-- voos daquele dia há pouco tempo, o preço encontrado vale mais que o do calendário.
create function public.usar_preco_conferido() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  conferido integer;
begin
  select r.preco_atual into conferido
  from public.rotas r
  where r.origem = new.origem and r.destino = new.destino and r.data_ida = new.data
    and r.data_volta is null and r.preco_atual is not null
    and r.ultima_busca_em > now() - interval '8 hours';
  if conferido is not null and conferido > new.preco then
    new.preco := conferido;
  end if;
  return new;
end $$;
revoke execute on function public.usar_preco_conferido() from public, anon, authenticated;

create trigger antes_de_gravar_preco before insert or update of preco on public.calendario
  for each row execute function public.usar_preco_conferido();

-- Corrige o que já está gravado
update public.calendario c set preco = r.preco_atual, atualizado_em = r.ultima_busca_em
from public.rotas r
where r.origem = c.origem and r.destino = c.destino and r.data_ida = c.data and r.data_volta is null
  and r.preco_atual is not null and r.ultima_busca_em > now() - interval '8 hours'
  and r.preco_atual <> c.preco and r.ultima_busca_em > c.atualizado_em;
