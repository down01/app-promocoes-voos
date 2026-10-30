import { NextResponse } from "next/server";
import { acordarRobo } from "@/lib/robo";
import { clienteServidor } from "@/lib/supabase/server";

const DATA = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(request: Request) {
  const corpo = await request.json().catch(() => null);
  const origem = String(corpo?.origem ?? "").toUpperCase();
  const destino = String(corpo?.destino ?? "").toUpperCase();
  const ida = String(corpo?.ida ?? "");
  const volta = corpo?.volta ? String(corpo.volta) : null;

  if (!/^[A-Z]{3}$/.test(origem) || !/^[A-Z]{3}$/.test(destino) || !DATA.test(ida) || (volta && !DATA.test(volta))) {
    return NextResponse.json({ erro: "Dados da busca inválidos." }, { status: 400 });
  }

  const supabase = await clienteServidor();
  const { data, error } = await supabase.rpc("pedir_busca", {
    p_origem: origem,
    p_destino: destino,
    p_ida: ida,
    p_volta: volta,
  });
  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 400 });
  }

  const resultado = data as { rota_id: number; pedidos_novos: number };
  const roboAcordado = resultado.pedidos_novos > 0 ? await acordarRobo() : false;
  return NextResponse.json({
    rota_id: resultado.rota_id,
    buscando: resultado.pedidos_novos > 0,
    robo_acordado: roboAcordado,
  });
}
