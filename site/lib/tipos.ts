export type Voo = {
  saida: string;
  chegada: string;
  companhia: string;
  duracao: string;
  paradas: string;
  preco: number;
};

export type Rota = {
  id: number;
  origem: string;
  destino: string;
  data_ida: string;
  data_volta: string | null;
  preco_atual: number | null;
  voos_atuais: Voo[];
  link: string | null;
  ultima_busca_em: string | null;
};

export type Alerta = {
  id: string;
  rota_id: number;
  limite_ida_volta: number | null;
  limite_ida: number | null;
  limite_volta: number | null;
  avisar_email: boolean;
  avisar_telegram: boolean;
  avisar_push: boolean;
  ativo: boolean;
  rota: Rota;
};
