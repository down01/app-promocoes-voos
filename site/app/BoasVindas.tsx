"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";

const CHAVE = "voo-barato:pulou-cadastro";
const nada = () => () => {};

function jaPulou() {
  try {
    return localStorage.getItem(CHAVE) === "1";
  } catch {
    return true; // sem acesso ao armazenamento (navegação privada): não incomoda
  }
}

// Primeira visita sem login: oferece entrar, criar conta ou pular
export default function BoasVindas() {
  const caminho = usePathname();
  const pulouAntes = useSyncExternalStore(nada, jaPulou, () => true);
  const [fechada, setFechada] = useState(false);

  if (pulouAntes || fechada || caminho.startsWith("/entrar") || caminho.startsWith("/nova-senha")) return null;

  function pular() {
    try {
      localStorage.setItem(CHAVE, "1");
    } catch {}
    setFechada(true);
  }

  const voltar = encodeURIComponent(caminho);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center"
      role="dialog" aria-modal="true" aria-labelledby="boas-vindas-titulo">
      <div className="grid w-full max-w-sm gap-4 rounded-2xl bg-white p-6 shadow-xl">
        <div className="grid gap-1 text-center">
          <span className="text-4xl" aria-hidden>✈️</span>
          <h2 id="boas-vindas-titulo" className="text-xl font-bold">Bem-vindo ao Voo Barato</h2>
          <p className="text-sm text-slate-600">
            Crie uma conta para receber aviso quando o preço da sua viagem cair. Para só pesquisar preços, não precisa.
          </p>
        </div>
        <Link href={`/entrar?modo=criar&next=${voltar}`} className="botao" onClick={() => setFechada(true)}>
          Criar conta
        </Link>
        <Link href={`/entrar?next=${voltar}`} className="botao-secundario" onClick={() => setFechada(true)}>
          Já tenho conta — Entrar
        </Link>
        <button className="text-sm text-slate-500 underline" onClick={pular}>
          Pular por enquanto
        </button>
      </div>
    </div>
  );
}
