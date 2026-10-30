import { NextResponse } from "next/server";
import { iniciarAtualizacaoGeral } from "@/lib/robo";
import { clienteServidor } from "@/lib/supabase/server";

// Chamado pelo despertador do banco (pg_cron) às 0h, 6h, 12h e 18h de Brasília.
// O agendamento do próprio GitHub atrasava ou pulava rodadas, por isso o disparo vem daqui.
// O banco manda um código de uso único; só ele sabe gerar, então não precisa de senha guardada no site.
export async function POST(request: Request) {
  const corpo = await request.json().catch(() => null);
  const codigo = String(corpo?.codigo ?? "");
  if (!/^[0-9a-f-]{36}$/.test(codigo)) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }
  const supabase = await clienteServidor();
  const { data: valido } = await supabase.rpc("consumir_disparo", { p_codigo: codigo });
  if (!valido) return NextResponse.json({ erro: "não autorizado" }, { status: 401 });

  const resultado = await iniciarAtualizacaoGeral();
  console.log("cron atualização geral:", JSON.stringify(resultado));
  return NextResponse.json(resultado, { status: resultado.iniciada ? 200 : 409 });
}
