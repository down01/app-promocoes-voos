"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { codigoDoTexto, ehGrupo } from "@/lib/aeroportos";
import CampoAeroporto from "./CampoAeroporto";

const VALIDO = (c: string) => /^[A-Z]{3}$/.test(c) || ehGrupo(c);

// Texto digitado sem escolher na lista: tenta a lista principal e depois o mundo todo
async function resolver(texto: string) {
  const local = codigoDoTexto(texto);
  if (local || texto.trim().length < 3) return local;
  try {
    const r = await fetch(`/api/aeroportos?q=${encodeURIComponent(texto.trim())}`);
    const lista = r.ok ? ((await r.json()) as { codigo: string }[]) : [];
    return lista[0]?.codigo ?? "";
  } catch {
    return "";
  }
}

// Última busca guardada no aparelho, para não precisar digitar tudo de novo ao recarregar a página
const CHAVE = "ultima-busca";
type Guardada = { origem: string; destino: string; ida: string; volta: string; soIda: boolean };

function lerGuardada(): Guardada | null {
  try {
    const g = JSON.parse(localStorage.getItem(CHAVE) ?? "null") as Guardada | null;
    if (!g) return null;
    const hoje = new Date().toISOString().slice(0, 10);
    // Datas que já passaram não voltam
    return { ...g, ida: g.ida >= hoje ? g.ida : "", volta: g.volta >= hoje ? g.volta : "" };
  } catch {
    return null; // navegador sem localStorage (modo anônimo de alguns celulares)
  }
}

function guardar(g: Guardada) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(g));
  } catch {}
}

export default function FormBusca({ origemPadrao = "" }: { origemPadrao?: string }) {
  const router = useRouter();
  const [origem, setOrigem] = useState(origemPadrao);
  const [destino, setDestino] = useState("");
  const [ida, setIda] = useState("");
  const [volta, setVolta] = useState("");
  const [soIda, setSoIda] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  // Volta a última busca (depois do primeiro desenho, para o servidor e o navegador mostrarem o mesmo)
  useEffect(() => {
    const g = lerGuardada();
    if (!g) return;
    /* eslint-disable react-hooks/set-state-in-effect -- leitura única do localStorage */
    if (!origemPadrao) setOrigem(g.origem);
    setDestino(g.destino);
    setIda(g.ida);
    setVolta(g.volta);
    setSoIda(g.soIda);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [origemPadrao]);

  // Ao voltar para a página inicial, o navegador/Next devolve o formulário como ficou ao sair,
  // com o botão em "Buscando…". Destrava sempre que ele aparece de novo.
  useEffect(() => {
    setEnviando(false); // eslint-disable-line react-hooks/set-state-in-effect
    const aoVoltar = () => setEnviando(false);
    window.addEventListener("pageshow", aoVoltar);
    return () => window.removeEventListener("pageshow", aoVoltar);
  }, []);

  async function buscar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    const o = await resolver(origem);
    const d = await resolver(destino);
    if (!VALIDO(o) || !VALIDO(d)) {
      setErro("Não achei esse lugar. Comece a digitar a cidade e escolha na lista (ex.: Vitória).");
      return;
    }
    const voltaFinal = soIda ? null : volta || null;
    guardar({ origem, destino, ida, volta, soIda });
    // País ou estado inteiro: o site busca cada aeroporto e mostra a comparação
    const comparar = ehGrupo(o) || ehGrupo(d);
    setEnviando(true);
    const r = await fetch(comparar ? "/api/comparar" : "/api/buscar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origem: o, destino: d, ida, volta: voltaFinal }),
    });
    const resposta = await r.json();
    if (!r.ok) {
      setErro(resposta.erro ?? "Não deu para buscar agora.");
      setEnviando(false);
      return;
    }
    if (comparar) {
      router.push(`/comparar?o=${o}&d=${d}&ida=${ida}` + (voltaFinal ? `&volta=${voltaFinal}` : ""));
      return;
    }
    router.push(`/rota/${resposta.rota_id}`);
  }

  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <form onSubmit={buscar} className="grid gap-4 rounded-3xl bg-white p-5 text-slate-900 shadow-xl shadow-sky-900/20">
      <div className="flex gap-2 text-sm font-semibold" role="radiogroup" aria-label="Tipo de viagem">
        {[
          { valor: false, rotulo: "⇄ Ida e volta" },
          { valor: true, rotulo: "→ Só ida" },
        ].map((t) => (
          <button
            key={t.rotulo}
            type="button"
            role="radio"
            aria-checked={soIda === t.valor}
            onClick={() => setSoIda(t.valor)}
            className={`rounded-full px-4 py-1.5 transition ${
              soIda === t.valor ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {t.rotulo}
          </button>
        ))}
      </div>

      <div className="relative grid gap-3 sm:grid-cols-2">
        <CampoAeroporto rotulo="🛫 De onde" placeholder="Cidade, aeroporto ou país" valor={origem} aoMudar={setOrigem} />
        <button
          type="button"
          aria-label="Trocar origem e destino"
          onClick={() => {
            setOrigem(destino);
            setDestino(origem);
          }}
          className="absolute right-4 top-1/2 z-10 grid h-9 w-9 translate-y-[2px] place-items-center rounded-full bg-sky-600 text-white shadow-md transition hover:rotate-180 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:translate-y-[10px]"
        >
          ⇅
        </button>
        <CampoAeroporto rotulo="🛬 Para onde" placeholder="Cidade, aeroporto ou país" valor={destino} aoMudar={setDestino} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium text-slate-600">
          Ida
          <input className="campo" type="date" min={hoje} value={ida} onChange={(e) => setIda(e.target.value)} required />
        </label>
        {!soIda && (
          <label className="grid gap-1 text-sm font-medium text-slate-600">
            Volta
            <input className="campo" type="date" min={ida || hoje} value={volta}
              onChange={(e) => setVolta(e.target.value)} required />
          </label>
        )}
      </div>

      {erro && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}

      <button className="botao w-full py-3.5 text-base" disabled={enviando}>
        {enviando ? "Buscando…" : "🔎 Buscar voos"}
      </button>
    </form>
  );
}
