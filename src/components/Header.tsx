import { useEffect, useState } from "react";
import { LogIn, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

type HeaderProps = {
  onLogin: () => void;
};

type Profile = {
  full_name: string | null;
  role: "admin" | "professor";
  status: "active" | "suspended";
};

export function Header({ onLogin }: HeaderProps) {
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const client = supabase;

    if (!client) {
      setLoading(false);
      return;
    }

    let active = true;

    async function synchronizeUser(
      userId?: string,
      userEmail?: string,
    ) {
      if (!active) return;

      setEmail(userEmail ?? null);

      if (!userId) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const { data, error } = await client
        .from("profiles")
        .select("full_name, role, status")
        .eq("id", userId)
        .single();

      if (!active) return;

      if (error) {
        console.error("Erro ao consultar perfil:", error.message);
        setProfile(null);
      } else {
        setProfile(data as Profile);
      }

      setLoading(false);
    }

    client.auth.getSession().then(({ data }) => {
      void synchronizeUser(
        data.session?.user.id,
        data.session?.user.email,
      );
    });

    const { data: listener } = client.auth.onAuthStateChange(
      (_event, session) => {
        void synchronizeUser(
          session?.user.id,
          session?.user.email,
        );
      },
    );

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    const client = supabase;

    if (!client) return;

    const { error } = await client.auth.signOut();

    if (error) {
      alert(`Não foi possível sair: ${error.message}`);
      return;
    }

    window.location.assign("/");
  }

  const displayName =
    profile?.full_name?.trim() ||
    email?.split("@")[0] ||
    "Usuário";

  const roleLabel =
    profile?.role === "admin" ? "Administrador" : "Professor";

  return (
    <header className="site-header">
      <div className="container header-content">
        <Link
          to="/"
          className="brand"
          aria-label="Página inicial Allconectados"
        >
          <img
            src="/logo-allconectados.png"
            alt="Logo Allconectados"
          />
          <span>Allconectados</span>
        </Link>

        <nav className="main-nav" aria-label="Navegação principal">
          <a href="/#agentes">Agentes</a>
          <a href="/#sobre">Sobre</a>

          {email ? (
            <>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  lineHeight: 1.2,
                }}
              >
                <strong
                  style={{
                    color: "var(--purple-900)",
                    fontSize: "0.88rem",
                  }}
                >
                  {loading ? "Carregando..." : displayName}
                </strong>

                <small
                  style={{
                    color: "var(--muted)",
                    fontSize: "0.72rem",
                  }}
                >
                  {roleLabel}
                </small>
              </div>

              <button
                className="button button-outline"
                onClick={handleLogout}
              >
                <LogOut size={18} />
                Sair
              </button>
            </>
          ) : (
            <button
              className="button button-outline"
              onClick={onLogin}
            >
              <LogIn size={18} />
              Entrar
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
