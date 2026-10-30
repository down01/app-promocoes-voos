import { NextResponse } from "next/server";
import { clienteServidor } from "@/lib/supabase/server";

// O link do e-mail de login cai aqui
export async function GET(request: Request) {
  const url = new URL(request.url);
  const codigo = url.searchParams.get("code");
  const proximo = url.searchParams.get("next") ?? "/alertas";
  const destino = proximo.startsWith("/") ? proximo : "/alertas";

  if (codigo) {
    const supabase = await clienteServidor();
    const { error } = await supabase.auth.exchangeCodeForSession(codigo);
    if (!error) return NextResponse.redirect(new URL(destino, url.origin));
  }
  return NextResponse.redirect(new URL(`/entrar?erro=1&next=${encodeURIComponent(destino)}`, url.origin));
}
