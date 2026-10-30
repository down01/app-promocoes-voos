import { NextResponse } from "next/server";
import { acordarRobo } from "@/lib/robo";
import { clienteServidor } from "@/lib/supabase/server";

// Botão "Ver horários e companhias": pede a busca detalhada só quando a pessoa quer
export async function POST(request: Request) {
  const corpo = await request.json().catch(() => null);
  const rotaId = Number(corpo?.rota_id);
  if (!Number.isInteger(rotaId) || rotaId <= 0) {
    return NextResponse.json({ erro: "Viagem inválida." }, { status: 400 });
  }
  const supabase = await clienteServidor();
  const { data, error } = await supabase.rpc("pedir_voos", { p_rota: rotaId });
  if (error) return NextResponse.json({ erro: error.message }, { status: 400 });
  const novos = Number(data);
  return NextResponse.json({ buscando: novos > 0, robo_acordado: novos > 0 ? await acordarRobo() : false });
}
