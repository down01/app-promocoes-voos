"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { linkReserva } from "@/lib/reserva";

// Viagem só com o preço salvo da atualização geral: reserva direto ou pede os horários
export default function SemVoos({
  rotaId,
  origem,
  destino,
  ida,
  volta,
}: {
  rotaId: number;
  origem: string;
  destino: string;
  ida: string;
  volta: string | null;
}) {
  const router = useRouter();
  const [pedindo, setPedindo] = useState(false);
  const [erro, setErro] = useState("");

  async function verVoos() {
    setPedindo(true);
    setErro("");
    const r = await fetch("/api/voos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rota_id: rotaId }),
    });
    if (!r.ok) {
      setErro((await r.json().catch(() => null))?.erro ?? "Não deu para buscar agora.");
      setPedindo(false);
      return;
    }
    router.refresh(); // a página passa a mostrar "buscando" e se atualiza sozinha
  }

  const opcoes = [
    { rotulo: "LATAM", ...linkReserva("LATAM", origem, destino, ida, volta), cor: "#1b0088" },
    { rotulo: "Gol", ...linkReserva("Gol", origem, destino, ida, volta), cor: "#ff5a00" },
    { rotulo: "Azul e outras", ...linkReserva("", origem, destino, ida, volta), cor: "#0b4ea2" },
  ];

  return (
    <div className="grid gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div>
        <p className="font-semibold">Reservar agora</p>
        <p className="text-sm text-slate-500">
          Abre o site da companhia já com a rota e a data. O preço mostrado acima é da última atualização.
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {opcoes.map((o) => (
          <a
            key={o.rotulo}
            href={o.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl px-4 py-3 text-center text-sm font-bold text-white transition hover:opacity-90"
            style={{ background: o.cor }}
          >
            {o.rotulo} ↗
          </a>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-slate-200 pt-4">
        <p className="text-sm text-slate-600">Quer comparar horários e ver qual companhia tem esse preço?</p>
        <button className="botao-secundario" onClick={verVoos} disabled={pedindo}>
          {pedindo ? "Pedindo…" : "🕐 Ver horários e companhias"}
        </button>
      </div>
      {erro && <p className="text-sm text-red-700">{erro}</p>}
    </div>
  );
}
