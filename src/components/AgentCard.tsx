import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { Agent } from "../types";

export function AgentCard({ agent }: { agent: Agent }) {
  return (
    <article className="agent-card">
      <Link to={`/agentes/${agent.slug}`} className="agent-image-link">
        <img src={agent.imageUrl} alt="" className="agent-image" />
      </Link>

      <div className="agent-card-content">
        <span className="agent-category">{agent.category}</span>
        <h3>
          <Link to={`/agentes/${agent.slug}`}>{agent.name}</Link>
        </h3>
        <p>{agent.summary}</p>
        <Link className="agent-link" to={`/agentes/${agent.slug}`}>
          Conhecer o agente
          <ArrowRight size={18} />
        </Link>
      </div>
    </article>
  );
}
