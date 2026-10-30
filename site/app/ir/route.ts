import { NextResponse } from "next/server";
import { acordarRobo } from "@/lib/robo";
import { clienteServidor } from "@/lib/supabase/server";

const DATA = /^\d{4}-\d{2}-\d{2}$/;

// Abre a página de uma viagem (cria a rota se for nova).
// Usado pelas promoções da página inicial e pelos dias do calendário de preços.
// Com ?voos=1 (a pessoa escolheu outra data no calendário), já busca horários e companhias desse dia.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origem = (url.searchParams.get("o") ?? "").toUpperCase();
  const destino = (url.searchParams.get("d") ?? "").toUpperCase();
  const ida = url.searchParams.get("ida") ?? "";
  const volta = url.searchParams.get("volta") || null;
  const buscarVoos = url.searchParams.get("voos") === "1";
  if (!/^[A-Z]{3}$/.test(origem) || !/^[A-Z]{3}$/.test(destino) || !DATA.test(ida) || (volta && !DATA.test(volta))) {
    return NextResponse.redirect(new URL("/", url.origin));
  }

  const supabase = await clienteServidor();
  const { data, error } = await supabase.rpc("pedir_busca", {
    p_origem: origem,
    p_destino: destino,
    p_ida: ida,
    p_volta: volta,
  });
  if (error) return NextResponse.redirect(new URL("/", url.origin));

  const { rota_id, pedidos_novos } = data as { rota_id: number; pedidos_novos: number };
  let novos = pedidos_novos;
  if (buscarVoos && novos === 0) {
    const { data: n } = await supabase.rpc("pedir_voos", { p_rota: rota_id });
    novos = Number(n ?? 0);
  }
  if (novos > 0) await acordarRobo();
  return NextResponse.redirect(new URL(`/rota/${rota_id}`, url.origin));
}
