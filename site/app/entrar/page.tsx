import { redirect } from "next/navigation";
import { clienteServidor } from "@/lib/supabase/server";
import FormEntrar from "./FormEntrar";

// Lê ?next=, ?erro= e ?modo= da URL a cada visita
export const instant = false;

export default async function Entrar({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; erro?: string; modo?: string }>;
}) {
  const { next, erro, modo } = await searchParams;
  // Já logado (ex.: tocou em "Conta" na barra de baixo): vai direto para os alertas
  const supabase = await clienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect(next?.startsWith("/") ? next : "/alertas");

  return (
    <div className="mx-auto grid w-full max-w-md gap-4">
      {erro && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          O link expirou ou já foi usado. Entre com sua senha ou peça outro link.
        </p>
      )}
      <FormEntrar proximo={next?.startsWith("/") ? next : "/alertas"} modoInicial={modo === "criar" ? "criar" : "entrar"} />
    </div>
  );
}
