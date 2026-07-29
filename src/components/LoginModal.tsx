import { X } from "lucide-react";
import { supabase, supabaseConfigured } from "../lib/supabase";

type LoginModalProps = {
  open: boolean;
  onClose: () => void;
};

export function LoginModal({ open, onClose }: LoginModalProps) {
  if (!open) return null;

  async function signInWithGoogle() {
    if (!supabase || !supabaseConfigured) {
      alert("A integração com o Supabase será configurada na próxima etapa.");
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`
      }
    });

    if (error) {
      alert(`Não foi possível iniciar o login: ${error.message}`);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose} aria-label="Fechar">
          <X size={22} />
        </button>

        <img
          className="modal-logo"
          src="/logo-allconectados.png"
          alt="Allconectados"
        />
        <h2 id="login-title">Acesse sua conta</h2>
        <p>
          Entre para consultar os tutoriais completos, assistir aos vídeos e
          participar da comunidade.
        </p>

        <button className="button button-primary button-full" onClick={signInWithGoogle}>
          Continuar com Google
        </button>
      </div>
    </div>
  );
}
