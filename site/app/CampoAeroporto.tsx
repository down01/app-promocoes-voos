"use client";

import { useEffect, useId, useState } from "react";
import { sugerirAeroportos, type Sugestao } from "@/lib/aeroportos";

const LIMPAR = /\s*\(([A-Z]{3}|todos|país inteiro|estado inteiro)\)\s*$/g;

// Campo com lista de sugestões própria (o <datalist> no celular só aparece como chips do teclado)
export default function CampoAeroporto({
  rotulo,
  valor,
  aoMudar,
  placeholder,
}: {
  rotulo: React.ReactNode;
  valor: string;
  aoMudar: (v: string) => void;
  placeholder: string;
}) {
  const id = useId();
  const [aberto, setAberto] = useState(false);
  const [ativo, setAtivo] = useState(0);
  const texto = valor.replace(LIMPAR, "");
  const locais = aberto ? sugerirAeroportos(texto) : [];
  // Poucas sugestões na lista principal: procura no mundo todo (Honolulu, Bali...)
  const [mundo, setMundo] = useState<{ texto: string; lista: Sugestao[] }>({ texto: "", lista: [] });
  const precisaMundo = aberto && texto.trim().length >= 3 && locais.length < 4;
  useEffect(() => {
    if (!precisaMundo) return;
    const pedido = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/aeroportos?q=${encodeURIComponent(texto)}`, { signal: pedido.signal });
        if (r.ok) setMundo({ texto, lista: (await r.json()) as Sugestao[] });
      } catch {} // digitou de novo antes de chegar, ou sem internet: fica só com a lista principal
    }, 250);
    return () => {
      clearTimeout(t);
      pedido.abort();
    };
  }, [precisaMundo, texto]);
  const extras = precisaMundo && mundo.texto === texto
    ? mundo.lista.filter((m) => !locais.some((l) => l.codigo === m.codigo))
    : [];
  const sugestoes = [...locais, ...extras].slice(0, 8);

  function escolher(i: number) {
    const s = sugestoes[i];
    if (!s) return;
    aoMudar(s.grupo ? s.nome : `${s.nome} (${s.codigo})`);
    setAberto(false);
  }

  function teclas(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!sugestoes.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setAtivo((a) => (a + 1) % sugestoes.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setAtivo((a) => (a - 1 + sugestoes.length) % sugestoes.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      escolher(ativo);
    } else if (e.key === "Escape") {
      setAberto(false);
    }
  }

  return (
    <div className="relative grid gap-1 text-sm font-medium text-slate-600">
      <label htmlFor={id}>{rotulo}</label>
      <input
        id={id}
        className="campo"
        placeholder={placeholder}
        value={valor}
        autoComplete="off"
        role="combobox"
        aria-expanded={sugestoes.length > 0}
        aria-controls={`${id}-lista`}
        aria-activedescendant={sugestoes.length ? `${id}-op-${ativo}` : undefined}
        onChange={(e) => {
          aoMudar(e.target.value);
          setAberto(true);
          setAtivo(0);
        }}
        onFocus={(e) => {
          e.target.select();
          setAberto(true);
        }}
        onBlur={() => setTimeout(() => setAberto(false), 150)}
        onKeyDown={teclas}
        required
      />
      {sugestoes.length > 0 && (
        <ul
          id={`${id}-lista`}
          role="listbox"
          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-80 overflow-auto rounded-2xl bg-white p-1.5 shadow-2xl ring-1 ring-slate-200"
        >
          {sugestoes.map((s, i) => (
            <li
              key={s.codigo}
              id={`${id}-op-${i}`}
              role="option"
              aria-selected={i === ativo}
              onMouseDown={(e) => {
                e.preventDefault(); // não deixa o campo perder o foco antes de escolher
                escolher(i);
              }}
              onMouseEnter={() => setAtivo(i)}
              className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 ${
                i === ativo ? "bg-sky-50" : ""
              }`}
            >
              <span
                className={`grid h-10 w-12 shrink-0 place-items-center rounded-lg text-sm font-black text-white ${
                  s.cidade || s.grupo ? "bg-emerald-600" : "bg-sky-600"
                }`}
              >
                {s.selo ?? s.codigo}
              </span>
              <span className="grid min-w-0">
                <span className="truncate font-semibold text-slate-900">{s.nome}</span>
                <span className="text-xs text-slate-500">{s.pais}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
