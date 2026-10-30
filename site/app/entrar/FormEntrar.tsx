"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { clienteNavegador } from "@/lib/supabase/navegador";

type Modo = "entrar" | "criar" | "esqueci";

// Mensagens do Supabase (em inglês) traduzidas para quem usa o site
function traduzir(mensagem: string) {
  if (mensagem.includes("Invalid login credentials")) return "E-mail ou senha incorretos.";
  if (mensagem.includes("Email not confirmed")) return "Confirme seu e-mail primeiro: abra o link que enviamos.";
  if (mensagem.includes("already registered")) return "Já existe uma conta com este e-mail. Use a aba Entrar.";
  if (mensagem.includes("Password should be")) return "A senha precisa ter pelo menos 6 caracteres.";
  if (mensagem.toLowerCase().includes("rate")) return "Muitas tentativas agora. Espere alguns minutos.";
  return mensagem;
}

export default function FormEntrar({ proximo, modoInicial }: { proximo: string; modoInicial: "entrar" | "criar" }) {
  const router = useRouter();
  const [modo, setModo] = useState<Modo>(modoInicial);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");

  function trocar(novo: Modo) {
    setModo(novo);
    setErro("");
    setAviso("");
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    const supabase = clienteNavegador();
    const retorno = (destino: string) => `${location.origin}/auth/callback?next=${encodeURIComponent(destino)}`;

    if (modo === "criar" && senha !== confirmacao) {
      setErro("As duas senhas não são iguais.");
      return;
    }
    setEnviando(true);

    if (modo === "entrar") {
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
      if (error) {
        setErro(traduzir(error.message));
      } else {
        router.push(proximo);
        router.refresh();
        return;
      }
    } else if (modo === "criar") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: { emailRedirectTo: retorno(proximo) },
      });
      if (error) {
        setErro(traduzir(error.message));
      } else if (data.session) {
        router.push(proximo);
        router.refresh();
        return;
      } else {
        setAviso(`Conta criada! Enviamos um e-mail para ${email}. Abra o link para confirmar e já entrar.`);
      }
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: retorno("/nova-senha") });
      if (error) setErro(traduzir(error.message));
      else setAviso(`Se existir uma conta com ${email}, enviamos um link para criar uma senha nova.`);
    }
    setEnviando(false);
  }

  const titulo = modo === "entrar" ? "Entrar" : modo === "criar" ? "Criar conta" : "Esqueci minha senha";

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="text-2xl font-bold">{titulo}</h1>
        <p className="text-sm text-slate-600">
          {modo === "esqueci"
            ? "Digite seu e-mail e mandamos um link para você criar uma senha nova."
            : "Com uma conta você cria alertas e recebe aviso quando o preço da sua viagem cair."}
        </p>
      </div>

      {modo !== "esqueci" && (
        <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-sm font-medium">
          {(["entrar", "criar"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => trocar(m)}
              className={`rounded-lg py-2 ${modo === m ? "bg-white text-sky-700 shadow-sm" : "text-slate-500"}`}
            >
              {m === "entrar" ? "Entrar" : "Criar conta"}
            </button>
          ))}
        </div>
      )}

      {aviso ? (
        <div className="cartao grid gap-3 text-slate-700">
          <p>📬 {aviso} Se não chegar em 2 minutos, olhe o spam.</p>
          <button className="botao-secundario justify-self-start text-sm" onClick={() => trocar("entrar")}>
            Voltar para Entrar
          </button>
        </div>
      ) : (
        <form onSubmit={enviar} className="cartao grid gap-3">
          <label className="grid gap-1 text-sm font-medium text-slate-600">
            E-mail
            <input className="campo" type="email" required autoComplete="email" value={email}
              onChange={(e) => setEmail(e.target.value)} placeholder="voce@exemplo.com" />
          </label>
          {modo !== "esqueci" && (
            <label className="grid gap-1 text-sm font-medium text-slate-600">
              Senha
              <input className="campo" type="password" required minLength={6}
                autoComplete={modo === "criar" ? "new-password" : "current-password"} value={senha}
                onChange={(e) => setSenha(e.target.value)} placeholder="mínimo 6 caracteres" />
            </label>
          )}
          {modo === "criar" && (
            <label className="grid gap-1 text-sm font-medium text-slate-600">
              Repita a senha
              <input className="campo" type="password" required minLength={6} autoComplete="new-password"
                value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} />
            </label>
          )}
          {erro && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}
          <button className="botao" disabled={enviando}>
            {enviando ? "Aguarde…" : modo === "entrar" ? "Entrar" : modo === "criar" ? "Criar conta" : "Enviar link"}
          </button>
          {modo === "entrar" && (
            <button type="button" className="justify-self-center text-sm text-sky-700 underline"
              onClick={() => trocar("esqueci")}>
              Esqueci minha senha
            </button>
          )}
          {modo === "esqueci" && (
            <button type="button" className="justify-self-center text-sm text-sky-700 underline"
              onClick={() => trocar("entrar")}>
              Voltar para Entrar
            </button>
          )}
        </form>
      )}

      <Link href="/" className="justify-self-center text-sm text-slate-500 underline">
        Continuar sem conta (só buscar preços)
      </Link>
    </div>
  );
}
