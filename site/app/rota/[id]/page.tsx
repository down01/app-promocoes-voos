import { notFound } from "next/navigation";
import { connection } from "next/server";
import { clienteServidor } from "@/lib/supabase/server";
import { data, haQuantoTempo, reais, trajeto } from "@/lib/formato";
import type { Rota } from "@/lib/tipos";
import Bilhete from "../../Bilhete";
import AtualizarSozinho from "./AtualizarSozinho";
import ListaVoos from "./ListaVoos";
import CalendarioPrecos from "./CalendarioPrecos";
import CriarAlerta from "./CriarAlerta";
import Historico from "./Historico";

type Dia = { data: string; preco: number };

function somarDias(iso: string, dias: number) {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

// Página sempre com preço fresco (atualiza enquanto o robô busca), então pode esperar os dados
export const instant = false;

export default async function PaginaRota({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connection(); // preços e "atualizado há X" mudam a cada visita
  const supabase = await clienteServidor();

  const { data: rota } = await supabase.from("rotas").select("*").eq("id", id).maybeSingle<Rota>();
  if (!rota) notFound();

  // Ida e volta: busca também os dois trechos separados
  let ida: Rota | null = null;
  let volta: Rota | null = null;
  if (rota.data_volta) {
    const { data: trechos } = await supabase
      .from("rotas")
      .select("*")
      .is("data_volta", null)
      .or(
        `and(origem.eq.${rota.origem},destino.eq.${rota.destino},data_ida.eq.${rota.data_ida}),` +
          `and(origem.eq.${rota.destino},destino.eq.${rota.origem},data_ida.eq.${rota.data_volta})`,
      );
    ida = (trechos as Rota[] | null)?.find((t) => t.origem === rota.origem) ?? null;
    volta = (trechos as Rota[] | null)?.find((t) => t.origem === rota.destino) ?? null;
  }

  const ids = [rota.id, ida?.id, volta?.id].filter(Boolean);
  const { count: pendentes } = await supabase
    .from("pedidos_busca")
    .select("id", { count: "exact", head: true })
    .in("rota_id", ids)
    .in("status", ["pendente", "buscando"]);

  const { data: historico } = await supabase
    .from("precos")
    .select("buscado_em, menor_preco")
    .eq("rota_id", rota.id)
    .order("buscado_em", { ascending: true })
    .limit(120);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: alertaExistente } = user
    ? await supabase.from("alertas").select("id").eq("rota_id", rota.id).maybeSingle()
    : { data: null };

  // Calendário da atualização geral: 2 semanas antes e depois de cada data
  const hoje = new Date().toISOString().slice(0, 10);
  async function diasPerto(origem: string, destino: string, dataBase: string) {
    const inicio = somarDias(dataBase, -14);
    const { data: dias } = await supabase
      .from("calendario")
      .select("data, preco")
      .eq("origem", origem)
      .eq("destino", destino)
      .gte("data", inicio < hoje ? hoje : inicio)
      .lte("data", somarDias(dataBase, 14))
      .order("data");
    return (dias ?? []) as Dia[];
  }
  const [calIda, calVolta] = await Promise.all([
    diasPerto(rota.origem, rota.destino, rota.data_ida),
    rota.data_volta ? diasPerto(rota.destino, rota.origem, rota.data_volta) : Promise.resolve([] as Dia[]),
  ]);
  const naIda = calIda.find((d) => d.data === rota.data_ida)?.preco ?? null;
  const naVolta = rota.data_volta ? (calVolta.find((d) => d.data === rota.data_volta)?.preco ?? null) : null;
  const estimativa = rota.data_volta ? (naIda && naVolta ? naIda + naVolta : null) : naIda;

  const separado = ida?.preco_atual && volta?.preco_atual ? ida.preco_atual + volta.preco_atual : null;
  const buscando = (pendentes ?? 0) > 0;

  return (
    <div className="grid gap-6">
      <AtualizarSozinho ativo={buscando} />

      <h1 className="sr-only">{trajeto(rota.origem, rota.destino)}</h1>
      <Bilhete
        grande
        origem={rota.origem}
        destino={rota.destino}
        etiqueta={
          <>
            <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
              {rota.data_volta ? "⇄ Ida e volta" : "→ Só ida"}
            </span>
            <span className="text-xs text-slate-400">atualizado {haQuantoTempo(rota.ultima_busca_em)}</span>
          </>
        }
        rodape={
          <div className="flex items-end justify-between gap-3">
            <div className="grid gap-0.5 text-sm">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {rota.data_volta ? "Ida · volta" : "Data"}
              </span>
              <span className="font-semibold">
                {data(rota.data_ida)}
                {rota.data_volta && ` · ${data(rota.data_volta)}`}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">a partir de</span>
              <p className="text-3xl font-black text-sky-700">{reais(rota.preco_atual ?? estimativa)}</p>
            </div>
          </div>
        }
      />

      {buscando && (
        <div className="flex items-center gap-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sky-800">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-sky-600 border-t-transparent" />
          <span>
            Buscando os preços agora em todas as companhias. Leva de 1 a 3 minutos; a página se atualiza sozinha.
          </span>
        </div>
      )}

      {rota.data_volta && (
        <section className="grid grid-cols-2 gap-3">
          <div className="cartao">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Só a ida · {data(rota.data_ida)}</p>
            <p className="text-2xl font-black">{reais(ida?.preco_atual ?? naIda)}</p>
            {ida?.voos_atuais?.[0] && <p className="text-xs text-slate-500">{ida.voos_atuais[0].companhia}</p>}
          </div>
          <div className="cartao">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Só a volta · {data(rota.data_volta)}</p>
            <p className="text-2xl font-black">{reais(volta?.preco_atual ?? naVolta)}</p>
            {volta?.voos_atuais?.[0] && <p className="text-xs text-slate-500">{volta.voos_atuais[0].companhia}</p>}
          </div>
        </section>
      )}

      {separado && rota.preco_atual && (
        <p
          className={`rounded-2xl p-4 text-sm ${
            separado < rota.preco_atual ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-700"
          }`}
        >
          {separado < rota.preco_atual
            ? `Comprando a ida e a volta separadas sai ${reais(separado)}, ${reais(rota.preco_atual - separado)} mais barato que ida e volta juntas.`
            : `Separadas, a ida e a volta somam ${reais(separado)}. Hoje compensa comprar ida e volta juntas.`}
        </p>
      )}

      <section className="grid gap-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-lg font-bold">Voos disponíveis</h2>
          <span className="text-xs text-slate-500">toque no voo para reservar</span>
        </div>
        <ListaVoos
          voos={rota.voos_atuais ?? []}
          origem={rota.origem}
          destino={rota.destino}
          ida={rota.data_ida}
          volta={rota.data_volta}
          buscando={buscando}
        />
      </section>

      <CriarAlerta rotaId={rota.id} idaEVolta={!!rota.data_volta} logado={!!user} jaTem={!!alertaExistente} />

      <CalendarioPrecos titulo={`Preço da ida perto de ${data(rota.data_ida)}`} dias={calIda} escolhida={rota.data_ida} />
      {rota.data_volta && (
        <CalendarioPrecos titulo={`Preço da volta perto de ${data(rota.data_volta)}`} dias={calVolta}
          escolhida={rota.data_volta} />
      )}

      {historico && historico.length > 1 && <Historico pontos={historico} />}
    </div>
  );
}
