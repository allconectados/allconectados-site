import { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { Header } from "./components/Header";
import { LoginModal } from "./components/LoginModal";
import { supabase } from "./lib/supabase";
import { AgentPage } from "./pages/AgentPage";
import { HomePage } from "./pages/HomePage";

export default function App() {
  const [loginOpen, setLoginOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) setLoginOpen(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <div className="app-shell">
      <Header onLogin={() => setLoginOpen(true)} />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/agentes/:slug"
          element={
            <AgentPage
              authenticated={Boolean(session)}
              onLogin={() => setLoginOpen(true)}
            />
          }
        />
      </Routes>

      <footer className="site-footer">
        <div className="container footer-content">
          <p>© {new Date().getFullYear()} Allconectados.</p>
          <p>Inteligência artificial como apoio ao trabalho docente.</p>
        </div>
      </footer>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
}
