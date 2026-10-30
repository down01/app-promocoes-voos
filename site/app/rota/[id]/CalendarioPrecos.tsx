import { data as formatarData, reais } from "@/lib/formato";

const SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

// Faixa de dias com o menor preço só de ida de cada um (vem da atualização geral).
// Tocar num dia troca a viagem para essa data e já busca horários e companhias.
export default function CalendarioPrecos({
  titulo,
  dias,
  escolhida,
  linkDia,
}: {
  titulo: string;
  dias: { data: string; preco: number }[];
  escolhida: string;
  linkDia: (data: string) => string | null;
}) {
  if (!dias.length) return null;
  const menor = Math.min(...dias.map((d) => d.preco));
  return (
    <section className="cartao grid gap-3">
      <div className="grid gap-0.5">
        <h2 className="font-semibold">{titulo}</h2>
        <span className="text-xs text-slate-500">
          dia mais barato: <b className="text-emerald-700">{reais(menor)}</b> · só ida, por pessoa · toque num dia
          para trocar a data
        </span>
      </div>
      <div className="-mx-1 flex snap-x gap-1.5 overflow-x-auto px-1 pb-1">
        {dias.map((d) => {
          const dia = new Date(d.data + "T12:00:00");
          const ehEscolhida = d.data === escolhida;
          const ehMenor = d.preco === menor;
          const href = ehEscolhida ? null : linkDia(d.data);
          const classe = `grid min-w-[62px] shrink-0 snap-start justify-items-center rounded-xl border px-2 py-1.5 text-center transition ${
            ehEscolhida
              ? "border-sky-600 bg-sky-600 text-white"
              : ehMenor
                ? "border-emerald-300 bg-emerald-50 text-emerald-800 hover:border-emerald-500"
                : "border-slate-200 bg-white hover:border-sky-400"
          } ${href ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-md" : ""} ${
            !href && !ehEscolhida ? "opacity-40" : ""
          }`;
          const conteudo = (
            <>
              <span className={`text-[11px] ${ehEscolhida ? "text-sky-100" : "text-slate-400"}`}>
                {SEMANA[dia.getDay()]}
              </span>
              <span className="text-sm font-semibold">
                {dia.getDate()}/{dia.getMonth() + 1}
              </span>
              <span className="text-xs font-medium">{d.preco.toLocaleString("pt-BR")}</span>
            </>
          );
          // <a> comum (não <Link>): o link registra a viagem e pede a busca, não deve ser pré-carregado
          return href ? (
            <a key={d.data} href={href} className={classe}
              title={`Trocar para ${formatarData(d.data)} · a partir de ${reais(d.preco)}`}>
              {conteudo}
            </a>
          ) : (
            <div key={d.data} className={classe} title={formatarData(d.data)}
              aria-current={ehEscolhida ? "date" : undefined}>
              {conteudo}
            </div>
          );
        })}
      </div>
    </section>
  );
}
