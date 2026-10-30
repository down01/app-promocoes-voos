import Link from "next/link";
import { connection } from "next/server";
import { clienteServidor } from "@/lib/supabase/server";
import { data, haQuantoTempo, reais, trajeto } from "@/lib/formato";
import { BRASIL } from "@/lib/aeroportos";
import type { Rota } from "@/lib/tipos";
import FormBusca from "./FormBusca";
import MaisBaratas, { type Promocao } from "./MaisBaratas";

export default async function Inicio() {
  await connection(); // preços e "atualizado há X" mudam a cada visita
  const supabase = await clienteServidor();
  const hoje = new Date().toISOString().slice(0, 10);
  const { data: rotas } = await supabase
    .from("rotas")
    .select("*")
    .not("preco_atual", "is", null)
    .gte("data_ida", hoje)
    .order("ultima_busca_em", { ascending: false })
    .limit(6);

  const brasil = `(${BRASIL.join(",")})`;
  const [{ data: nacionais }, { data: paraFora }, { data: paraCasa }] = await Promise.all([
    supabase.from("promocoes").select("origem,destino,data,preco")
      .filter("origem", "in", brasil).filter("destino", "in", brasil).order("preco").limit(9),
    supabase.from("promocoes").select("origem,destino,data,preco")
      .filter("origem", "in", brasil).not("destino", "in", brasil).order("preco").limit(9),
    supabase.from("promocoes").select("origem,destino,data,preco")
      .not("origem", "in", brasil).filter("destino", "in", brasil).order("preco").limit(3),
  ]);
  const internacionais = [...(paraFora ?? []), ...(paraCasa ?? [])]
    .sort((a, b) => a.preco - b.preco)
    .slice(0, 9) as Promocao[];

  return (
    <div className="grid gap-8">
      <section className="grid gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Ache a passagem mais barata</h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Buscamos em todas as companhias (LATAM, Gol, Azul e as estrangeiras) e comparamos a ida e volta com a ida e
            a volta compradas separadas. Crie um alerta e avisamos quando o preço cair.
          </p>
        </div>
        <FormBusca />
      </section>

      <MaisBaratas titulo="🇧🇷 Mais baratas no Brasil" promocoes={(nacionais ?? []) as Promocao[]} />
      <MaisBaratas titulo="🌎 Mais baratas para fora" promocoes={internacionais} />

      {rotas && rotas.length > 0 && (
        <section className="grid gap-3">
          <h2 className="text-lg font-semibold">Pesquisadas recentemente</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(rotas as Rota[]).map((r) => (
              <Link key={r.id} href={`/rota/${r.id}`} className="cartao grid gap-1 transition hover:border-sky-300">
                <span className="text-sm font-medium text-slate-800">{trajeto(r.origem, r.destino)}</span>
                <span className="text-xs text-slate-500">
                  {r.data_volta ? `${data(r.data_ida)} a ${data(r.data_volta)}` : `${data(r.data_ida)} · só ida`}
                </span>
                <span className="mt-1 text-2xl font-bold text-sky-700">{reais(r.preco_atual)}</span>
                <span className="text-xs text-slate-400">atualizado {haQuantoTempo(r.ultima_busca_em)}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
