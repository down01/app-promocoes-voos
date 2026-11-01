"""Acesso ao Supabase pela API REST, usando a chave secreta (só no servidor)."""
import os
import time

import requests


class Banco:
    def __init__(self, url=None, chave=None):
        self.url = (url or os.environ["SUPABASE_URL"]).strip().rstrip("/")
        chave = (chave or os.environ["SUPABASE_SECRET_KEY"]).strip()  # espaço/quebra de linha ao colar
        if chave.startswith("sb_publishable_"):
            raise SystemExit("SUPABASE_SECRET_KEY contém a publishable key; use a secret key (sb_secret_...).")
        self.sessao = requests.Session()
        # Chaves novas (sb_secret_...) vão só no cabeçalho apikey; no Authorization o Supabase recusa
        self.sessao.headers.update({"apikey": chave, "Content-Type": "application/json"})
        if not chave.startswith("sb_"):
            self.sessao.headers["Authorization"] = f"Bearer {chave}"  # chave antiga (service_role JWT)

    def _req(self, metodo, caminho, tentativas=4, **kw):
        # Durante a rodada geral o banco fica carregado (20 jobs gravando + recálculo das promoções)
        # e às vezes demora ou devolve 5xx. Gravações são upserts e o rpc é idempotente: dá para repetir.
        for tentativa in range(1, tentativas + 1):
            try:
                r = self.sessao.request(metodo, f"{self.url}{caminho}", timeout=60, **kw)
                if r.status_code < 500 or tentativa == tentativas:
                    r.raise_for_status()
                    return r.json() if r.content else None
                motivo = f"HTTP {r.status_code}"
            except (requests.ConnectionError, requests.Timeout) as e:
                if tentativa == tentativas:
                    raise
                motivo = type(e).__name__
            espera = 5 * 2 ** (tentativa - 1)  # 5, 10, 20 s
            print(f"Banco: {motivo} em {metodo} {caminho}; nova tentativa em {espera} s", flush=True)
            time.sleep(espera)

    def selecionar(self, tabela, **params):
        return self._req("GET", f"/rest/v1/{tabela}", params=params)

    def inserir(self, tabela, dados, conflito=None, retornar=True):
        headers = {"Prefer": "return=representation" if retornar else "return=minimal"}
        params = {}
        if conflito:
            headers["Prefer"] += ",resolution=merge-duplicates"
            params["on_conflict"] = conflito
        return self._req("POST", f"/rest/v1/{tabela}", json=dados, headers=headers, params=params)

    def atualizar(self, tabela, dados, **filtros):
        return self._req("PATCH", f"/rest/v1/{tabela}", json=dados, params=filtros,
                         headers={"Prefer": "return=representation"})

    def rpc(self, funcao, **args):
        return self._req("POST", f"/rest/v1/rpc/{funcao}", json=args)

    def usuario(self, user_id):
        return self._req("GET", f"/auth/v1/admin/users/{user_id}")
