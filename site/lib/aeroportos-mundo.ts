import lista from "./aeroportos-mundo.json";
import type { Sugestao } from "./aeroportos";

// Todos os aeroportos com código IATA (gerado por ferramentas/gerar_aeroportos_mundo.py).
// Usado só pela rota /api/aeroportos: são ~500 KB, grande demais para mandar ao celular.
type Linha = [codigo: string, cidade: string, nome: string, pais: string, estado: string];

const semAcento = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

const indice = (lista as Linha[]).map((l) => ({
  l,
  cidade: semAcento(l[1]),
  resto: semAcento(`${l[2]} ${l[3]} ${l[4]}`),
}));

export function buscarNoMundo(texto: string, limite = 6): Sugestao[] {
  const t = semAcento(texto);
  if (t.length < 3) return [];
  const achados: { s: Sugestao; nota: number }[] = [];
  for (const { l, cidade, resto } of indice) {
    const [codigo, nomeCidade, nomeAeroporto, pais, estado] = l;
    let nota = 0;
    const palavras = cidade.split(/[\s-]+/);
    if (codigo.toLowerCase() === t) nota = 100;
    else if (cidade === t || palavras.includes(t)) nota = 90; // palavra inteira: "bali" → Denpasar-Bali
    else if (cidade.startsWith(t)) nota = 80;
    else if (palavras.some((p) => p.startsWith(t))) nota = 60;
    else if (resto.split(/[\s(),-]+/).some((p) => p.startsWith(t))) nota = 40;
    if (!nota) continue;
    // Aeroporto "International" primeiro: costuma ser o que tem voo comercial
    if (/international|internacional/i.test(nomeAeroporto)) nota += 5;
    achados.push({
      s: { codigo, nome: nomeCidade, pais: [estado && estado !== "Nacional" ? estado : "", pais].filter(Boolean).join(", ") },
      nota,
    });
  }
  return achados
    .sort((a, b) => b.nota - a.nota || a.s.nome.localeCompare(b.s.nome))
    .slice(0, limite)
    .map((a) => a.s);
}
