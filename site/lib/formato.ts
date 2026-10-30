import { nomeAeroporto } from "./aeroportos";

export function reais(valor: number | null | undefined) {
  if (valor == null) return "—";
  return "R$ " + valor.toLocaleString("pt-BR");
}

export function data(iso: string | null) {
  if (!iso) return "";
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

export function haQuantoTempo(iso: string | null) {
  if (!iso) return "ainda não buscado";
  const minutos = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutos < 1) return "agora mesmo";
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `há ${horas} h`;
  return `há ${Math.round(horas / 24)} dias`;
}

export function trajeto(origem: string, destino: string) {
  return `${nomeAeroporto(origem)} → ${nomeAeroporto(destino)}`;
}
