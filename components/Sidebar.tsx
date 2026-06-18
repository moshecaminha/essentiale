"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid, Sparkles, Users, Megaphone, Package, Truck,
} from "lucide-react";

const NAV = [
  { href: "/", label: "Visão geral", icon: LayoutGrid },
  { href: "/inteligencia", label: "Inteligência", icon: Sparkles },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/campanhas", label: "Campanhas", icon: Megaphone },
  { href: "/produtos", label: "Produtos e estoque", icon: Package },
  { href: "/pedidos", label: "Pedidos", icon: Truck },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="side">
      <div className="brand">
        <div className="brand-mark">EF</div>
        <div className="brand-text">
          <strong>Essentiale</strong>
          <span>Inteligência Comercial</span>
        </div>
      </div>
      <nav className="nav-list">
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
          return (
            <Link key={n.href} href={n.href} className={`nav-item ${active ? "active" : ""}`}>
              <Icon size={17} /> <span>{n.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="side-foot">
        <div className="owner">
          <span className="owner-av">EF</span>
          <span>Equipe Essentiale</span>
        </div>
      </div>
    </aside>
  );
}
