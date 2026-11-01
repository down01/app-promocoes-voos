import Link from "next/link";
import { redirect } from "next/navigation";
import { ehGrupo, membrosDe, nomeAeroporto, nomeCidade, rotuloGrupo } from "@/lib/aeroportos";
import { data, haQuantoTempo, reais } from "@/lib/formato";
import { clienteServidor } from "@/lib/supabase/server";
import type { Rota } from "@/lib/tipos";
import AtualizarSozinho from "../rota/[id]/AtualizarSozinho";

const DATA = /^\d{4}-\d{2}-\d{2}$/;
const VALIDO = (c: string) => /^[A-Z]{3}$/.test(c) || ehGrupo(c);
const nome = (c: string) => (ehGrupo(c) ? rotuloGrupo(c) : nomeAeroporto(c));

// Lê a busca da URL e os preços a cada visita
export const instant = false;

type Dia = { origem: string; destino: string; preco: number };

// País ou estado inteiro: uma linha por par de aeroportos, do mais barato ao mais caro
export default async function PaginaComparar({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { o = "", d = "", ida = "", volta } = await searchParams;
  if (!VALIDO(o) || !VALIDO(d) || !DATA.test(ida) || (volta && !DATA.test(volta))) redirect("/");

  const origens = membrosDe(o);
  const destinos = membrosDe(d);
  const todos = [...new Set([...origens, ...destinos])];
  const supabase = await clienteServidor();

  // Viagens desta busca e os trechos separados (para saber se o robô ainda está buscando)
  const { data: rotas } = await supabase
    .from("rotas")
    .select("*")
    .in("origem", todos)
    .in("destino", todos)
    .in("data_ida", volta ? [ida, volta] : [ida]);
  const lista = ((rotas ?? []) as Rota[]).filter(
    (r) => origens.includes(r.origem) && destinos.includes(r.destino) && r.data_ida === ida &&
      (r.data_volta ?? null) === (volta ?? null),
  );

  const { count: pendentes } = await supabase
    .from("pedidos_busca")
    .select("id", { count: "exact", head: true })
    .in("rota_id", ((rotas ?? []) as Rota[]).map((r) => r.id))
    .in("status", ["pendente", "buscando"]);

  // Preço do dia no calendário da atualização geral (vale enquanto a busca detalhada não roda)
  const [{ data: diasIda }, { data: diasVolta }] = await Promise.all([
    supabase.from("calendario").select("origem,destino,preco").in("origem", origens).in("destino", destinos).eq("data", ida),
    volta
      ? supabase.from("calendario").select("origem,destino,preco").in("origem", destinos).in("destino", origens).eq("data", volta)
      : Promise.resolve({ data: [] as Dia[] }),
  ]);
  const precoDia = (dias: Dia[] | null, de: string, para: string) =>
    dias?.find((x) => x.origem === de && x.destino === para)?.preco ?? null;

  const linhas = lista
    .map((r) => {
      const pIda = precoDia(diasIda as Dia[] | null, r.origem, r.destino);
      const pVolta = volta ? precoDia(diasVolta as Dia[] | null, r.destino, r.origem) : 0;
      const estimativa = pIda != null && pVolta != null ? pIda + pVolta : null;
      return { r, preco: r.preco_atual ?? estimativa };
    })
    .sort((a, b) => (a.preco ?? Infinity) - (b.preco ?? Infinity));
  const buscando = (pendentes ?? 0) > 0;
  const menor = linhas[0]?.preco ?? null;

  return (
    <div className="mx-auto grid w-full max-w-2xl gap-5">
      <AtualizarSozinho ativo={buscando} />

      <div className="grid gap-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {volta ? "⇄ Ida e volta" : "→ Só ida"} · {data(ida)}
          {volta && ` a ${data(volta)}`}
        </span>
        <h1 className="text-2xl font-black leading-tight">
          {nome(o)} <span className="text-sky-500">→</span> {nome(d)}
        </h1>
        <p className="text-sm text-slate-500">
          Comparamos {linhas.length} {linhas.length === 1 ? "combinação" : "combinações"} de aeroportos. Toque em uma
          para ver horários, companhias e criar alerta.
        </p>
      </div>

      {buscando && (
        <div className="flex items-center gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sky-800">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-sky-600 border-t-transparent" />
          <span>Buscando os preços que faltam. A página se atualiza sozinha.</span>
        </div>
      )}

      <ul className="grid gap-2">
        {linhas.map(({ r, preco }) => (
          <li key={r.id}>
            <Link
              href={`/rota/${r.id}`}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md"
            >
              <div className="grid flex-1 gap-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg font-black tracking-tight">
                    {r.origem} <span className="text-sky-500">{volta ? "⇄" : "→"}</span> {r.destino}
                  </span>
                  {preco != null && preco === menor && (
                    <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                      mais barato
                    </span>
                  )}
                </div>
                <span className="text-sm text-slate-600">
                  {nomeCidade(r.origem)} → {nomeCidade(r.destino)}
                </span>
                <span className="text-[11px] text-slate-400">
                  {r.ultima_busca_em ? `conferido ${haQuantoTempo(r.ultima_busca_em)}` : preco != null ? "preço do calendário" : ""}
                </span>
              </div>
              <div className="text-right">
                <p className="text-xl font-extrabold text-sky-700">
                  {preco != null ? reais(preco) : buscando ? "buscando…" : "sem voo"}
                </p>
                <p className="text-xs font-semibold text-sky-600">ver voos ›</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <Link href="/" className="justify-self-center text-sm text-slate-500 underline">
        Fazer outra busca
      </Link>
    </div>
  );
}
