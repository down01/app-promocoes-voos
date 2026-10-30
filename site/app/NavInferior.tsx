"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITENS = [
  { href: "/", rotulo: "Buscar", icone: "🔎" },
  { href: "/#ofertas", rotulo: "Promoções", icone: "🔥" },
  { href: "/alertas", rotulo: "Alertas", icone: "🔔" },
  { href: "/entrar", rotulo: "Conta", icone: "👤" },
];

// Barra de navegação fixa embaixo, só no celular (estilo aplicativo)
export default function NavInferior() {
  const caminho = usePathname();
  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 rounded-2xl bg-white/95 p-1.5 shadow-xl shadow-slate-900/15 ring-1 ring-slate-200 backdrop-blur sm:hidden">
      {ITENS.map((i) => {
        const ativo = i.href === "/" ? caminho === "/" : caminho.startsWith(i.href.replace("/#ofertas", "/__"));
        return (
          <Link
            key={i.href}
            href={i.href}
            className={`grid justify-items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-semibold transition ${
              ativo ? "bg-sky-50 text-sky-700" : "text-slate-500"
            }`}
          >
            <span className="text-lg leading-none">{i.icone}</span>
            {i.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
