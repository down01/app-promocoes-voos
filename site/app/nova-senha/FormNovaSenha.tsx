"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { clienteNavegador } from "@/lib/supabase/navegador";

export default function FormNovaSenha() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (senha !== confirmacao) return setErro("As duas senhas não são iguais.");
    setSalvando(true);
    const { error } = await clienteNavegador().auth.updateUser({ password: senha });
    if (error) {
      setErro(error.message.includes("should be") ? "A senha precisa ter pelo menos 6 caracteres." : error.message);
      setSalvando(false);
      return;
    }
    router.push("/alertas");
    router.refresh();
  }

  return (
    <form onSubmit={salvar} className="cartao grid gap-3">
      <label className="grid gap-1 text-sm font-medium text-slate-600">
        Senha nova
        <input className="campo" type="password" required minLength={6} autoComplete="new-password" value={senha}
          onChange={(e) => setSenha(e.target.value)} placeholder="mínimo 6 caracteres" />
      </label>
      <label className="grid gap-1 text-sm font-medium text-slate-600">
        Repita a senha
        <input className="campo" type="password" required minLength={6} autoComplete="new-password"
          value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} />
      </label>
      {erro && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}
      <button className="botao" disabled={salvando}>{salvando ? "Salvando…" : "Salvar senha"}</button>
    </form>
  );
}
