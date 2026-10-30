import Link from "next/link";
import { redirect } from "next/navigation";
import { clienteServidor } from "@/lib/supabase/server";
import type { Alerta } from "@/lib/tipos";
import AtivarPush from "./AtivarPush";
import CartaoAlerta from "./CartaoAlerta";

export default async function MeusAlertas() {
  const supabase = await clienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?next=/alertas");

  const [{ data: alertas }, { data: avisos }] = await Promise.all([
    supabase.from("alertas").select("*, rota:rotas(*)").order("criado_em", { ascending: false }),
    supabase.from("avisos").select("trecho, preco, enviado_em, alerta_id").order("enviado_em", { ascending: false }).limit(10),
  ]);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold">Meus alertas</h1>
        <p className="text-sm text-slate-500">
          Conferimos os preços a cada 6 horas: ida e volta juntas, só a ida e só a volta. Avisos vão para {user.email}.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2">
        <AtivarPush usuarioId={user.id} />
      </section>

      {alertas && alertas.length > 0 ? (
        <section className="grid gap-3">
          {(alertas as Alerta[]).map((a) => (
            <CartaoAlerta key={a.id} alerta={a} />
          ))}
        </section>
      ) : (
        <div className="cartao text-slate-600">
          Você ainda não tem alertas. <Link href="/" className="font-semibold text-sky-700 underline">Busque uma viagem</Link> e
          toque em “Avisar quando ficar mais barato”.
        </div>
      )}

      {avisos && avisos.length > 0 && (
        <section className="cartao grid gap-2">
          <h2 className="font-semibold">Últimos avisos enviados</h2>
          <ul className="text-sm text-slate-600">
            {avisos.map((v, i) => (
              <li key={i}>
                {new Date(v.enviado_em).toLocaleString("pt-BR")} · {v.trecho.replace("_", " e ")} · R$ {v.preco.toLocaleString("pt-BR")}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
