// Comunicação com os robôs no GitHub Actions. Só no servidor (usa GITHUB_TOKEN).

const API = "https://api.github.com";

function cabecalhos(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

async function disparar(arquivo: string, inputs: Record<string, string>) {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO ?? "down01/app-promocoes-voos";
  if (!token) {
    console.error(`disparar ${arquivo}: GITHUB_TOKEN não configurado`);
    return false;
  }
  const r = await fetch(`${API}/repos/${repo}/actions/workflows/${arquivo}/dispatches`, {
    method: "POST",
    headers: cabecalhos(token),
    body: JSON.stringify({ ref: "main", inputs }),
  });
  if (!r.ok) console.error(`disparar ${arquivo}: GitHub respondeu ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r.ok;
}

// Busca agora o que está na fila (modo "pedidos")
export function acordarRobo() {
  return disparar("robo-6h.yml", { modo: "pedidos" });
}

// Atualização geral (calendário nacional + internacional + alertas), se não houver uma rodando
export async function iniciarAtualizacaoGeral() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO ?? "down01/app-promocoes-voos";
  if (!token) return { iniciada: false, motivo: "GITHUB_TOKEN não configurado" };

  for (const status of ["in_progress", "queued"]) {
    const r = await fetch(`${API}/repos/${repo}/actions/workflows/atualizacao-geral.yml/runs?status=${status}&per_page=1`, {
      headers: cabecalhos(token),
    });
    if (r.ok && (await r.json()).total_count > 0) return { iniciada: false, motivo: `já existe uma rodada (${status})` };
  }
  const ok = await disparar("atualizacao-geral.yml", { escopo: "tudo" });
  return { iniciada: ok, motivo: ok ? "" : "o GitHub recusou o pedido" };
}
