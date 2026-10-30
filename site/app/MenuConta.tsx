import Link from "next/link";
import { clienteServidor } from "@/lib/supabase/server";
import BoasVindas from "./BoasVindas";

// Fica separado do layout porque lê o cookie de login (dado de cada visitante)
export default async function MenuConta() {
  const supabase = await clienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user ? (
    <form action="/auth/sair" method="post">
      <button className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100">Sair</button>
    </form>
  ) : (
    <>
      <Link href="/entrar" className="botao py-2 text-sm">
        Entrar
      </Link>
      <BoasVindas />
    </>
  );
}
