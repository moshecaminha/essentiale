"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

function EntrarInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/conta";
  const [modo, setModo] = useState<"entrar" | "criar">(params.get("modo") === "criar" ? "criar" : "entrar");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null); setOk(null); setLoading(true);
    const sb = supabaseBrowser();
    try {
      if (modo === "criar") {
        const { data, error } = await sb.auth.signUp({
          email, password: senha, options: { data: { full_name: nome } },
        });
        if (error) throw error;
        if (data.session) { router.push(next); router.refresh(); return; }
        setOk("Conta criada! Verifique seu e-mail para confirmar o cadastro e depois entre.");
        setModo("entrar");
      } else {
        const { error } = await sb.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
        router.push(next); router.refresh();
      }
    } catch (err: any) {
      setMsg(err?.message === "Invalid login credentials" ? "E-mail ou senha incorretos." : (err?.message || "Não foi possível continuar."));
    } finally { setLoading(false); }
  };

  return (
    <div className="store">
      <div className="auth-wrap">
        <form onSubmit={submit} className="auth-card">
          <Link href="/"><img src="/logo.png" alt="Essentiale" className="auth-logo" /></Link>
          <div className="auth-tabs">
            <button type="button" className={modo === "entrar" ? "on" : ""} onClick={() => setModo("entrar")}>Entrar</button>
            <button type="button" className={modo === "criar" ? "on" : ""} onClick={() => setModo("criar")}>Criar conta</button>
          </div>

          {modo === "criar" && (
            <div className="field"><label>Nome completo</label><input value={nome} onChange={(e) => setNome(e.target.value)} required /></div>
          )}
          <div className="field"><label>E-mail</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <div className="field"><label>Senha</label><input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} minLength={6} required /></div>

          {msg && <div className="auth-erro">{msg}</div>}
          {ok && <div className="auth-ok">{ok}</div>}

          <button type="submit" className="btn full" disabled={loading}>
            {loading ? "Aguarde…" : modo === "criar" ? "Criar conta e continuar" : "Entrar"}
          </button>
          <Link href="/" className="auth-back">Voltar à loja</Link>
        </form>
      </div>
    </div>
  );
}

export default function Entrar() {
  return (
    <Suspense fallback={<div className="store"><div className="auth-wrap" /></div>}>
      <EntrarInner />
    </Suspense>
  );
}
