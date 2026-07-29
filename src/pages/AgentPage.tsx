import { ArrowLeft, LockKeyhole, PlayCircle } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { agents } from "../data";

type AgentPageProps = {
  authenticated: boolean;
  onLogin: () => void;
};

export function AgentPage({ authenticated, onLogin }: AgentPageProps) {
  const { slug } = useParams();
  const agent = agents.find((item) => item.slug === slug);

  if (!agent) {
    return (
      <main className="container protected-page">
        <h1>Agente não encontrado</h1>
        <Link to="/">Voltar à página inicial</Link>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="login-required">
        <div className="login-required-card">
          <LockKeyhole size={48} />
          <h1>Faça login para continuar</h1>
          <p>
            Entre em sua conta para acessar o tutorial completo, assistir ao
            vídeo e conhecer todas as funcionalidades deste agente.
          </p>
          <button className="button button-primary" onClick={onLogin}>
            Entrar com Google
          </button>
          <Link className="back-link" to="/">
            <ArrowLeft size={18} />
            Voltar à página principal
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="section">
      <div className="container agent-detail">
        <Link className="back-link" to="/">
          <ArrowLeft size={18} />
          Voltar aos agentes
        </Link>

        <div className="agent-detail-header">
          <img src={agent.imageUrl} alt="" />
          <div>
            <span className="agent-category">{agent.category}</span>
            <h1>{agent.name}</h1>
            <p>{agent.summary}</p>
          </div>
        </div>

        <section className="content-block">
          <h2>O que o agente faz</h2>
          <p>{agent.description}</p>
        </section>

        <section className="content-block">
          <h2>Antes de começar</h2>
          <p>
            Separe os documentos solicitados pelo agente e confira todas as
            informações antes de utilizar o planejamento produzido.
          </p>
        </section>

        <section className="content-block">
          <h2>Tutorial passo a passo</h2>
          <ol className="steps">
            <li>Acesse o agente e inicie uma nova conversa.</li>
            <li>Pergunte quais documentos precisam ser anexados.</li>
            <li>Anexe os documentos e responda às perguntas apresentadas.</li>
            <li>Confira os dados extraídos e aprove ou solicite correções.</li>
            <li>Revise o resultado antes de utilizá-lo.</li>
          </ol>
        </section>

        <section className="video-placeholder">
          <PlayCircle size={42} />
          <div>
            <h2>Vídeo de apresentação</h2>
            <p>O vídeo será exibido aqui quando for cadastrado pelo administrador.</p>
          </div>
        </section>

        <section className="access-box">
          <LockKeyhole size={34} />
          <div>
            <h2>Acesso exclusivo para membros autorizados</h2>
            <p>
              Você pode consultar as informações do agente, mas o link ainda não
              foi liberado para esta conta.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
