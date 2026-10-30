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

const semAcento = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

export type Sugestao = { codigo: string; nome: string; pais: string };

// Sugestões para o campo de aeroporto: aceita código, cidade ou país, com ou sem acento
export function sugerirAeroportos(texto: string, limite = 8): Sugestao[] {
  const t = semAcento(texto);
  if (!t) return [];
  const resultados: { s: Sugestao; nota: number }[] = [];
  for (const [codigo, nome] of Object.entries(AEROPORTOS)) {
    const pais = PAISES[codigo] ?? "Brasil";
    const n = semAcento(nome);
    let nota = 0;
    if (codigo.toLowerCase() === t) nota = 100;
    else if (n.startsWith(t)) nota = 80;
    else if (n.split(/[\s(]+/).some((p) => p.startsWith(t))) nota = 60;
    else if (codigo.toLowerCase().startsWith(t)) nota = 50;
    else if (semAcento(pais).split(" ").some((p) => p.startsWith(t))) nota = 40;
    if (nota) resultados.push({ s: { codigo, nome, pais: pais.split(" ").slice(0, pais.startsWith("Estados") ? 2 : 3).join(" ") }, nota });
  }
  return resultados
    // Empate: aeroportos do Brasil primeiro (o público é brasileiro), depois ordem alfabética
    .sort((a, b) =>
      b.nota - a.nota ||
      Number(b.s.pais === "Brasil") - Number(a.s.pais === "Brasil") ||
      a.s.nome.localeCompare(b.s.nome))
    .slice(0, limite)
    .map((r) => r.s);
}

export function nomeAeroporto(codigo: string) {
  return AEROPORTOS[codigo] ? `${AEROPORTOS[codigo]} (${codigo})` : codigo;
}
