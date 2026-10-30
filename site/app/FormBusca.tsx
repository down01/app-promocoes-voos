"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AEROPORTOS } from "@/lib/aeroportos";

// Aceita "VIX", "vix" ou "Vitória (VIX)" vindo da lista de sugestões
function codigo(texto: string) {
  const entre = texto.match(/\(([A-Za-z]{3})\)\s*$/);
  return (entre ? entre[1] : texto.trim()).toUpperCase();
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
      setErro("Escolha a origem e o destino na lista ou digite o código de 3 letras (ex.: VIX).");
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
    <form onSubmit={buscar} className="cartao grid gap-4">
      <datalist id="aeroportos">
        {Object.entries(AEROPORTOS).map(([sigla, nome]) => (
          <option key={sigla} value={`${nome} (${sigla})`} />
        ))}
      </datalist>

      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="radio" checked={!soIda} onChange={() => setSoIda(false)} /> Ida e volta
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" checked={soIda} onChange={() => setSoIda(true)} /> Só ida
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium text-slate-600">
          De onde
          <input className="campo" list="aeroportos" placeholder="Vitória (VIX)" value={origem}
            onChange={(e) => setOrigem(e.target.value)} required />
        </label>
        <label className="grid gap-1 text-sm font-medium text-slate-600">
          Para onde
          <input className="campo" list="aeroportos" placeholder="Santiago (SCL)" value={destino}
            onChange={(e) => setDestino(e.target.value)} required />
        </label>
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

      <button className="botao w-full sm:w-auto sm:justify-self-end" disabled={enviando}>
        {enviando ? "Buscando…" : "Buscar voos"}
      </button>
    </form>
  );
}
