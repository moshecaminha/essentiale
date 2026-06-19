import { login } from "./actions";

export const metadata = { title: "Entrar — Essentiale Admin" };

export default function LoginPage({ searchParams }: { searchParams: { erro?: string } }) {
  return (
    <div className="login-wrap">
      <form action={login} className="login-card">
        <img src="/logo.png" alt="Essentiale" className="login-logo" />
        <h1>Painel da equipe</h1>
        <p>Acesso restrito à gestão da Essentiale.</p>
        <div className="field">
          <label htmlFor="password">Senha de acesso</label>
          <input id="password" name="password" type="password" autoFocus required />
        </div>
        {searchParams?.erro && <div className="login-erro">Senha incorreta. Tente novamente.</div>}
        <button type="submit" className="adm-btn" style={{ width: "100%", justifyContent: "center" }}>Entrar</button>
      </form>
    </div>
  );
}
