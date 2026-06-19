"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function CustomerLogout() {
  const router = useRouter();
  const sair = async () => {
    await supabaseBrowser().auth.signOut();
    router.push("/");
    router.refresh();
  };
  return <button onClick={sair} className="acc-logout"><LogOut size={15} /> Sair</button>;
}
