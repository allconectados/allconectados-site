import { LogIn } from "lucide-react";
import { Link } from "react-router-dom";

type HeaderProps = {
  onLogin: () => void;
};

export function Header({ onLogin }: HeaderProps) {
  return (
    <header className="site-header">
      <div className="container header-content">
        <Link to="/" className="brand" aria-label="Página inicial Allconectados">
          <img src="/logo-allconectados.png" alt="Logo Allconectados" />
          <span>Allconectados</span>
        </Link>

        <nav className="main-nav" aria-label="Navegação principal">
          <a href="/#agentes">Agentes</a>
          <a href="/#sobre">Sobre</a>
          <button className="button button-outline" onClick={onLogin}>
            <LogIn size={18} />
            Entrar
          </button>
        </nav>
      </div>
    </header>
  );
}
