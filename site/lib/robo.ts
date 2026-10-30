// Chama o robô no GitHub para buscar agora o que está na fila (modo "pedidos"). Só no servidor.
export async function acordarRobo() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO ?? "down01/app-promocoes-voos";
  if (!token) {
    console.error("acordarRobo: GITHUB_TOKEN não configurado");
    return false;
  }
  const r = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/robo-6h.yml/dispatches`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({ ref: "main", inputs: { modo: "pedidos" } }),
  });
  if (!r.ok) console.error(`acordarRobo: GitHub respondeu ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r.ok;
}
