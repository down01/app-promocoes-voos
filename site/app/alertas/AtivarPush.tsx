"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { clienteNavegador } from "@/lib/supabase/navegador";

const nada = () => () => {};
// No servidor não dá para saber; null = "ainda verificando"
const temSuporte = () => "serviceWorker" in navigator && "PushManager" in window;
const ehIphoneSemApp = () =>
  /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.matchMedia("(display-mode: standalone)").matches;

function chaveParaBytes(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const bruto = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(bruto, (c) => c.charCodeAt(0));
}

export default function AtivarPush({ usuarioId }: { usuarioId: string }) {
  const suportado = useSyncExternalStore<boolean | null>(nada, temSuporte, () => null);
  const ios = useSyncExternalStore(nada, ehIphoneSemApp, () => false);
  const [ativo, setAtivo] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!suportado) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setAtivo(!!sub));
  }, [suportado]);

  async function ativar() {
    setErro("");
    const chave = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!chave) return setErro("Notificações ainda não configuradas no site.");
    if ((await Notification.requestPermission()) !== "granted") {
      return setErro("Você não permitiu as notificações. Libere nas configurações do navegador.");
    }
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: chaveParaBytes(chave) });
    const json = sub.toJSON();
    const { error } = await clienteNavegador()
      .from("push_assinaturas")
      .insert({ user_id: usuarioId, endpoint: json.endpoint, p256dh: json.keys?.p256dh, auth: json.keys?.auth });
    if (error && !error.message.includes("duplicate")) return setErro("Não deu para salvar. Tente de novo.");
    setAtivo(true);
  }

  async function desativar() {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await clienteNavegador().from("push_assinaturas").delete().eq("endpoint", sub.endpoint);
      await sub.unsubscribe();
    }
    setAtivo(false);
  }

  return (
    <div className="cartao grid gap-2">
      <h2 className="font-semibold">Notificação neste aparelho</h2>
      {suportado === false ? (
        <p className="text-sm text-slate-500">
          {ios
            ? "No iPhone: toque em Compartilhar → “Adicionar à Tela de Início”, abra o app por lá e volte aqui."
            : "Este navegador não aceita notificações."}
        </p>
      ) : ativo ? (
        <>
          <p className="text-sm text-emerald-700">✅ Notificações ligadas neste aparelho.</p>
          <button className="botao-secundario justify-self-start text-sm" onClick={desativar}>
            Desligar
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-slate-600">Receba a promoção na hora, como mensagem do celular.</p>
          <button className="botao justify-self-start" onClick={ativar} disabled={suportado === null}>
            Ligar notificações
          </button>
        </>
      )}
      {erro && <p className="text-sm text-red-700">{erro}</p>}
    </div>
  );
}
