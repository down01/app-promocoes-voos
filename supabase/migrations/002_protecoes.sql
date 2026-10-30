-- Só quem está logado registra rotas, e com datas válidas (evita encher a fila do robô)
create or replace function public.registrar_rota(p_origem text, p_destino text, p_ida date, p_volta date default null)
returns public.rotas
language plpgsql security definer set search_path = '' as $$
declare r public.rotas;
begin
  if p_ida < current_date or p_ida > current_date + 365 then
    raise exception 'Data de ida precisa estar entre hoje e 1 ano';
  end if;
  if p_volta is not null and (p_volta < p_ida or p_volta > p_ida + 180) then
    raise exception 'Data de volta inválida';
  end if;
  if upper(p_origem) = upper(p_destino) then
    raise exception 'Origem e destino iguais';
  end if;
  insert into public.rotas (origem, destino, data_ida, data_volta)
  values (upper(p_origem), upper(p_destino), p_ida, p_volta)
  on conflict (origem, destino, data_ida, data_volta)
    do update set ultimo_interesse_em = now()
  returning * into r;
  return r;
end $$;

revoke execute on function public.registrar_rota(text, text, date, date) from public, anon;
grant execute on function public.registrar_rota(text, text, date, date) to authenticated;

create index pedidos_busca_rota on public.pedidos_busca (rota_id);
create index push_assinaturas_usuario on public.push_assinaturas (user_id);
