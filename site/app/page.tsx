import Link from "next/link";
import { connection } from "next/server";
import { clienteServidor } from "@/lib/supabase/server";
import { data, haQuantoTempo, reais } from "@/lib/formato";
import { BRASIL } from "@/lib/aeroportos";
import type { Rota } from "@/lib/tipos";
import FormBusca from "./FormBusca";
import Ofertas, { type Promocao } from "./Ofertas";

export default async function Inicio() {
  await connection(); // preços e "atualizado há X" mudam a cada visita
  const supabase = await clienteServidor();
  const hoje = new Date().toISOString().slice(0, 10);
  const brasil = `(${BRASIL.join(",")})`;

  const [{ data: rotas }, { data: nacionais }, { data: paraFora }, { data: paraCasa }] = await Promise.all([
    supabase.from("rotas").select("*").not("preco_atual", "is", null).gte("data_ida", hoje)
      .order("ultima_busca_em", { ascending: false }).limit(6),
    supabase.from("promocoes").select("origem,destino,data,preco")
      .filter("origem", "in", brasil).filter("destino", "in", brasil).order("preco").limit(12),
    supabase.from("promocoes").select("origem,destino,data,preco")
      .filter("origem", "in", brasil).not("destino", "in", brasil).order("preco").limit(9),
    supabase.from("promocoes").select("origem,destino,data,preco")
      .not("origem", "in", brasil).filter("destino", "in", brasil).order("preco").limit(3),
  ]);
  const internacionais = [...(paraFora ?? []), ...(paraCasa ?? [])]
    .sort((a, b) => a.preco - b.preco)
    .slice(0, 12) as Promocao[];

  return (
    <div className="grid gap-10">
      <section className="heroi ponta-a-ponta -mt-6 pb-12 pt-8 text-white lg:pb-16 lg:pt-14">
        <div className="grid items-center gap-6 lg:grid-cols-[1fr_minmax(0,600px)] lg:gap-12">
          <div className="grid gap-3">
            <span className="w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
              ✈ LATAM · Gol · Azul · internacionais
            </span>
            <h1 className="text-3xl font-black leading-tight tracking-tight sm:text-5xl xl:text-6xl">
              Sua próxima viagem
              <br />
              <span className="text-amber-300">pelo menor preço.</span>
            </h1>
            <p className="max-w-xl text-sm text-sky-50 sm:text-lg">
              Comparamos todas as companhias, a ida e volta com os trechos separados, e avisamos quando o preço cair.
            </p>
            <ul className="hidden gap-x-6 gap-y-2 pt-2 text-sm font-semibold text-sky-50 lg:flex lg:flex-wrap">
              <li>✓ Preços atualizados 4× por dia</li>
              <li>✓ 3.500 rotas acompanhadas</li>
              <li>✓ Aviso quando o preço cair</li>
            </ul>
          </div>
          <FormBusca />
        </div>
      </section>

      <Ofertas nacionais={(nacionais ?? []) as Promocao[]} internacionais={internacionais} />

      {rotas && rotas.length > 0 && (
        <section className="grid gap-3">
          <h2 className="text-lg font-bold">Pesquisadas recentemente</h2>
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
            {(rotas as Rota[]).map((r) => (
              <Link key={r.id} href={`/rota/${r.id}`}
                className="grid w-48 shrink-0 gap-1 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:ring-sky-300">
                <span className="text-lg font-black">
                  {r.origem} <span className="text-sky-500">{r.data_volta ? "⇄" : "→"}</span> {r.destino}
                </span>
                <span className="text-xs text-slate-500">
                  {data(r.data_ida)}
                  {r.data_volta && ` a ${data(r.data_volta)}`}
                </span>
                <span className="text-xl font-black text-sky-700">{reais(r.preco_atual)}</span>
                <span className="text-[11px] text-slate-400">atualizado {haQuantoTempo(r.ultima_busca_em)}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
