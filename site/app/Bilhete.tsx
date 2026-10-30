import { AEROPORTOS } from "@/lib/aeroportos";

// Cidade sem o complemento entre parênteses: "São Paulo (Guarulhos)" → "São Paulo"
function cidade(codigo: string) {
  return (AEROPORTOS[codigo] ?? codigo).replace(/\s*\(.*\)/, "");
}

// Visual de cartão de embarque: códigos grandes, avião na linha tracejada e recortes nas laterais
export default function Bilhete({
  origem,
  destino,
  rodape,
  etiqueta,
  grande = false,
}: {
  origem: string;
  destino: string;
  rodape: React.ReactNode;
  etiqueta?: React.ReactNode;
  grande?: boolean;
}) {
  return (
    <div className="bilhete relative overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
      {etiqueta && <div className="flex items-center justify-between px-5 pt-4">{etiqueta}</div>}
      <div className="flex items-center gap-3 px-5 py-4">
        <div className="min-w-0">
          <p className={`${grande ? "text-5xl" : "text-4xl"} font-black leading-none tracking-tight`}>{origem}</p>
          <p className="mt-1 truncate text-sm text-slate-500">{cidade(origem)}</p>
        </div>
        <div className="relative mx-1 flex-1">
          <div className="h-0.5 w-full bg-gradient-to-r from-sky-200 via-sky-500 to-sky-200" />
          <span className="aviao absolute left-1/2 top-1/2 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-sky-600 text-white shadow-lg shadow-sky-600/30">
            ✈
          </span>
        </div>
        <div className="min-w-0 text-right">
          <p className={`${grande ? "text-5xl" : "text-4xl"} font-black leading-none tracking-tight`}>{destino}</p>
          <p className="mt-1 truncate text-sm text-slate-500">{cidade(destino)}</p>
        </div>
      </div>
      {/* recortes e linha picotada, como um bilhete de verdade */}
      <div className="relative mx-5 border-t-2 border-dashed border-slate-200">
        <span className="absolute -left-8 -top-3 h-6 w-6 rounded-full bg-[var(--background)]" />
        <span className="absolute -right-8 -top-3 h-6 w-6 rounded-full bg-[var(--background)]" />
      </div>
      <div className="px-5 py-4">{rodape}</div>
    </div>
  );
}
