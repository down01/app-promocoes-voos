import { NextResponse } from "next/server";
import { ehGrupo, membrosDe } from "@/lib/aeroportos";
import { acordarRobo } from "@/lib/robo";
import { clienteServidor } from "@/lib/supabase/server";

const DATA = /^\d{4}-\d{2}-\d{2}$/;
const VALIDO = (c: string) => /^[A-Z]{3}$/.test(c) || ehGrupo(c);
const MAX_PARES = 10; // cada par vira até 3 buscas do robô (ida e volta + os dois trechos)

// País ou estado inteiro: registra uma viagem para cada par de aeroportos. O preço vem do
// calendário da atualização geral quando já existe; o que faltar vai para a fila do robô.
export async function POST(request: Request) {
  const corpo = await request.json().catch(() => null);
  const origem = String(corpo?.origem ?? "");
  const destino = String(corpo?.destino ?? "");
  const ida = String(corpo?.ida ?? "");
  const volta = corpo?.volta ? String(corpo.volta) : null;
  if (!VALIDO(origem) || !VALIDO(destino) || !DATA.test(ida) || (volta && !DATA.test(volta))) {
    return NextResponse.json({ erro: "Dados da busca inválidos." }, { status: 400 });
  }

  const pares = membrosDe(origem)
    .flatMap((o) => membrosDe(destino).map((d) => [o, d] as const))
    .filter(([o, d]) => o !== d)
    .slice(0, MAX_PARES);
  if (!pares.length) return NextResponse.json({ erro: "Escolha origem e destino diferentes." }, { status: 400 });

  const supabase = await clienteServidor();
  let novos = 0;
  let ok = 0;
  let ultimoErro = "";
  for (const [o, d] of pares) {
    const { data, error } = await supabase.rpc("pedir_busca", { p_origem: o, p_destino: d, p_ida: ida, p_volta: volta });
    if (error) {
      ultimoErro = error.message;
      continue;
    }
    ok++;
    novos += (data as { pedidos_novos: number }).pedidos_novos;
  }
  if (!ok) return NextResponse.json({ erro: ultimoErro || "Não deu para buscar agora." }, { status: 400 });
  return NextResponse.json({ pares: ok, buscando: novos > 0, robo_acordado: novos > 0 ? await acordarRobo() : false });
}
