// Links de reserva. Formatos de LATAM e Gol testados em 30/10/2026 (só ida e ida e volta).
// A Azul não aceita link pronto; para ela e as demais, o Google Voos mostra "Reservar com …".

export type Companhia = { nome: string; cor: string; texto: string };

const CONHECIDAS: Record<string, Companhia> = {
  latam: { nome: "LATAM", cor: "#1b0088", texto: "#ffffff" },
  gol: { nome: "Gol", cor: "#ff5a00", texto: "#ffffff" },
  azul: { nome: "Azul", cor: "#0b4ea2", texto: "#ffffff" },
  jetsmart: { nome: "JetSMART", cor: "#1e3a8a", texto: "#ffffff" },
};

export function companhias(texto: string) {
  return texto.split(",").map((c) => c.trim()).filter(Boolean);
}

export function estiloCompanhia(nome: string): Companhia {
  return CONHECIDAS[nome.toLowerCase().replace(/\s/g, "")] ?? { nome, cor: "#334155", texto: "#ffffff" };
}

function googleVoos(origem: string, destino: string, ida: string, volta: string | null) {
  const q = `Flights from ${origem} to ${destino} on ${ida}` + (volta ? ` through ${volta}` : " one way");
  return `https://www.google.com/travel/flights?q=${encodeURIComponent(q)}&hl=pt-BR&curr=BRL`;
}

const dmy = (iso: string) => iso.split("-").reverse().join("-");

export function linkReserva(companhia: string, origem: string, destino: string, ida: string, volta: string | null) {
  const lista = companhias(companhia);
  const unica = lista.length === 1 ? lista[0].toLowerCase() : null;

  if (unica === "latam") {
    const p = new URLSearchParams({
      origin: origem,
      destination: destino,
      outbound: `${ida}T12:00:00.000Z`,
      inbound: volta ? `${volta}T12:00:00.000Z` : "null",
      adt: "1",
      chd: "0",
      inf: "0",
      trip: volta ? "RT" : "OW",
      cabin: "Economy",
      redemption: "false",
      sort: "RECOMMENDED",
    });
    return { url: `https://www.latamairlines.com/br/pt/oferta-voos?${p}`, destino: "site da LATAM" };
  }

  if (unica === "gol") {
    const p = new URLSearchParams({ pv: "br", tipo: "DF", de: origem, para: destino, ida: dmy(ida) });
    if (volta) p.set("volta", dmy(volta));
    p.set("ADT", "1");
    p.set("CHD", "0");
    p.set("INF", "0");
    return { url: `https://b2c.voegol.com.br/compra/busca-parceiros?${p}`, destino: "site da Gol" };
  }

  return { url: googleVoos(origem, destino, ida, volta), destino: "Google Voos" };
}
