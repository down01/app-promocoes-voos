"use client";

import { useState } from "react";
import { clienteNavegador } from "@/lib/supabase/navegador";

export default function FormEntrar({ proximo }: { proximo: string }) {
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<"" | "enviando" | "enviado" | "erro">("");
  const [mensagem, setMensagem] = useState("");

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEstado("enviando");
    const { error } = await clienteNavegador().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(proximo)}` },
    });
    if (error) {
      setMensagem(error.message.includes("rate") ? "Muitos e-mails enviados. Espere alguns minutos." : error.message);
      setEstado("erro");
    } else {
      setEstado("enviado");
    }
  }

  if (estado === "enviado") {
    return (
      <div className="cartao text-slate-700">
        📬 Mandamos um link para <b>{email}</b>. Abra o e-mail neste aparelho e clique no link para entrar. Se não
        chegar em 2 minutos, olhe o spam.
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="cartao grid gap-3">
      <label className="grid gap-1 text-sm font-medium text-slate-600">
        E-mail
        <input className="campo" type="email" required autoComplete="email" value={email}
          onChange={(e) => setEmail(e.target.value)} placeholder="voce@exemplo.com" />
      </label>
      {estado === "erro" && <p className="text-sm text-red-700">{mensagem}</p>}
      <button className="botao" disabled={estado === "enviando"}>
        {estado === "enviando" ? "Enviando…" : "Receber link de acesso"}
      </button>
    </form>
  );
}
