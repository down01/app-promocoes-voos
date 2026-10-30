"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { data, reais, trajeto } from "@/lib/formato";
import { clienteNavegador } from "@/lib/supabase/navegador";
import type { Alerta } from "@/lib/tipos";

export default function CartaoAlerta({ alerta }: { alerta: Alerta }) {
  const router = useRouter();
  const [a, setA] = useState(alerta);
  const r = a.rota;

  async function mudar(campos: Partial<Alerta>) {
    setA({ ...a, ...campos });
    await clienteNavegador().from("alertas").update(campos).eq("id", a.id);
  }

  async function apagar() {
    if (!window.confirm("Apagar este alerta?")) return;
    await clienteNavegador().from("alertas").delete().eq("id", a.id);
    router.refresh();
  }

  const limites = [
    r.data_volta && a.limite_ida_volta ? `ida e volta até ${reais(a.limite_ida_volta)}` : null,
    a.limite_ida ? `${r.data_volta ? "ida" : "preço"} até ${reais(a.limite_ida)}` : null,
    r.data_volta && a.limite_volta ? `volta até ${reais(a.limite_volta)}` : null,
  ].filter(Boolean);

  return (
    <div className={`cartao grid gap-3 ${a.ativo ? "" : "opacity-60"}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <Link href={`/rota/${r.id}`} className="grid gap-0.5 hover:text-sky-700">
          <span className="font-semibold">{trajeto(r.origem, r.destino)}</span>
          <span className="text-sm text-slate-500">
            {r.data_volta ? `${data(r.data_ida)} a ${data(r.data_volta)}` : `${data(r.data_ida)} · só ida`}
          </span>
        </Link>
        <span className="text-xl font-bold text-sky-700">{reais(r.preco_atual)}</span>
      </div>
      <p className="text-sm text-slate-600">
        Avisar: {limites.length ? limites.join(" · ") : "quando ficar 15% abaixo da média"}
      </p>
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <label className="flex items-center gap-1.5">
          <input type="checkbox" checked={a.avisar_email} onChange={(e) => mudar({ avisar_email: e.target.checked })} /> E-mail
        </label>
        <label className="flex items-center gap-1.5">
          <input type="checkbox" checked={a.avisar_telegram} onChange={(e) => mudar({ avisar_telegram: e.target.checked })} /> Telegram
        </label>
        <label className="flex items-center gap-1.5">
          <input type="checkbox" checked={a.avisar_push} onChange={(e) => mudar({ avisar_push: e.target.checked })} /> Celular
        </label>
        <span className="flex-1" />
        <button className="botao-secundario py-1.5 text-sm" onClick={() => mudar({ ativo: !a.ativo })}>
          {a.ativo ? "Pausar" : "Retomar"}
        </button>
        <button className="rounded-lg px-2 py-1.5 text-sm text-red-600 hover:bg-red-50" onClick={apagar}>
          Apagar
        </button>
      </div>
    </div>
  );
}
