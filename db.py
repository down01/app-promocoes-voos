"""Acesso ao Supabase pela API REST, usando a chave secreta (só no servidor)."""
import os

import requests


class Banco:
    def __init__(self, url=None, chave=None):
        self.url = (url or os.environ["SUPABASE_URL"]).rstrip("/")
        chave = chave or os.environ["SUPABASE_SECRET_KEY"]
        self.sessao = requests.Session()
        self.sessao.headers.update({
            "apikey": chave,
            "Authorization": f"Bearer {chave}",
            "Content-Type": "application/json",
        })

    def _req(self, metodo, caminho, **kw):
        r = self.sessao.request(metodo, f"{self.url}{caminho}", timeout=30, **kw)
        r.raise_for_status()
        return r.json() if r.content else None

    def selecionar(self, tabela, **params):
        return self._req("GET", f"/rest/v1/{tabela}", params=params)

    def inserir(self, tabela, dados, conflito=None):
        headers = {"Prefer": "return=representation"}
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
