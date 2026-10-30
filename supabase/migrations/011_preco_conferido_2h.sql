-- O preço "fantasma" era, na verdade, promoção que esgotou (conferido: GRU→RAO a R$ 156 existe
-- em outros dias). Então o preço conferido só prevalece por 2 horas, para não esconder uma
-- promoção nova que o calendário encontrar depois.
create or replace function public.usar_preco_conferido() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  conferido integer;
begin
  select r.preco_atual into conferido
  from public.rotas r
  where r.origem = new.origem and r.destino = new.destino and r.data_ida = new.data
    and r.data_volta is null and r.preco_atual is not null
    and r.ultima_busca_em > now() - interval '2 hours';
  if conferido is not null and conferido > new.preco then
    new.preco := conferido;
  end if;
  return new;
end $$;
