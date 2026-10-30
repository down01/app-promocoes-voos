"use client";

import { useState } from "react";
import { data, reais } from "@/lib/formato";
import Bilhete from "./Bilhete";

export type Promocao = { origem: string; destino: string; data: string; preco: number };

const FILTROS = [
  { id: "todos", rotulo: "✨ Todas" },
  { id: "brasil", rotulo: "🇧🇷 Brasil" },
  { id: "exterior", rotulo: "🌎 Exterior" },
] as const;

// Promoções da atualização geral em cartões de embarque, com filtro por tipo de viagem
export default function Ofertas({ nacionais, internacionais }: { nacionais: Promocao[]; internacionais: Promocao[] }) {
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]["id"]>("todos");
  if (!nacionais.length && !internacionais.length) return null;

  const lista =
    filtro === "brasil"
      ? nacionais
      : filtro === "exterior"
        ? internacionais
        : [...nacionais.slice(0, 6), ...internacionais.slice(0, 6)].sort((a, b) => a.preco - b.preco);

  return (
    <section id="ofertas" className="grid scroll-mt-20 gap-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Promoções de agora 🔥</h2>
          <p className="text-sm text-slate-500">O dia mais barato de cada rota nos próximos meses, por pessoa, só ida.</p>
        </div>
      </div>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {FILTROS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFiltro(f.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
              filtro === f.id
                ? "bg-sky-600 text-white shadow-md shadow-sky-600/30"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-sky-300"
            }`}
          >
            {f.rotulo}
          </button>
        ))}
      </div>
      {lista.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {lista.map((p) => (
            // <a> comum: o link cria a viagem no banco, então não deve ser pré-carregado
            <a
              key={`${p.origem}-${p.destino}`}
              href={`/ir?o=${p.origem}&d=${p.destino}&ida=${p.data}`}
              className="block transition hover:-translate-y-1 hover:drop-shadow-lg"
            >
              <Bilhete
                origem={p.origem}
                destino={p.destino}
                etiqueta={
                  <>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                      Promoção
                    </span>
                    <span className="text-xs font-semibold text-sky-600">ver voos ›</span>
                  </>
                }
                rodape={
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Data</p>
                      <p className="font-semibold">{data(p.data)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">a partir de</p>
                      <p className="text-2xl font-black text-sky-700">{reais(p.preco)}</p>
                    </div>
                  </div>
                }
              />
            </a>
          ))}
        </div>
      ) : (
        <p className="cartao text-sm text-slate-500">As promoções desta categoria aparecem depois da próxima atualização.</p>
      )}
    </section>
  );
}
