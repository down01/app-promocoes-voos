"use client";

import { useId, useState } from "react";
import { sugerirAeroportos } from "@/lib/aeroportos";

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
  const sugestoes = aberto ? sugerirAeroportos(valor.replace(/\s*\([A-Z]{3}\)\s*$/, "")) : [];

  function escolher(i: number) {
    const s = sugestoes[i];
    if (!s) return;
    aoMudar(`${s.nome} (${s.codigo})`);
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
              <span className="grid h-10 w-12 shrink-0 place-items-center rounded-lg bg-sky-600 text-sm font-black text-white">
                {s.codigo}
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
