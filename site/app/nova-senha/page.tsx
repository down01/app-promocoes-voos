import { redirect } from "next/navigation";
import { clienteServidor } from "@/lib/supabase/server";
import FormNovaSenha from "./FormNovaSenha";

// Chega aqui pelo link de "Esqueci minha senha" (o /auth/callback já fez o login)
export default async function NovaSenha() {
  const supabase = await clienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?erro=1");

  return (
    <div className="mx-auto grid w-full max-w-md gap-4">
      <div>
        <h1 className="text-2xl font-bold">Criar senha nova</h1>
        <p className="text-sm text-slate-600">Conta: {user.email}</p>
      </div>
      <FormNovaSenha />
    </div>
  );
}
