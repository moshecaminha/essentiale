import Link from "next/link";
import CustomerLogout from "@/components/CustomerLogout";

export default function ContaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="store">
      <header className="hdr">
        <Link href="/" className="logo-link"><img src="/logo.png" alt="Essentiale" className="logo-img" /></Link>
        <nav className="acc-nav">
          <Link href="/conta">Minha conta</Link>
          <Link href="/conta/pedidos">Meus pedidos</Link>
          <Link href="/conta/enderecos">Meus endereços</Link>
          <Link href="/">Loja</Link>
        </nav>
        <div style={{ marginLeft: "auto" }}><CustomerLogout /></div>
      </header>
      <div className="account">{children}</div>
    </div>
  );
}
