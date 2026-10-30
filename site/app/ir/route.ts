import { NextResponse } from "next/server";
import { acordarRobo } from "@/lib/robo";
import { clienteServidor } from "@/lib/supabase/server";

// Link das promoções da página inicial: abre a página da viagem (cria a rota se for nova)
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origem = (url.searchParams.get("o") ?? "").toUpperCase();
  const destino = (url.searchParams.get("d") ?? "").toUpperCase();
  const ida = url.searchParams.get("ida") ?? "";
  if (!/^[A-Z]{3}$/.test(origem) || !/^[A-Z]{3}$/.test(destino) || !/^\d{4}-\d{2}-\d{2}$/.test(ida)) {
    return NextResponse.redirect(new URL("/", url.origin));
  }

  const supabase = await clienteServidor();
  const { data, error } = await supabase.rpc("pedir_busca", {
    p_origem: origem,
    p_destino: destino,
    p_ida: ida,
    p_volta: null,
  });
  if (error) return NextResponse.redirect(new URL("/", url.origin));

  const { rota_id, pedidos_novos } = data as { rota_id: number; pedidos_novos: number };
  if (pedidos_novos > 0) await acordarRobo(); // traz a lista de voos do dia
  return NextResponse.redirect(new URL(`/rota/${rota_id}`, url.origin));
}
