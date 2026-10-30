import { reais } from "@/lib/formato";

// Gráfico simples do menor preço ao longo das buscas
export default function Historico({ pontos }: { pontos: { buscado_em: string; menor_preco: number }[] }) {
  const precos = pontos.map((p) => p.menor_preco);
  const min = Math.min(...precos);
  const max = Math.max(...precos);
  const largura = 600;
  const altura = 120;
  const x = (i: number) => (i / (pontos.length - 1)) * largura;
  const y = (v: number) => (max === min ? altura / 2 : altura - ((v - min) / (max - min)) * (altura - 16) - 8);
  const linha = pontos.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.menor_preco).toFixed(1)}`).join(" ");

  return (
    <section className="cartao grid gap-2">
      <div className="flex items-baseline justify-between">
        <h2 className="font-semibold">Histórico do preço</h2>
        <span className="text-xs text-slate-500">
          menor {reais(min)} · maior {reais(max)} · {pontos.length} buscas
        </span>
      </div>
      <svg viewBox={`0 0 ${largura} ${altura}`} className="h-32 w-full" preserveAspectRatio="none" role="img"
        aria-label={`Preço variou entre ${reais(min)} e ${reais(max)}`}>
        <path d={linha} fill="none" stroke="#0284c7" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
      </svg>
    </section>
  );
}
