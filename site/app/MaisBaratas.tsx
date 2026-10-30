import { data, reais, trajeto } from "@/lib/formato";

export type Promocao = { origem: string; destino: string; data: string; preco: number };

// Cartões com o dia mais barato de cada rota (vem da atualização geral)
export default function MaisBaratas({ titulo, promocoes }: { titulo: string; promocoes: Promocao[] }) {
  if (!promocoes.length) return null;
  return (
    <section className="grid gap-3">
      <h2 className="text-lg font-semibold">{titulo}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {promocoes.map((p) => (
          // <a> comum: o link cria a viagem no banco, então não deve ser pré-carregado
          <a
            key={`${p.origem}-${p.destino}`}
            href={`/ir?o=${p.origem}&d=${p.destino}&ida=${p.data}`}
            className="cartao grid gap-1 transition hover:border-sky-300"
          >
            <span className="text-sm font-medium text-slate-800">{trajeto(p.origem, p.destino)}</span>
            <span className="text-xs text-slate-500">{data(p.data)} · só ida</span>
            <span className="mt-1 text-2xl font-bold text-emerald-700">{reais(p.preco)}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
