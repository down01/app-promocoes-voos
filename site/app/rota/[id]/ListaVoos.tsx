"use client";

import { useEffect, useState } from "react";
import { reais } from "@/lib/formato";
import { companhias, estiloCompanhia, linkReserva } from "@/lib/reserva";
import type { Voo } from "@/lib/tipos";

// "GIG–GRU" → ["GIG", "GRU"], "GRU–YYZ–HNL" → ["GRU", "HNL"]; sem a informação, usa os da viagem
function pontas(v: Voo, origem: string, destino: string) {
  const partes = (v.aeroportos ?? "").split(/[–-]/).filter(Boolean);
  return partes.length >= 2 ? [partes[0], partes[partes.length - 1]] : [origem, destino];
}

const caminho = (aeroportos: string) => aeroportos.split(/[–-]/).join(" → ");

function SeloCompanhia({ nome }: { nome: string }) {
  const c = estiloCompanhia(nome);
  return (
    <span className="rounded-md px-2 py-0.5 text-xs font-bold" style={{ background: c.cor, color: c.texto }}>
      {c.nome}
    </span>
  );
}

export default function ListaVoos({
  voos,
  origem,
  destino,
  ida,
  volta,
  buscando,
}: {
  voos: Voo[];
  origem: string;
  destino: string;
  ida: string;
  volta: string | null;
  buscando: boolean;
}) {
  const [aberto, setAberto] = useState<Voo | null>(null);

  useEffect(() => {
    if (!aberto) return;
    const fechar = (e: KeyboardEvent) => e.key === "Escape" && setAberto(null);
    window.addEventListener("keydown", fechar);
    return () => window.removeEventListener("keydown", fechar);
  }, [aberto]);

  if (!voos.length) {
    return (
      <div className="cartao text-sm text-slate-500">
        {buscando ? "Aguardando o resultado da busca…" : "Nenhum voo encontrado ainda."}
      </div>
    );
  }

  const menor = Math.min(...voos.map((v) => v.preco));
  const [abertoDe, abertoPara] = aberto ? pontas(aberto, origem, destino) : [origem, destino];
  const reserva = aberto ? linkReserva(aberto.companhia, abertoDe, abertoPara, ida, volta) : null;
  const variosAeroportos =
    new Set(voos.map((v) => v.aeroportos).filter(Boolean)).size > 1 || voos.some((v) => v.separado);
  const nomeReserva = aberto ? companhias(aberto.companhia) : [];

  return (
    <>
      <ul className="grid gap-2">
        {voos.map((v, i) => (
          <li key={i}>
            <button
              onClick={() => setAberto(v)}
              className="group flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md"
            >
              <div className="grid flex-1 gap-1.5">
                <div className="flex flex-wrap gap-1">
                  {companhias(v.companhia).map((c) => (
                    <SeloCompanhia key={c} nome={c} />
                  ))}
                  {v.preco === menor && (
                    <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                      mais barato
                    </span>
                  )}
                  {v.separado && (
                    <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                      bilhetes separados
                    </span>
                  )}
                </div>
                <p className="text-lg font-bold tracking-tight">
                  {v.saida} <span className="text-slate-300">→</span> {v.chegada}
                </p>
                <p className="text-xs text-slate-500">
                  {variosAeroportos && v.aeroportos && (
                    <span className="mr-1 font-bold text-slate-700">{caminho(v.aeroportos)} ·</span>
                  )}
                  {v.duracao} · {v.paradas}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-extrabold text-sky-700">{reais(v.preco)}</p>
                <p className="text-xs font-semibold text-sky-600 group-hover:underline">ver e reservar ›</p>
              </div>
            </button>
          </li>
        ))}
      </ul>

      {aberto && reserva && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 sm:items-center"
          onClick={() => setAberto(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Detalhes do voo"
        >
          <div
            className="animar-subir grid w-full max-w-md gap-4 rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto h-1.5 w-12 rounded-full bg-slate-200 sm:hidden" />
            <div className="flex flex-wrap items-center gap-1.5">
              {nomeReserva.map((c) => (
                <SeloCompanhia key={c} nome={c} />
              ))}
              <span className="text-sm text-slate-500">{volta ? "ida e volta" : "só ida"}</span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-3xl font-black">{abertoDe}</p>
                <p className="text-sm font-semibold text-slate-600">{aberto.saida}</p>
              </div>
              <div className="relative flex-1 border-t-2 border-dashed border-sky-200">
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-sky-600 px-1.5 text-white">✈</span>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black">{abertoPara}</p>
                <p className="text-sm font-semibold text-slate-600">{aberto.chegada}</p>
              </div>
            </div>
            <p className="text-center text-sm text-slate-500">
              {aberto.separado && aberto.aeroportos && <span className="font-bold">{caminho(aberto.aeroportos)} · </span>}
              {aberto.duracao} · {aberto.paradas}
            </p>

            <div className="flex items-baseline justify-between rounded-2xl bg-sky-50 p-4">
              <span className="text-sm text-slate-600">Preço por pessoa</span>
              <span className="text-3xl font-black text-sky-700">{reais(aberto.preco)}</span>
            </div>

            {aberto.separado && aberto.trechos ? (
              <>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  <p className="font-bold">⚠️ Dois bilhetes comprados separados</p>
                  <p className="mt-1">
                    Na conexão você pega a mala e faz o check-in de novo. Se o primeiro voo atrasar e você
                    perder o segundo, a outra companhia não é obrigada a te remarcar. Confira também se precisa
                    de visto no país da conexão.
                  </p>
                </div>
                {aberto.trechos.map((t, i) => {
                  const r = linkReserva(t.companhia, t.origem, t.destino, t.data, null);
                  return (
                    <div key={i} className="grid gap-2 rounded-2xl border border-slate-200 p-3">
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="font-bold">
                          {i + 1}º bilhete · {t.origem} → {t.destino}
                        </span>
                        <span className="font-black text-sky-700">{reais(t.preco)}</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {t.data.split("-").reverse().join("/")} · {t.saida} → {t.chegada} · {t.duracao} · {t.paradas}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {companhias(t.companhia).map((c) => (
                          <SeloCompanhia key={c} nome={c} />
                        ))}
                      </div>
                      <a href={r.url} target="_blank" rel="noopener noreferrer" className="botao py-2.5 text-sm">
                        Comprar o {i + 1}º bilhete ↗
                      </a>
                    </div>
                  );
                })}
              </>
            ) : (
              <>
                <a href={reserva.url} target="_blank" rel="noopener noreferrer" className="botao py-3.5 text-base">
                  Ir para reserva {nomeReserva.length === 1 ? `na ${estiloCompanhia(nomeReserva[0]).nome}` : ""} ↗
                </a>
                <p className="text-center text-xs text-slate-400">
                  Você vai para o {reserva.destino} com essa rota e data já preenchidas. O preço final é confirmado lá.
                </p>
              </>
            )}
            <button className="text-sm text-slate-500 underline" onClick={() => setAberto(null)}>
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
