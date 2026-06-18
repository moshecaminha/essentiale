"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid, Sparkles, Users, Megaphone, Package, Truck, Store,
} from "lucide-react";

const NAV = [
  { href: "/admin", label: "Visão geral", icon: LayoutGrid },
  { href: "/admin/inteligencia", label: "Inteligência", icon: Sparkles },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
  { href: "/admin/campanhas", label: "Campanhas", icon: Megaphone },
  { href: "/admin/produtos", label: "Produtos e estoque", icon: Package },
  { href: "/admin/pedidos", label: "Pedidos", icon: Truck },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="side">
      <div className="brand">
        <img src="/logo.png" alt="Essentiale Fragrance" className="brand-logo" />
      </div>
      <div className="brand-sub">Inteligência Comercial</div>
      <nav className="nav-list">
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = n.href === "/admin" ? path === "/admin" : path.startsWith(n.href);
          return (
            <Link key={n.href} href={n.href} className={`nav-item ${active ? "active" : ""}`}>
              <Icon size={17} /> <span>{n.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="side-foot">
        <Link href="/" className="nav-item"><Store size={17} /> <span>Ver a loja</span></Link>
        <div className="owner">
          <span className="owner-av">EF</span>
          <span>Equipe Essentiale</span>
        </div>
      </div>
    </aside>
  );
}
