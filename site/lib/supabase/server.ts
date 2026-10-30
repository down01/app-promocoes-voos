import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";

// Cliente do Supabase para Server Components e Route Handlers (usa a sessão do visitante)
export async function clienteServidor() {
  // A sessão do Supabase usa Date.now(): marca a renderização como "por visita" para o Next não pré-renderizar
  await connection();
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(lista) {
          try {
            lista.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Server Component não pode gravar cookie; o proxy.ts renova a sessão
          }
        },
      },
    },
  );
}
