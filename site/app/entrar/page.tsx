import FormEntrar from "./FormEntrar";

// Lê ?next= e ?erro= da URL a cada visita
export const instant = false;

export default async function Entrar({ searchParams }: { searchParams: Promise<{ next?: string; erro?: string }> }) {
  const { next, erro } = await searchParams;
  return (
    <div className="mx-auto grid max-w-md gap-4">
      <h1 className="text-2xl font-bold">Entrar</h1>
      <p className="text-slate-600">
        Digite seu e-mail e mandamos um link para entrar. Não precisa de senha.
      </p>
      {erro && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">O link expirou ou já foi usado. Peça outro.</p>}
      <FormEntrar proximo={next?.startsWith("/") ? next : "/alertas"} />
    </div>
  );
}
