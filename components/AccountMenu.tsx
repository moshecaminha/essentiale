"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, ChevronDown, Package, LogOut } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function AccountMenu() {
  const router = useRouter();
  const [user, setUser] = useState<any>(undefined);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sb = supabaseBrowser();
    sb.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const nome = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0];
  const sair = async () => { await supabaseBrowser().auth.signOut(); setOpen(false); router.push("/"); router.refresh(); };

  return (
    <div className="acct" ref={ref}>
      <button className="acct-btn" onClick={() => setOpen((o) => !o)} aria-label="Minha conta">
        <User size={18} />
        <span className="acct-label">{user ? (nome || "Minha conta") : "Entrar"}</span>
        <ChevronDown size={13} />
      </button>
      {open && (
        <div className="acct-menu">
          {user ? (
            <>
              <Link href="/conta" onClick={() => setOpen(false)}><User size={14} /> Minha conta</Link>
              <Link href="/conta/pedidos" onClick={() => setOpen(false)}><Package size={14} /> Meus pedidos</Link>
              <button onClick={sair}><LogOut size={14} /> Sair</button>
            </>
          ) : (
            <>
              <Link href="/entrar?modo=criar" onClick={() => setOpen(false)}>Criar uma conta</Link>
              <Link href="/entrar" onClick={() => setOpen(false)}>Iniciar sessão</Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
