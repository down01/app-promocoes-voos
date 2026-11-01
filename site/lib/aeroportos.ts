// Sugestões para o campo de busca. Qualquer código de 3 letras funciona, mesmo fora desta lista.
export const AEROPORTOS: Record<string, string> = {
  // Brasil
  VIX: "Vitória", BSB: "Brasília", GRU: "São Paulo (Guarulhos)", CGH: "São Paulo (Congonhas)",
  VCP: "Campinas", GIG: "Rio de Janeiro (Galeão)", SDU: "Rio de Janeiro (Santos Dumont)",
  CNF: "Belo Horizonte (Confins)", PLU: "Belo Horizonte (Pampulha)", SSA: "Salvador", REC: "Recife",
  FOR: "Fortaleza", POA: "Porto Alegre", CWB: "Curitiba", FLN: "Florianópolis", BEL: "Belém",
  MAO: "Manaus", GYN: "Goiânia", CGB: "Cuiabá", CGR: "Campo Grande", NAT: "Natal", MCZ: "Maceió",
  JPA: "João Pessoa", AJU: "Aracaju", THE: "Teresina", SLZ: "São Luís", PMW: "Palmas",
  PVH: "Porto Velho", RBR: "Rio Branco", BVB: "Boa Vista", MCP: "Macapá", IGU: "Foz do Iguaçu",
  NVT: "Navegantes", LDB: "Londrina", UDI: "Uberlândia", IOS: "Ilhéus", BPS: "Porto Seguro",
  JDO: "Juazeiro do Norte", MOC: "Montes Claros", RAO: "Ribeirão Preto", SJP: "São José do Rio Preto",
  MGF: "Maringá", JOI: "Joinville", XAP: "Chapecó", STM: "Santarém", IMP: "Imperatriz",
  FEN: "Fernando de Noronha", CAC: "Cascavel", JJD: "Jericoacoara", PNZ: "Petrolina",
  // América do Sul
  SCL: "Santiago", EZE: "Buenos Aires (Ezeiza)", AEP: "Buenos Aires (Aeroparque)", MVD: "Montevidéu",
  ASU: "Assunção", LIM: "Lima", BOG: "Bogotá", MDE: "Medellín", CTG: "Cartagena", UIO: "Quito",
  GYE: "Guayaquil", LPB: "La Paz", VVI: "Santa Cruz de la Sierra", CCS: "Caracas", BRC: "Bariloche",
  MDZ: "Mendoza", COR: "Córdoba", PUQ: "Punta Arenas", CUZ: "Cusco", PDP: "Punta del Este",
  // América Central e Caribe
  PTY: "Cidade do Panamá", SJO: "San José (Costa Rica)", CUN: "Cancún", MEX: "Cidade do México",
  PUJ: "Punta Cana", SDQ: "Santo Domingo", HAV: "Havana", AUA: "Aruba", CUR: "Curaçao",
  // América do Norte
  MIA: "Miami", MCO: "Orlando", FLL: "Fort Lauderdale", JFK: "Nova York (JFK)", EWR: "Nova York (Newark)",
  LAX: "Los Angeles", SFO: "São Francisco", LAS: "Las Vegas", ORD: "Chicago", ATL: "Atlanta",
  IAH: "Houston", DFW: "Dallas", BOS: "Boston", IAD: "Washington", YYZ: "Toronto", YUL: "Montreal",
  // Europa
  LIS: "Lisboa", OPO: "Porto", MAD: "Madri", BCN: "Barcelona", CDG: "Paris", ORY: "Paris (Orly)",
  LHR: "Londres (Heathrow)", LGW: "Londres (Gatwick)", FCO: "Roma", MXP: "Milão", FRA: "Frankfurt",
  MUC: "Munique", AMS: "Amsterdã", ZRH: "Zurique", BRU: "Bruxelas", VIE: "Viena", DUB: "Dublin",
  ATH: "Atenas", IST: "Istambul", PRG: "Praga", BER: "Berlim", CPH: "Copenhague",
  // Ásia, Oriente Médio, África e Oceania
  DXB: "Dubai", DOH: "Doha", TLV: "Tel Aviv", NRT: "Tóquio (Narita)", HND: "Tóquio (Haneda)",
  ICN: "Seul", PEK: "Pequim", PVG: "Xangai", HKG: "Hong Kong", SIN: "Singapura", BKK: "Bangkok",
  DEL: "Nova Délhi", JNB: "Joanesburgo", CPT: "Cidade do Cabo", CAI: "Cairo", CMN: "Casablanca",
  SYD: "Sydney", MEL: "Melbourne", AKL: "Auckland",
};

// Os 45 da atualização geral nacional (mesma lista de aeroportos.py)
export const BRASIL = [
  "VIX", "BSB", "GRU", "CGH", "VCP", "GIG", "SDU", "CNF", "SSA", "REC", "FOR", "POA", "CWB", "FLN",
  "BEL", "MAO", "GYN", "CGB", "CGR", "NAT", "MCZ", "JPA", "AJU", "THE", "SLZ", "PMW", "PVH", "RBR",
  "BVB", "MCP", "IGU", "NVT", "LDB", "UDI", "IOS", "BPS", "JDO", "MOC", "RAO", "SJP", "MGF", "JOI",
  "XAP", "STM", "IMP",
];

// País de cada aeroporto fora do Brasil, para buscar por "frança", "eua", "chile"...
const PAISES: Record<string, string> = {
  SCL: "Chile", PUQ: "Chile", EZE: "Argentina", AEP: "Argentina", BRC: "Argentina", MDZ: "Argentina", COR: "Argentina",
  MVD: "Uruguai", PDP: "Uruguai", ASU: "Paraguai", LIM: "Peru", CUZ: "Peru", BOG: "Colômbia", MDE: "Colômbia",
  CTG: "Colômbia", UIO: "Equador", GYE: "Equador", LPB: "Bolívia", VVI: "Bolívia", CCS: "Venezuela",
  PTY: "Panamá", SJO: "Costa Rica", CUN: "México", MEX: "México", PUJ: "República Dominicana",
  SDQ: "República Dominicana", HAV: "Cuba", AUA: "Aruba", CUR: "Curaçao",
  MIA: "Estados Unidos EUA", MCO: "Estados Unidos EUA Disney", FLL: "Estados Unidos EUA", JFK: "Estados Unidos EUA",
  EWR: "Estados Unidos EUA", LAX: "Estados Unidos EUA", SFO: "Estados Unidos EUA", LAS: "Estados Unidos EUA",
  ORD: "Estados Unidos EUA", ATL: "Estados Unidos EUA", IAH: "Estados Unidos EUA", DFW: "Estados Unidos EUA",
  BOS: "Estados Unidos EUA", IAD: "Estados Unidos EUA", YYZ: "Canadá", YUL: "Canadá",
  LIS: "Portugal", OPO: "Portugal", MAD: "Espanha", BCN: "Espanha", CDG: "França", ORY: "França",
  LHR: "Inglaterra Reino Unido", LGW: "Inglaterra Reino Unido", FCO: "Itália", MXP: "Itália", FRA: "Alemanha",
  MUC: "Alemanha", BER: "Alemanha", AMS: "Holanda", ZRH: "Suíça", BRU: "Bélgica", VIE: "Áustria", DUB: "Irlanda",
  ATH: "Grécia", IST: "Turquia", PRG: "República Tcheca", CPH: "Dinamarca", DXB: "Emirados Árabes",
  DOH: "Catar", TLV: "Israel", NRT: "Japão", HND: "Japão", ICN: "Coreia do Sul", PEK: "China", PVG: "China",
  HKG: "Hong Kong China", SIN: "Singapura", BKK: "Tailândia", DEL: "Índia", JNB: "África do Sul",
  CPT: "África do Sul", CAI: "Egito", CMN: "Marrocos", SYD: "Austrália", MEL: "Austrália", AKL: "Nova Zelândia",
};

// Cidades com mais de um aeroporto. O código da cidade (RIO, SAO...) é aceito pelo Google Voos,
// que busca em todos os aeroportos dela e diz de qual sai cada voo (testado em 01/11/2026).
export const CIDADES: Record<string, { nome: string; aeroportos: string[] }> = {
  RIO: { nome: "Rio de Janeiro", aeroportos: ["GIG", "SDU"] },
  SAO: { nome: "São Paulo", aeroportos: ["GRU", "CGH", "VCP"] },
  BHZ: { nome: "Belo Horizonte", aeroportos: ["CNF", "PLU"] },
  BUE: { nome: "Buenos Aires", aeroportos: ["EZE", "AEP"] },
  NYC: { nome: "Nova York", aeroportos: ["JFK", "EWR"] },
  LON: { nome: "Londres", aeroportos: ["LHR", "LGW"] },
  PAR: { nome: "Paris", aeroportos: ["CDG", "ORY"] },
  TYO: { nome: "Tóquio", aeroportos: ["NRT", "HND"] },
};

// Estado de cada aeroporto do Brasil, para achar por "minas", "espírito santo", "RJ"...
const UF: Record<string, string> = {
  VIX: "ES", BSB: "DF", GRU: "SP", CGH: "SP", VCP: "SP", GIG: "RJ", SDU: "RJ", CNF: "MG", PLU: "MG",
  SSA: "BA", REC: "PE", FOR: "CE", POA: "RS", CWB: "PR", FLN: "SC", BEL: "PA", MAO: "AM", GYN: "GO",
  CGB: "MT", CGR: "MS", NAT: "RN", MCZ: "AL", JPA: "PB", AJU: "SE", THE: "PI", SLZ: "MA", PMW: "TO",
  PVH: "RO", RBR: "AC", BVB: "RR", MCP: "AP", IGU: "PR", NVT: "SC", LDB: "PR", UDI: "MG", IOS: "BA",
  BPS: "BA", JDO: "CE", MOC: "MG", RAO: "SP", SJP: "SP", MGF: "PR", JOI: "SC", XAP: "SC", STM: "PA",
  IMP: "MA", FEN: "PE", CAC: "PR", JJD: "CE", PNZ: "PE",
};
const ESTADOS: Record<string, string> = {
  AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia", CE: "Ceará", DF: "Distrito Federal",
  ES: "Espírito Santo", GO: "Goiás", MA: "Maranhão", MT: "Mato Grosso", MS: "Mato Grosso do Sul",
  MG: "Minas Gerais", PA: "Pará", PB: "Paraíba", PR: "Paraná", PE: "Pernambuco", PI: "Piauí",
  RJ: "Rio de Janeiro", RN: "Rio Grande do Norte", RS: "Rio Grande do Sul", RO: "Rondônia", RR: "Roraima",
  SC: "Santa Catarina", SP: "São Paulo", SE: "Sergipe", TO: "Tocantins",
};

const semAcento = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

// cidade = true quando o código vale para todos os aeroportos da cidade;
// grupo = país ou estado inteiro (o site busca cada aeroporto e compara)
export type Sugestao = { codigo: string; nome: string; pais: string; cidade?: boolean; grupo?: boolean; selo?: string };

// Nome do país para mostrar ("Estados Unidos EUA Disney" é só para a busca achar)
function nomePais(pais: string) {
  if (pais.startsWith("Estados Unidos")) return "Estados Unidos";
  if (pais.startsWith("Inglaterra")) return "Reino Unido";
  if (pais.startsWith("Hong Kong")) return "Hong Kong";
  return pais;
}

const MAX_POR_GRUPO = 8; // mais que isso vira busca demais para o robô

// Grupos com 2 ou mais aeroportos: países (fora o Brasil) e estados. id: "pais-chile", "uf-sp"
export const GRUPOS: Record<string, { nome: string; tipo: "país" | "estado"; aeroportos: string[]; busca: string }> = (() => {
  const g: Record<string, { nome: string; tipo: "país" | "estado"; aeroportos: string[]; busca: string }> = {};
  for (const codigo of Object.keys(AEROPORTOS)) {
    const pais = PAISES[codigo];
    const uf = UF[codigo];
    const [id, nome, tipo, busca] = pais
      ? [`pais-${semAcento(nomePais(pais)).replace(/\s+/g, "-")}`, nomePais(pais), "país" as const, pais]
      : uf
        ? [`uf-${uf.toLowerCase()}`, ESTADOS[uf], "estado" as const, `${ESTADOS[uf]} ${uf}`]
        : [null, "", "país" as const, ""];
    if (!id) continue;
    g[id] ??= { nome, tipo, aeroportos: [], busca };
    if (g[id].aeroportos.length < MAX_POR_GRUPO) g[id].aeroportos.push(codigo);
  }
  // Fora: grupo de um aeroporto só, ou igual a uma cidade (estado do RJ = Galeão + Santos Dumont = RIO)
  const mesmos = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));
  for (const id of Object.keys(g)) {
    if (g[id].aeroportos.length < 2 || Object.values(CIDADES).some((c) => mesmos(c.aeroportos, g[id].aeroportos))) delete g[id];
  }
  return g;
})();

export const ehGrupo = (codigo: string) => codigo in GRUPOS;

export function rotuloGrupo(id: string) {
  const g = GRUPOS[id];
  return g ? `${g.nome} (${g.tipo === "país" ? "país inteiro" : "estado inteiro"})` : id;
}

// Nota de quanto um nome combina com o texto digitado (0 = não combina)
function combina(t: string, nome: string, notaInteira: number, notaPalavra: number) {
  const n = semAcento(nome);
  if (n.startsWith(t)) return notaInteira;
  if (n.split(/[\s(]+/).some((p) => p.startsWith(t))) return notaPalavra;
  return 0;
}

// Sugestões para o campo de aeroporto: aceita código, cidade, estado ou país, com ou sem acento.
// Cidades com vários aeroportos aparecem com a opção "todos os aeroportos" logo antes deles.
export function sugerirAeroportos(texto: string, limite = 8): Sugestao[] {
  const t = semAcento(texto);
  if (!t) return [];
  const resultados: { s: Sugestao; nota: number }[] = [];
  for (const [codigo, nome] of Object.entries(AEROPORTOS)) {
    const pais = PAISES[codigo] ?? "Brasil";
    const uf = UF[codigo];
    let nota = 0;
    if (codigo.toLowerCase() === t) nota = 100;
    else nota = combina(t, nome, 80, 60);
    if (!nota && codigo.toLowerCase().startsWith(t)) nota = 50;
    if (!nota && uf && (uf.toLowerCase() === t || combina(t, ESTADOS[uf], 1, 1))) nota = 45;
    if (!nota && semAcento(pais).split(" ").some((p) => p.startsWith(t))) nota = 40;
    const rotuloPais = uf ? `${ESTADOS[uf]} · Brasil` : pais.split(" ").slice(0, pais.startsWith("Estados") ? 2 : 3).join(" ");
    if (nota) resultados.push({ s: { codigo, nome, pais: rotuloPais }, nota });
  }
  for (const [codigo, c] of Object.entries(CIDADES)) {
    // Fora do Brasil a cidade também aparece pelo país ("frança" → Paris (todos))
    const pais = PAISES[c.aeroportos[0]];
    const nota = codigo.toLowerCase() === t ? 100 : combina(t, c.nome, 80, 60) || (pais ? combina(t, pais, 79, 59) : 0);
    // +1: fica na frente dos aeroportos da própria cidade
    if (nota) resultados.push({ s: { codigo, nome: `${c.nome} (todos)`, pais: `Todos os aeroportos: ${c.aeroportos.join(", ")}`, cidade: true }, nota: nota + 1 });
  }
  for (const [id, g] of Object.entries(GRUPOS)) {
    // Pelo nome inteiro ou palavra (país também pelos apelidos: "eua"); estado também pela sigla
    let nota = combina(t, g.busca, 80, 60);
    if (g.tipo === "estado" && t === id.slice(3)) nota = 80;
    // Logo abaixo da cidade com o mesmo nome ("São Paulo (todos)" antes de "São Paulo (estado inteiro)")
    if (nota) resultados.push({
      s: { codigo: id, nome: rotuloGrupo(id), pais: `Compara: ${g.aeroportos.join(", ")}`, grupo: true,
           selo: g.tipo === "estado" ? id.slice(3).toUpperCase() : "🌎" },
      nota: nota + 0.5,
    });
  }
  return resultados
    // Empate: aeroportos do Brasil primeiro (o público é brasileiro), depois ordem alfabética
    .sort((a, b) =>
      b.nota - a.nota ||
      Number(b.s.pais.endsWith("Brasil")) - Number(a.s.pais.endsWith("Brasil")) ||
      a.s.nome.localeCompare(b.s.nome))
    .slice(0, limite)
    .map((r) => r.s);
}

// Aeroportos que um código cobre: os da cidade, ou ele mesmo
export function aeroportosDe(codigo: string) {
  return CIDADES[codigo]?.aeroportos ?? [codigo];
}

// Códigos a buscar para um campo: os do grupo (país/estado), ou o próprio código (aeroporto ou cidade)
export function membrosDe(codigo: string) {
  return GRUPOS[codigo]?.aeroportos ?? [codigo];
}

// Texto do campo → código: "Vitória (VIX)", "VIX", "Chile (país inteiro)" ou o que foi digitado
export function codigoDoTexto(texto: string) {
  const entre = texto.match(/\(([A-Za-z]{3})\)\s*$/);
  if (entre) return entre[1].toUpperCase();
  const limpo = texto.trim();
  const grupo = Object.keys(GRUPOS).find((id) => rotuloGrupo(id) === limpo);
  if (grupo) return grupo;
  if (/^[A-Za-z]{3}$/.test(limpo)) return limpo.toUpperCase();
  return sugerirAeroportos(limpo, 1)[0]?.codigo ?? "";
}

// Nome curto da cidade: "São Paulo (Guarulhos)" → "São Paulo"
export function nomeCidade(codigo: string) {
  return (CIDADES[codigo]?.nome ?? AEROPORTOS[codigo] ?? codigo).replace(/\s*\(.*\)/, "");
}

export function nomeAeroporto(codigo: string) {
  if (CIDADES[codigo]) return `${CIDADES[codigo].nome} – todos os aeroportos`;
  return AEROPORTOS[codigo] ? `${AEROPORTOS[codigo]} (${codigo})` : codigo;
}
