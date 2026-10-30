-- Despertador da atualização geral: o agendamento do GitHub pulou rodadas, então o banco dispara.
-- Às 0h, 6h, 12h e 18h de Brasília o pg_cron gera um código de uso único e chama o site,
-- que confere o código aqui (consumir_disparo) e só então pede a rodada ao GitHub.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

create table public.cron_disparos (
  codigo uuid primary key default gen_random_uuid(),
  criado_em timestamptz not null default now(),
  usado_em timestamptz
);
alter table public.cron_disparos enable row level security; -- ninguém lê pela API

create function public.consumir_disparo(p_codigo uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  update public.cron_disparos set usado_em = now()
  where codigo = p_codigo and usado_em is null and criado_em > now() - interval '5 minutes';
  return found;
end $$;
revoke execute on function public.consumir_disparo(uuid) from public;
grant execute on function public.consumir_disparo(uuid) to anon, authenticated;

create function public.disparar_atualizacao_geral() returns void
language plpgsql security definer set search_path = '' as $$
declare c uuid;
begin
  insert into public.cron_disparos default values returning codigo into c;
  perform net.http_post(
    url := 'https://voo-barato-lilac.vercel.app/api/cron',
    body := jsonb_build_object('codigo', c),
    headers := '{"Content-Type": "application/json"}'::jsonb,
    timeout_milliseconds := 20000
  );
end $$;
revoke execute on function public.disparar_atualizacao_geral() from public, anon, authenticated;

-- 03h, 09h, 15h e 21h UTC = 00h, 06h, 12h e 18h em Brasília
select cron.schedule('atualizacao-geral', '0 3,9,15,21 * * *', 'select public.disparar_atualizacao_geral()');
