-- O recálculo das promoções (refresh da materialized view sobre ~540 mil dias) leva de 5 a 10 s,
-- mais quando o robô está gravando. Pela API ele herdava o limite de 8 s do authenticator e
-- voltava erro 500 no rpc atualizar_promocoes, derrubando o job "alertas".
-- O service_role só é usado pelo robô (chave secreta), então ganha um limite maior.
alter role service_role set statement_timeout = '2min';
notify pgrst, 'reload config';
