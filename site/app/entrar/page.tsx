import FormEntrar from "./FormEntrar";

// Lê ?next=, ?erro= e ?modo= da URL a cada visita
export const instant = false;

export default async function Entrar({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; erro?: string; modo?: string }>;
}) {
  const { next, erro, modo } = await searchParams;
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
