"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { sugerirAeroportos } from "@/lib/aeroportos";
import CampoAeroporto from "./CampoAeroporto";

// Aceita "Vitória (VIX)" da lista, "VIX"/"vix", ou uma cidade digitada sem escolher ("vitoria")
function codigo(texto: string) {
  const entre = texto.match(/\(([A-Za-z]{3})\)\s*$/);
  if (entre) return entre[1].toUpperCase();
  const limpo = texto.trim();
  if (/^[A-Za-z]{3}$/.test(limpo)) return limpo.toUpperCase();
  return sugerirAeroportos(limpo, 1)[0]?.codigo ?? "";
}

export default function FormBusca({ origemPadrao = "" }: { origemPadrao?: string }) {
  const router = useRouter();
  const [origem, setOrigem] = useState(origemPadrao);
  const [destino, setDestino] = useState("");
  const [ida, setIda] = useState("");
  const [volta, setVolta] = useState("");
  const [soIda, setSoIda] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  async function buscar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    const o = codigo(origem);
    const d = codigo(destino);
    if (!/^[A-Z]{3}$/.test(o) || !/^[A-Z]{3}$/.test(d)) {
      setErro("Não achei esse lugar. Comece a digitar a cidade e escolha na lista (ex.: Vitória).");
      return;
    }
    setEnviando(true);
    const r = await fetch("/api/buscar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origem: o, destino: d, ida, volta: soIda ? null : volta || null }),
    });
    const resposta = await r.json();
    if (!r.ok) {
      setErro(resposta.erro ?? "Não deu para buscar agora.");
      setEnviando(false);
      return;
    }
    router.push(`/rota/${resposta.rota_id}`);
  }

  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <form onSubmit={buscar} className="grid gap-4 rounded-3xl bg-white p-5 text-slate-900 shadow-xl shadow-sky-900/20">
      <div className="flex gap-2 text-sm font-semibold" role="radiogroup" aria-label="Tipo de viagem">
        {[
          { valor: false, rotulo: "⇄ Ida e volta" },
          { valor: true, rotulo: "→ Só ida" },
        ].map((t) => (
          <button
            key={t.rotulo}
            type="button"
            role="radio"
            aria-checked={soIda === t.valor}
            onClick={() => setSoIda(t.valor)}
            className={`rounded-full px-4 py-1.5 transition ${
              soIda === t.valor ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {t.rotulo}
          </button>
        ))}
      </div>

      <div className="relative grid gap-3 sm:grid-cols-2">
        <CampoAeroporto rotulo="🛫 De onde" placeholder="Cidade, aeroporto ou país" valor={origem} aoMudar={setOrigem} />
        <button
          type="button"
          aria-label="Trocar origem e destino"
          onClick={() => {
            setOrigem(destino);
            setDestino(origem);
          }}
          className="absolute right-4 top-1/2 z-10 grid h-9 w-9 translate-y-[2px] place-items-center rounded-full bg-sky-600 text-white shadow-md transition hover:rotate-180 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:translate-y-[10px]"
        >
          ⇅
        </button>
        <CampoAeroporto rotulo="🛬 Para onde" placeholder="Cidade, aeroporto ou país" valor={destino} aoMudar={setDestino} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium text-slate-600">
          Ida
          <input className="campo" type="date" min={hoje} value={ida} onChange={(e) => setIda(e.target.value)} required />
        </label>
        {!soIda && (
          <label className="grid gap-1 text-sm font-medium text-slate-600">
            Volta
            <input className="campo" type="date" min={ida || hoje} value={volta}
              onChange={(e) => setVolta(e.target.value)} required />
          </label>
        )}
      </div>

      {erro && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}

      <button className="botao w-full py-3.5 text-base" disabled={enviando}>
        {enviando ? "Buscando…" : "🔎 Buscar voos"}
      </button>
    </form>
  );
}
