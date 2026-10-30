import { NextResponse } from "next/server";
import { clienteServidor } from "@/lib/supabase/server";

const DATA = /^\d{4}-\d{2}-\d{2}$/;

// Chama o robô no GitHub para buscar agora (modo "pedidos")
async function acordarRobo() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO ?? "down01/app-promocoes-voos";
  if (!token) {
    console.error("acordarRobo: GITHUB_TOKEN não configurado");
    return false;
  }
  const r = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/robo-6h.yml/dispatches`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({ ref: "main", inputs: { modo: "pedidos" } }),
  });
  if (!r.ok) console.error(`acordarRobo: GitHub respondeu ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r.ok;
}

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
