import { BookOpenCheck, Clock3, FileText, ShieldCheck } from "lucide-react";
import { AgentCard } from "../components/AgentCard";
import { agents } from "../data";

export function HomePage() {
  return (
    <>
      <section className="hero">
        <img
          src="/banner-allconectados.png"
          alt="Rede digital Allconectados"
          className="hero-background"
        />
        <div className="hero-overlay" />
        <div className="container hero-content">
          <span className="eyebrow">Tecnologia aplicada à educação</span>
          <h1>Documentação pedagógica de forma prática, rápida e fácil</h1>
          <p>
            Conheça agentes GPT desenvolvidos para apoiar professores, consulte
            tutoriais e aprenda como utilizar cada ferramenta com segurança.
          </p>
          <a href="#agentes" className="button button-primary">
            Conhecer os agentes
          </a>
        </div>
      </section>

      <section className="section" id="agentes">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow purple">Agentes disponíveis</span>
            <h2>Ferramentas criadas para o trabalho docente</h2>
            <p>
              Consulte a apresentação de cada agente. O tutorial completo é
              disponibilizado após o login.
            </p>
          </div>

          <div className="agents-grid">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </div>
      </section>

      <section className="section section-soft" id="sobre">
        <div className="container">
          <div className="section-heading">
            <span className="eyebrow purple">Como funciona</span>
            <h2>Apoio para cada etapa do processo</h2>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <BookOpenCheck />
              <h3>Orientação didática</h3>
              <p>Explicações claras para professores com diferentes níveis de experiência.</p>
            </div>
            <div className="feature-card">
              <FileText />
              <h3>Documentação pedagógica</h3>
              <p>Agentes voltados à organização e produção de documentos escolares.</p>
            </div>
            <div className="feature-card">
              <Clock3 />
              <h3>Mais agilidade</h3>
              <p>Processos estruturados para reduzir tarefas repetitivas.</p>
            </div>
            <div className="feature-card">
              <ShieldCheck />
              <h3>Acesso controlado</h3>
              <p>O link de cada agente será exibido apenas aos usuários autorizados.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
