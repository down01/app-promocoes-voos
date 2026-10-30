import { data as formatarData, reais } from "@/lib/formato";

const SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

// Faixa de dias com o menor preço só de ida de cada um (vem da atualização geral)
export default function CalendarioPrecos({
  titulo,
  dias,
  escolhida,
}: {
  titulo: string;
  dias: { data: string; preco: number }[];
  escolhida: string;
}) {
  if (!dias.length) return null;
  const menor = Math.min(...dias.map((d) => d.preco));
  return (
    <section className="cartao grid gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-semibold">{titulo}</h2>
        <span className="text-xs text-slate-500">
          dia mais barato: <b className="text-emerald-700">{reais(menor)}</b> · só ida, por pessoa
        </span>
      </div>
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {dias.map((d) => {
          const dia = new Date(d.data + "T12:00:00");
          const ehEscolhida = d.data === escolhida;
          const ehMenor = d.preco === menor;
          return (
            <div
              key={d.data}
              title={formatarData(d.data)}
              className={`grid min-w-[62px] shrink-0 justify-items-center rounded-xl border px-2 py-1.5 text-center ${
                ehEscolhida
                  ? "border-sky-600 bg-sky-600 text-white"
                  : ehMenor
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                    : "border-slate-200 bg-white"
              }`}
            >
              <span className={`text-[11px] ${ehEscolhida ? "text-sky-100" : "text-slate-400"}`}>
                {SEMANA[dia.getDay()]}
              </span>
              <span className="text-sm font-semibold">{dia.getDate()}/{dia.getMonth() + 1}</span>
              <span className="text-xs font-medium">{d.preco.toLocaleString("pt-BR")}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
