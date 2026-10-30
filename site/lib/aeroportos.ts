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

export function nomeAeroporto(codigo: string) {
  return AEROPORTOS[codigo] ? `${AEROPORTOS[codigo]} (${codigo})` : codigo;
}
