"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { clienteNavegador } from "@/lib/supabase/navegador";

function numero(texto: string) {
  const n = parseInt(texto.replace(/\D/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export default function CriarAlerta({
  rotaId,
  idaEVolta,
  logado,
  jaTem,
}: {
  rotaId: number;
  idaEVolta: boolean;
  logado: boolean;
  jaTem: boolean;
}) {
  const caminho = usePathname();
  const [aberto, setAberto] = useState(false);
  const [limiteIdaVolta, setLimiteIdaVolta] = useState("");
  const [limiteIda, setLimiteIda] = useState("");
  const [limiteVolta, setLimiteVolta] = useState("");
  const [email, setEmail] = useState(true);
  const [push, setPush] = useState(false);
  const [estado, setEstado] = useState<"" | "salvando" | "pronto" | "erro">(jaTem ? "pronto" : "");

  if (estado === "pronto") {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
        <span>🔔 Você está acompanhando esta viagem. Avisamos quando aparecer promoção.</span>
        <Link href="/alertas" className="font-semibold underline">
          Ver meus alertas
        </Link>
      </div>
    );
  }

  if (!logado) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <span className="text-amber-900">🔔 Quer ser avisado quando o preço cair?</span>
        <Link href={`/entrar?next=${encodeURIComponent(caminho)}`} className="botao">
          Entrar e criar alerta
        </Link>
      </div>
    );
  }

  if (!aberto) {
    return (
      <button onClick={() => setAberto(true)} className="botao justify-self-start">
        🔔 Avisar quando ficar mais barato
      </button>
    );
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setEstado("salvando");
    const { error } = await clienteNavegador().from("alertas").insert({
      rota_id: rotaId,
      limite_ida_volta: idaEVolta ? numero(limiteIdaVolta) : null,
      limite_ida: numero(limiteIda),
      limite_volta: idaEVolta ? numero(limiteVolta) : null,
      avisar_email: email,
      avisar_push: push,
    });
    setEstado(error ? "erro" : "pronto");
  }

  return (
    <form onSubmit={salvar} className="cartao grid gap-4">
      <div>
        <h2 className="font-semibold">Criar alerta de promoção</h2>
        <p className="text-sm text-slate-500">
          Deixe em branco para avisarmos quando o preço ficar pelo menos 15% abaixo da média recente.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {idaEVolta && (
          <label className="grid gap-1 text-sm font-medium text-slate-600">
            Ida e volta até (R$)
            <input className="campo" inputMode="numeric" placeholder="automático" value={limiteIdaVolta}
              onChange={(e) => setLimiteIdaVolta(e.target.value)} />
          </label>
        )}
        <label className="grid gap-1 text-sm font-medium text-slate-600">
          {idaEVolta ? "Só a ida até (R$)" : "Preço até (R$)"}
          <input className="campo" inputMode="numeric" placeholder="automático" value={limiteIda}
            onChange={(e) => setLimiteIda(e.target.value)} />
        </label>
        {idaEVolta && (
          <label className="grid gap-1 text-sm font-medium text-slate-600">
            Só a volta até (R$)
            <input className="campo" inputMode="numeric" placeholder="automático" value={limiteVolta}
              onChange={(e) => setLimiteVolta(e.target.value)} />
          </label>
        )}
      </div>
      <fieldset className="grid gap-2 text-sm">
        <legend className="mb-1 font-medium text-slate-600">Como avisar</legend>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={email} onChange={(e) => setEmail(e.target.checked)} /> E-mail
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={push} onChange={(e) => setPush(e.target.checked)} /> Notificação no celular
          <span className="text-slate-400">(ative em Meus alertas)</span>
        </label>
      </fieldset>
      {estado === "erro" && <p className="text-sm text-red-700">Não deu para salvar. Tente de novo.</p>}
      <div className="flex gap-2">
        <button className="botao" disabled={estado === "salvando"}>
          {estado === "salvando" ? "Salvando…" : "Criar alerta"}
        </button>
        <button type="button" className="botao-secundario" onClick={() => setAberto(false)}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
