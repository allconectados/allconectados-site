import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Edit3,
  ExternalLink,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Plus,
  RefreshCcw,
  Save,
  ShieldAlert,
  Star,
  Trash2,
  UserCheck,
  UserX,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

type AgentStatus =
  | "draft"
  | "published"
  | "coming_soon"
  | "archived";

type AdminProfile = {
  full_name: string | null;
  role: "admin" | "professor";
  status: "active" | "suspended";
};

type AgentRow = {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  category: string | null;
  image_url: string | null;
  status: AgentStatus;
  featured: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

type AgentDetailsRow = {
  agent_id: string;
  what_it_does: string;
  before_start: string | null;
  tutorial_steps: unknown;
  youtube_url: string | null;
  youtube_title: string | null;
};

type AgentLinkConfig = {
  agent_id: string;
  gpt_url: string;
  access_enabled: boolean;
  updated_at: string;
};

type ProfessorRow = {
  id: string;
  email: string;
  full_name: string | null;
  status: "active" | "suspended";
};

type AccessGrantRow = {
  user_id: string;
  email: string;
  full_name: string | null;
  access_status: "active" | "revoked";
  granted_at: string;
  expires_at: string | null;
};

type FormState = {
  name: string;
  slug: string;
  shortDescription: string;
  category: string;
  imageUrl: string;
  status: AgentStatus;
  featured: boolean;
  displayOrder: string;
  whatItDoes: string;
  beforeStart: string;
  tutorialSteps: string;
  youtubeUrl: string;
  youtubeTitle: string;
  gptUrl: string;
  accessEnabled: boolean;
};

type Notice = {
  type: "success" | "error";
  text: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  slug: "",
  shortDescription: "",
  category: "",
  imageUrl: "",
  status: "draft",
  featured: false,
  displayOrder: "0",
  whatItDoes: "",
  beforeStart: "",
  tutorialSteps: "",
  youtubeUrl: "",
  youtubeTitle: "",
  gptUrl: "",
  accessEnabled: false,
};

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function optionalText(value: string): string | null {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error
  ) {
    return String(
      (error as { message: unknown }).message,
    );
  }

  return "Ocorreu um erro inesperado.";
}

function getTutorialSteps(value: unknown): string {
  if (!Array.isArray(value)) {
    return "";
  }

  return value
    .filter(
      (item): item is string =>
        typeof item === "string",
    )
    .join("\n");
}

function getFirstLinkConfig(
  value: unknown,
): AgentLinkConfig | null {
  if (Array.isArray(value)) {
    return value.length > 0
      ? (value[0] as AgentLinkConfig)
      : null;
  }

  if (value && typeof value === "object") {
    return value as AgentLinkConfig;
  }

  return null;
}

function statusLabel(status: AgentStatus): string {
  const labels: Record<AgentStatus, string> = {
    draft: "Rascunho",
    published: "Publicado",
    coming_soon: "Em breve",
    archived: "Arquivado",
  };

  return labels[status];
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

async function fetchAgents(): Promise<AgentRow[]> {
  const client = supabase;

  if (!client) {
    throw new Error(
      "A conexão com o Supabase não está configurada.",
    );
  }

  const { data, error } = await client
    .from("agents")
    .select(
      [
        "id",
        "name",
        "slug",
        "short_description",
        "category",
        "image_url",
        "status",
        "featured",
        "display_order",
        "created_at",
        "updated_at",
      ].join(","),
    )
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as AgentRow[];
}

export function AdminPage() {
  const [pageLoading, setPageLoading] =
    useState(true);
  const [authorized, setAuthorized] =
    useState(false);
  const [adminName, setAdminName] =
    useState("Administrador");

  const [agents, setAgents] = useState<AgentRow[]>(
    [],
  );
  const [listLoading, setListLoading] =
    useState(false);

  const [selectedAgentId, setSelectedAgentId] =
    useState<string | null>(null);
  const [form, setForm] =
    useState<FormState>(EMPTY_FORM);
  const [editorLoading, setEditorLoading] =
    useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingAgentId, setDeletingAgentId] =
    useState<string | null>(null);

  const [notice, setNotice] =
    useState<Notice | null>(null);

  const [accessAgent, setAccessAgent] =
    useState<AgentRow | null>(null);
  const [professors, setProfessors] = useState<
    ProfessorRow[]
  >([]);
  const [accessGrants, setAccessGrants] = useState<
    AccessGrantRow[]
  >([]);
  const [accessLinkConfig, setAccessLinkConfig] =
    useState<AgentLinkConfig | null>(null);
  const [accessLoading, setAccessLoading] =
    useState(false);
  const [accessBusyUserId, setAccessBusyUserId] =
    useState<string | null>(null);

  const editingAgent = useMemo(
    () =>
      agents.find(
        (agent) => agent.id === selectedAgentId,
      ) ?? null,
    [agents, selectedAgentId],
  );

  useEffect(() => {
    let componentIsActive = true;

    async function initializePage() {
      const client = supabase;

      if (!client) {
        if (componentIsActive) {
          setNotice({
            type: "error",
            text: "A conexão com o Supabase não está configurada.",
          });
          setPageLoading(false);
        }

        return;
      }

      try {
        const {
          data: sessionData,
          error: sessionError,
        } = await client.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        const user = sessionData.session?.user;

        if (!user) {
          if (componentIsActive) {
            setAuthorized(false);
            setPageLoading(false);
          }

          return;
        }

        const {
          data: profileData,
          error: profileError,
        } = await client
          .from("profiles")
          .select("full_name, role, status")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          throw profileError;
        }

        const profile =
          profileData as AdminProfile | null;

        const userIsAuthorized =
          profile?.role === "admin" &&
          profile.status === "active";

        if (!componentIsActive) {
          return;
        }

        setAuthorized(userIsAuthorized);

        if (!userIsAuthorized) {
          setPageLoading(false);
          return;
        }

        setAdminName(
          profile.full_name?.trim() ||
            user.email?.split("@")[0] ||
            "Administrador",
        );

        const agentRows = await fetchAgents();

        if (componentIsActive) {
          setAgents(agentRows);
        }
      } catch (error) {
        if (componentIsActive) {
          setNotice({
            type: "error",
            text: getErrorMessage(error),
          });
        }
      } finally {
        if (componentIsActive) {
          setPageLoading(false);
        }
      }
    }

    void initializePage();

    return () => {
      componentIsActive = false;
    };
  }, []);

  async function refreshAgents() {
    setListLoading(true);

    try {
      const rows = await fetchAgents();
      setAgents(rows);
    } catch (error) {
      setNotice({
        type: "error",
        text: getErrorMessage(error),
      });
    } finally {
      setListLoading(false);
    }
  }

  function resetEditor() {
    setSelectedAgentId(null);
    setForm(EMPTY_FORM);
    setNotice(null);
  }

  function handleNameChange(value: string) {
    setForm((current) => ({
      ...current,
      name: value,
      slug:
        selectedAgentId === null
          ? slugify(value)
          : current.slug,
    }));
  }

  async function editAgent(agent: AgentRow) {
    const client = supabase;

    if (!client) {
      return;
    }

    setEditorLoading(true);
    setNotice(null);

    try {
      const [detailsResult, linkResult] =
        await Promise.all([
          client
            .from("agent_details")
            .select(
              [
                "agent_id",
                "what_it_does",
                "before_start",
                "tutorial_steps",
                "youtube_url",
                "youtube_title",
              ].join(","),
            )
            .eq("agent_id", agent.id)
            .maybeSingle(),

          client.rpc(
            "admin_get_agent_link_config",
            {
              p_agent_id: agent.id,
            },
          ),
        ]);

      if (detailsResult.error) {
        throw detailsResult.error;
      }

      if (linkResult.error) {
        throw linkResult.error;
      }

      const details =
        detailsResult.data as AgentDetailsRow | null;

      const linkConfig = getFirstLinkConfig(
        linkResult.data,
      );

      setSelectedAgentId(agent.id);

      setForm({
        name: agent.name,
        slug: agent.slug,
        shortDescription:
          agent.short_description,
        category: agent.category ?? "",
        imageUrl: agent.image_url ?? "",
        status: agent.status,
        featured: agent.featured,
        displayOrder: String(agent.display_order),
        whatItDoes: details?.what_it_does ?? "",
        beforeStart: details?.before_start ?? "",
        tutorialSteps: getTutorialSteps(
          details?.tutorial_steps,
        ),
        youtubeUrl: details?.youtube_url ?? "",
        youtubeTitle:
          details?.youtube_title ?? "",
        gptUrl: linkConfig?.gpt_url ?? "",
        accessEnabled:
          linkConfig?.access_enabled ?? false,
      });

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      setNotice({
        type: "error",
        text: getErrorMessage(error),
      });
    } finally {
      setEditorLoading(false);
    }
  }

  async function handleSaveAgent(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const client = supabase;

    if (!client || saving) {
      return;
    }

    setNotice(null);

    const normalizedSlug = slugify(form.slug);

    if (!form.name.trim()) {
      setNotice({
        type: "error",
        text: "Informe o nome do agente.",
      });
      return;
    }

    if (!normalizedSlug) {
      setNotice({
        type: "error",
        text: "Informe um endereço interno válido para o agente.",
      });
      return;
    }

    if (!form.shortDescription.trim()) {
      setNotice({
        type: "error",
        text: "Informe a descrição resumida.",
      });
      return;
    }

    if (!form.whatItDoes.trim()) {
      setNotice({
        type: "error",
        text: 'Preencha o campo "O que o agente faz".',
      });
      return;
    }

    if (
      form.gptUrl.trim() &&
      !form.gptUrl.trim().startsWith("https://")
    ) {
      setNotice({
        type: "error",
        text: "O link do GPT deve começar com https://.",
      });
      return;
    }

    const displayOrder = Number.parseInt(
      form.displayOrder,
      10,
    );

    if (!Number.isFinite(displayOrder)) {
      setNotice({
        type: "error",
        text: "A ordem de exibição deve ser um número inteiro.",
      });
      return;
    }

    const tutorialSteps = form.tutorialSteps
      .split("\n")
      .map((step) => step.trim())
      .filter(Boolean);

    setSaving(true);

    let createdAgentId: string | null = null;

    try {
      const {
        data: sessionData,
        error: sessionError,
      } = await client.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      const userId =
        sessionData.session?.user.id;

      if (!userId) {
        throw new Error(
          "Sua sessão expirou. Entre novamente.",
        );
      }

      const agentPayload = {
        name: form.name.trim(),
        slug: normalizedSlug,
        short_description:
          form.shortDescription.trim(),
        category: optionalText(form.category),
        image_url: optionalText(form.imageUrl),
        status: form.status,
        featured: form.featured,
        display_order: displayOrder,
      };

      let agentId = selectedAgentId;

      if (agentId) {
        const { error } = await client
          .from("agents")
          .update(agentPayload)
          .eq("id", agentId);

        if (error) {
          throw error;
        }
      } else {
        const { data, error } = await client
          .from("agents")
          .insert({
            ...agentPayload,
            created_by: userId,
          })
          .select("id")
          .single();

        if (error) {
          throw error;
        }

        agentId = String(data.id);
        createdAgentId = agentId;
      }

      const { error: detailsError } =
        await client
          .from("agent_details")
          .upsert(
            {
              agent_id: agentId,
              what_it_does:
                form.whatItDoes.trim(),
              before_start: optionalText(
                form.beforeStart,
              ),
              tutorial_steps: tutorialSteps,
              youtube_url: optionalText(
                form.youtubeUrl,
              ),
              youtube_title: optionalText(
                form.youtubeTitle,
              ),
            },
            {
              onConflict: "agent_id",
            },
          );

      if (detailsError) {
        throw detailsError;
      }

      const normalizedGptUrl =
        form.gptUrl.trim();

      if (normalizedGptUrl) {
        const { error: linkError } =
          await client.rpc(
            "admin_set_agent_link",
            {
              p_agent_id: agentId,
              p_gpt_url: normalizedGptUrl,
              p_access_enabled:
                form.accessEnabled,
            },
          );

        if (linkError) {
          throw linkError;
        }
      } else if (selectedAgentId) {
        const { error: deleteLinkError } =
          await client.rpc(
            "admin_delete_agent_link",
            {
              p_agent_id: agentId,
            },
          );

        if (deleteLinkError) {
          throw deleteLinkError;
        }
      }

      await refreshAgents();

      setNotice({
        type: "success",
        text: selectedAgentId
          ? "Agente atualizado com sucesso."
          : "Agente cadastrado com sucesso.",
      });

      setSelectedAgentId(null);
      setForm(EMPTY_FORM);
    } catch (error) {
      /*
       * Se o cadastro do novo agente falhar depois
       * da primeira inserção, remove o registro
       * incompleto. As tabelas relacionadas usam
       * exclusão em cascata.
       */
      if (createdAgentId) {
        await client
          .from("agents")
          .delete()
          .eq("id", createdAgentId);
      }

      setNotice({
        type: "error",
        text: getErrorMessage(error),
      });
    } finally {
      setSaving(false);
    }
  }

  async function deleteAgent(agent: AgentRow) {
    const confirmed = window.confirm(
      `Excluir definitivamente o agente "${agent.name}"?\n\nOs detalhes, acessos e o link privado também serão removidos.`,
    );

    if (!confirmed) {
      return;
    }

    const client = supabase;

    if (!client) {
      return;
    }

    setDeletingAgentId(agent.id);
    setNotice(null);

    try {
      const { error } = await client
        .from("agents")
        .delete()
        .eq("id", agent.id);

      if (error) {
        throw error;
      }

      if (selectedAgentId === agent.id) {
        resetEditor();
      }

      if (accessAgent?.id === agent.id) {
        setAccessAgent(null);
      }

      await refreshAgents();

      setNotice({
        type: "success",
        text: "Agente excluído com sucesso.",
      });
    } catch (error) {
      setNotice({
        type: "error",
        text: getErrorMessage(error),
      });
    } finally {
      setDeletingAgentId(null);
    }
  }

  async function loadAccessManager(
    agent: AgentRow,
  ) {
    const client = supabase;

    if (!client) {
      return;
    }

    setAccessAgent(agent);
    setAccessLoading(true);
    setAccessGrants([]);
    setProfessors([]);
    setAccessLinkConfig(null);
    setNotice(null);

    try {
      const [
        professorsResult,
        grantsResult,
        linkResult,
      ] = await Promise.all([
        client
          .from("profiles")
          .select(
            "id, email, full_name, status",
          )
          .eq("role", "professor")
          .order("email", { ascending: true }),

        client.rpc(
          "admin_list_agent_access",
          {
            p_agent_id: agent.id,
          },
        ),

        client.rpc(
          "admin_get_agent_link_config",
          {
            p_agent_id: agent.id,
          },
        ),
      ]);

      if (professorsResult.error) {
        throw professorsResult.error;
      }

      if (grantsResult.error) {
        throw grantsResult.error;
      }

      if (linkResult.error) {
        throw linkResult.error;
      }

      setProfessors(
        (professorsResult.data ??
          []) as ProfessorRow[],
      );

      setAccessGrants(
        (grantsResult.data ??
          []) as AccessGrantRow[],
      );

      setAccessLinkConfig(
        getFirstLinkConfig(linkResult.data),
      );

      window.setTimeout(() => {
        document
          .getElementById("admin-access-manager")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }, 50);
    } catch (error) {
      setNotice({
        type: "error",
        text: getErrorMessage(error),
      });
    } finally {
      setAccessLoading(false);
    }
  }

  async function refreshAccessGrants(
    agentId: string,
  ) {
    const client = supabase;

    if (!client) {
      return;
    }

    const { data, error } = await client.rpc(
      "admin_list_agent_access",
      {
        p_agent_id: agentId,
      },
    );

    if (error) {
      throw error;
    }

    setAccessGrants(
      (data ?? []) as AccessGrantRow[],
    );
  }

  async function grantAccess(userId: string) {
    const client = supabase;

    if (
      !client ||
      !accessAgent ||
      accessBusyUserId
    ) {
      return;
    }

    setAccessBusyUserId(userId);
    setNotice(null);

    try {
      const { error } = await client.rpc(
        "admin_grant_agent_access",
        {
          p_agent_id: accessAgent.id,
          p_user_id: userId,
          p_expires_at: null,
        },
      );

      if (error) {
        throw error;
      }

      await refreshAccessGrants(accessAgent.id);

      setNotice({
        type: "success",
        text: "Acesso liberado para o professor.",
      });
    } catch (error) {
      setNotice({
        type: "error",
        text: getErrorMessage(error),
      });
    } finally {
      setAccessBusyUserId(null);
    }
  }

  async function revokeAccess(userId: string) {
    const client = supabase;

    if (
      !client ||
      !accessAgent ||
      accessBusyUserId
    ) {
      return;
    }

    setAccessBusyUserId(userId);
    setNotice(null);

    try {
      const { error } = await client.rpc(
        "admin_revoke_agent_access",
        {
          p_agent_id: accessAgent.id,
          p_user_id: userId,
        },
      );

      if (error) {
        throw error;
      }

      await refreshAccessGrants(accessAgent.id);

      setNotice({
        type: "success",
        text: "Acesso do professor revogado.",
      });
    } catch (error) {
      setNotice({
        type: "error",
        text: getErrorMessage(error),
      });
    } finally {
      setAccessBusyUserId(null);
    }
  }

  function activeGrantForUser(
    userId: string,
  ): AccessGrantRow | null {
    const grant =
      accessGrants.find(
        (item) => item.user_id === userId,
      ) ?? null;

    if (!grant || grant.access_status !== "active") {
      return null;
    }

    if (
      grant.expires_at &&
      new Date(grant.expires_at).getTime() <=
        Date.now()
    ) {
      return null;
    }

    return grant;
  }

  if (pageLoading) {
    return (
      <main className="admin-state-page">
        <LoaderCircle
          className="admin-spin"
          size={46}
        />
        <h1>Carregando área administrativa</h1>
      </main>
    );
  }

  if (!authorized) {
    return (
      <main className="admin-state-page">
        <ShieldAlert size={54} />
        <h1>Acesso não autorizado</h1>
        <p>
          Esta página é exclusiva para o
          administrador do Allconectados.
        </p>

        <Link className="button button-primary" to="/">
          <ArrowLeft size={18} />
          Voltar à página principal
        </Link>
      </main>
    );
  }

  return (
    <>
      <style>{`
        .admin-page {
          min-height: calc(100vh - 176px);
          padding: 48px 0 80px;
          background: var(--purple-050);
        }

        .admin-topbar {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 30px;
        }

        .admin-topbar h1 {
          margin: 8px 0 8px;
          color: var(--purple-900);
          font-size: clamp(2rem, 4vw, 3rem);
        }

        .admin-topbar p {
          margin: 0;
          color: var(--muted);
        }

        .admin-grid {
          display: grid;
          grid-template-columns:
            minmax(0, 1.15fr)
            minmax(340px, 0.85fr);
          gap: 26px;
          align-items: start;
        }

        .admin-panel {
          padding: 28px;
          border: 1px solid var(--border);
          border-radius: 22px;
          background: #fff;
          box-shadow:
            0 12px 34px rgba(52, 28, 83, 0.08);
        }

        .admin-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 24px;
        }

        .admin-panel-header h2 {
          margin: 0;
          color: var(--purple-900);
        }

        .admin-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }

        .admin-field {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .admin-field-full {
          grid-column: 1 / -1;
        }

        .admin-field label {
          color: var(--purple-900);
          font-size: 0.9rem;
          font-weight: 750;
        }

        .admin-field input,
        .admin-field select,
        .admin-field textarea {
          width: 100%;
          padding: 12px 13px;
          color: var(--text);
          font: inherit;
          border: 1px solid var(--border);
          border-radius: 11px;
          background: #fff;
          outline: none;
        }

        .admin-field textarea {
          min-height: 112px;
          resize: vertical;
          line-height: 1.55;
        }

        .admin-field input:focus,
        .admin-field select:focus,
        .admin-field textarea:focus {
          border-color: var(--purple-600);
          box-shadow:
            0 0 0 3px rgba(116, 55, 167, 0.12);
        }

        .admin-help {
          color: var(--muted);
          font-size: 0.78rem;
          line-height: 1.45;
        }

        .admin-checkbox {
          display: flex;
          align-items: center;
          gap: 10px;
          min-height: 46px;
          padding: 10px 12px;
          border: 1px solid var(--border);
          border-radius: 11px;
          background: var(--purple-050);
        }

        .admin-checkbox input {
          width: 18px;
          height: 18px;
        }

        .admin-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 24px;
        }

        .admin-notice {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 22px;
          padding: 14px 16px;
          border-radius: 12px;
          line-height: 1.5;
        }

        .admin-notice-success {
          color: #1e603e;
          border: 1px solid #b9dec9;
          background: #edf9f2;
        }

        .admin-notice-error {
          color: #8a2931;
          border: 1px solid #e9bcc0;
          background: #fff1f2;
        }

        .admin-agent-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .admin-agent-card {
          display: grid;
          grid-template-columns: 72px 1fr;
          gap: 15px;
          padding: 15px;
          border: 1px solid var(--border);
          border-radius: 16px;
          background: #fff;
        }

        .admin-agent-card img,
        .admin-agent-placeholder {
          width: 72px;
          height: 72px;
          border-radius: 14px;
          object-fit: cover;
          background: var(--purple-100);
        }

        .admin-agent-placeholder {
          display: grid;
          place-items: center;
          color: var(--purple-700);
        }

        .admin-agent-card h3 {
          margin: 0 0 6px;
          color: var(--purple-900);
          font-size: 1rem;
        }

        .admin-agent-card p {
          margin: 0;
          color: var(--muted);
          font-size: 0.83rem;
          line-height: 1.45;
        }

        .admin-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin: 10px 0;
        }

        .admin-badge {
          padding: 5px 8px;
          border-radius: 999px;
          color: var(--purple-700);
          background: var(--purple-100);
          font-size: 0.7rem;
          font-weight: 800;
        }

        .admin-card-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .admin-small-button {
          border: 1px solid var(--border);
          border-radius: 9px;
          padding: 8px 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          color: var(--purple-700);
          background: #fff;
          font: inherit;
          font-size: 0.76rem;
          font-weight: 750;
          cursor: pointer;
        }

        .admin-small-button-danger {
          color: #a22835;
        }

        .admin-access-panel {
          margin-top: 26px;
        }

        .admin-access-warning {
          margin-bottom: 20px;
          padding: 14px 16px;
          border: 1px solid #ead9b5;
          border-radius: 12px;
          color: #73571e;
          background: #fffaf0;
          line-height: 1.5;
        }

        .admin-professor-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .admin-professor-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding: 14px;
          border: 1px solid var(--border);
          border-radius: 13px;
        }

        .admin-professor-row strong {
          display: block;
          color: var(--purple-900);
        }

        .admin-professor-row small {
          color: var(--muted);
        }

        .admin-state-page {
          min-height: calc(100vh - 176px);
          padding: 70px 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          text-align: center;
          color: var(--purple-900);
          background: var(--purple-050);
        }

        .admin-state-page p {
          max-width: 560px;
          margin: 0 0 24px;
          color: var(--muted);
          line-height: 1.65;
        }

        .admin-spin {
          animation: admin-spin 1s linear infinite;
        }

        @keyframes admin-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 920px) {
          .admin-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 650px) {
          .admin-topbar,
          .admin-professor-row {
            align-items: stretch;
            flex-direction: column;
          }

          .admin-form-grid {
            grid-template-columns: 1fr;
          }

          .admin-field-full {
            grid-column: auto;
          }

          .admin-panel {
            padding: 20px;
          }
        }
      `}</style>

      <main className="admin-page">
        <div className="container">
          <div className="admin-topbar">
            <div>
              <Link className="back-link" to="/">
                <ArrowLeft size={18} />
                Voltar ao site
              </Link>

              <h1>Área administrativa</h1>

              <p>
                Olá, {adminName}. Cadastre os agentes
                e controle os acessos dos professores.
              </p>
            </div>

            <button
              type="button"
              className="button button-outline"
              onClick={refreshAgents}
              disabled={listLoading}
            >
              <RefreshCcw
                size={18}
                className={
                  listLoading ? "admin-spin" : ""
                }
              />
              Atualizar
            </button>
          </div>

          {notice && (
            <div
              className={`admin-notice ${
                notice.type === "success"
                  ? "admin-notice-success"
                  : "admin-notice-error"
              }`}
            >
              {notice.type === "success" ? (
                <CheckCircle2 size={20} />
              ) : (
                <ShieldAlert size={20} />
              )}

              <span>{notice.text}</span>
            </div>
          )}

          <div className="admin-grid">
            <section className="admin-panel">
              <div className="admin-panel-header">
                <h2>
                  {selectedAgentId
                    ? "Editar agente"
                    : "Cadastrar agente"}
                </h2>

                {selectedAgentId && (
                  <button
                    type="button"
                    className="admin-small-button"
                    onClick={resetEditor}
                  >
                    <X size={16} />
                    Cancelar edição
                  </button>
                )}
              </div>

              {editorLoading ? (
                <div className="admin-state-page">
                  <LoaderCircle
                    className="admin-spin"
                    size={36}
                  />
                  <p>Carregando o agente...</p>
                </div>
              ) : (
                <form onSubmit={handleSaveAgent}>
                  <div className="admin-form-grid">
                    <div className="admin-field">
                      <label htmlFor="agent-name">
                        Nome do agente *
                      </label>

                      <input
                        id="agent-name"
                        value={form.name}
                        onChange={(event) =>
                          handleNameChange(
                            event.target.value,
                          )
                        }
                        placeholder="Ex.: GPT — Planejamento Pedagógico Bimestral"
                      />
                    </div>

                    <div className="admin-field">
                      <label htmlFor="agent-slug">
                        Endereço interno *
                      </label>

                      <input
                        id="agent-slug"
                        value={form.slug}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            slug: slugify(
                              event.target.value,
                            ),
                          }))
                        }
                        placeholder="planejamento-pedagogico-bimestral"
                      />

                      <span className="admin-help">
                        Será usado no endereço da página do
                        agente.
                      </span>
                    </div>

                    <div className="admin-field admin-field-full">
                      <label htmlFor="short-description">
                        Descrição resumida *
                      </label>

                      <textarea
                        id="short-description"
                        value={form.shortDescription}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            shortDescription:
                              event.target.value,
                          }))
                        }
                        placeholder="Resumo exibido no cartão e no início da página."
                      />
                    </div>

                    <div className="admin-field">
                      <label htmlFor="agent-category">
                        Categoria
                      </label>

                      <input
                        id="agent-category"
                        value={form.category}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            category:
                              event.target.value,
                          }))
                        }
                        placeholder="Ex.: Planejamento docente"
                      />
                    </div>

                    <div className="admin-field">
                      <label htmlFor="agent-image">
                        URL da imagem
                      </label>

                      <input
                        id="agent-image"
                        type="url"
                        value={form.imageUrl}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            imageUrl:
                              event.target.value,
                          }))
                        }
                        placeholder="https://..."
                      />

                      <span className="admin-help">
                        Use uma URL pública e direta para a
                        imagem.
                      </span>
                    </div>

                    <div className="admin-field">
                      <label htmlFor="agent-status">
                        Situação
                      </label>

                      <select
                        id="agent-status"
                        value={form.status}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            status:
                              event.target
                                .value as AgentStatus,
                          }))
                        }
                      >
                        <option value="draft">
                          Rascunho
                        </option>
                        <option value="published">
                          Publicado
                        </option>
                        <option value="coming_soon">
                          Em breve
                        </option>
                        <option value="archived">
                          Arquivado
                        </option>
                      </select>
                    </div>

                    <div className="admin-field">
                      <label htmlFor="display-order">
                        Ordem de exibição
                      </label>

                      <input
                        id="display-order"
                        type="number"
                        step="1"
                        value={form.displayOrder}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            displayOrder:
                              event.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="admin-field admin-field-full">
                      <label className="admin-checkbox">
                        <input
                          type="checkbox"
                          checked={form.featured}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              featured:
                                event.target.checked,
                            }))
                          }
                        />

                        <span>
                          Destacar este agente na página
                          principal
                        </span>
                      </label>
                    </div>

                    <div className="admin-field admin-field-full">
                      <label htmlFor="what-it-does">
                        O que o agente faz *
                      </label>

                      <textarea
                        id="what-it-does"
                        value={form.whatItDoes}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            whatItDoes:
                              event.target.value,
                          }))
                        }
                        placeholder="Explique claramente a finalidade do agente."
                      />
                    </div>

                    <div className="admin-field admin-field-full">
                      <label htmlFor="before-start">
                        Antes de começar
                      </label>

                      <textarea
                        id="before-start"
                        value={form.beforeStart}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            beforeStart:
                              event.target.value,
                          }))
                        }
                        placeholder="Informe documentos, cuidados e preparações necessárias."
                      />
                    </div>

                    <div className="admin-field admin-field-full">
                      <label htmlFor="tutorial-steps">
                        Tutorial passo a passo
                      </label>

                      <textarea
                        id="tutorial-steps"
                        value={form.tutorialSteps}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            tutorialSteps:
                              event.target.value,
                          }))
                        }
                        placeholder={
                          "Escreva uma etapa por linha.\nExemplo:\nAbra o agente.\nPergunte quais documentos devem ser anexados.\nAnexe os documentos solicitados."
                        }
                      />

                      <span className="admin-help">
                        Cada linha será transformada em uma
                        etapa numerada.
                      </span>
                    </div>

                    <div className="admin-field">
                      <label htmlFor="youtube-url">
                        URL do vídeo do YouTube
                      </label>

                      <input
                        id="youtube-url"
                        type="url"
                        value={form.youtubeUrl}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            youtubeUrl:
                              event.target.value,
                          }))
                        }
                        placeholder="https://www.youtube.com/watch?v=..."
                      />
                    </div>

                    <div className="admin-field">
                      <label htmlFor="youtube-title">
                        Título do vídeo
                      </label>

                      <input
                        id="youtube-title"
                        value={form.youtubeTitle}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            youtubeTitle:
                              event.target.value,
                          }))
                        }
                        placeholder="Tutorial completo do agente"
                      />
                    </div>

                    <div className="admin-field admin-field-full">
                      <label htmlFor="gpt-url">
                        Link privado do agente GPT
                      </label>

                      <input
                        id="gpt-url"
                        type="url"
                        value={form.gptUrl}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            gptUrl:
                              event.target.value,
                          }))
                        }
                        placeholder="https://chatgpt.com/g/..."
                      />

                      <span className="admin-help">
                        O endereço será armazenado no esquema
                        privado e não ficará disponível
                        diretamente pela API.
                      </span>
                    </div>

                    <div className="admin-field admin-field-full">
                      <label className="admin-checkbox">
                        <input
                          type="checkbox"
                          checked={form.accessEnabled}
                          disabled={!form.gptUrl.trim()}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              accessEnabled:
                                event.target.checked,
                            }))
                          }
                        />

                        <span>
                          Ativar globalmente a liberação do
                          link deste agente
                        </span>
                      </label>

                      <span className="admin-help">
                        Mesmo ativado, o link só será entregue
                        aos professores que receberem uma
                        liberação individual.
                      </span>
                    </div>
                  </div>

                  <div className="admin-actions">
                    <button
                      type="submit"
                      className="button button-primary"
                      disabled={saving}
                    >
                      {saving ? (
                        <LoaderCircle
                          className="admin-spin"
                          size={18}
                        />
                      ) : (
                        <Save size={18} />
                      )}

                      {selectedAgentId
                        ? "Salvar alterações"
                        : "Cadastrar agente"}
                    </button>

                    {selectedAgentId && (
                      <button
                        type="button"
                        className="button button-outline"
                        onClick={resetEditor}
                        disabled={saving}
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              )}
            </section>

            <section className="admin-panel">
              <div className="admin-panel-header">
                <h2>Agentes cadastrados</h2>

                <span className="admin-badge">
                  {agents.length} agente
                  {agents.length === 1 ? "" : "s"}
                </span>
              </div>

              {listLoading ? (
                <div className="admin-state-page">
                  <LoaderCircle
                    className="admin-spin"
                    size={34}
                  />
                  <p>Atualizando agentes...</p>
                </div>
              ) : agents.length === 0 ? (
                <div className="admin-state-page">
                  <Plus size={40} />
                  <h3>Nenhum agente cadastrado</h3>
                  <p>
                    Utilize o formulário para cadastrar o
                    primeiro agente.
                  </p>
                </div>
              ) : (
                <div className="admin-agent-list">
                  {agents.map((agent) => (
                    <article
                      className="admin-agent-card"
                      key={agent.id}
                    >
                      {agent.image_url ? (
                        <img
                          src={agent.image_url}
                          alt=""
                        />
                      ) : (
                        <div className="admin-agent-placeholder">
                          <LockKeyhole size={26} />
                        </div>
                      )}

                      <div>
                        <h3>{agent.name}</h3>

                        <p>
                          Atualizado em{" "}
                          {formatDate(agent.updated_at)}
                        </p>

                        <div className="admin-badges">
                          <span className="admin-badge">
                            {statusLabel(agent.status)}
                          </span>

                          {agent.featured && (
                            <span className="admin-badge">
                              <Star size={11} />
                              Destaque
                            </span>
                          )}
                        </div>

                        <div className="admin-card-actions">
                          <button
                            type="button"
                            className="admin-small-button"
                            onClick={() =>
                              void editAgent(agent)
                            }
                          >
                            <Edit3 size={15} />
                            Editar
                          </button>

                          <button
                            type="button"
                            className="admin-small-button"
                            onClick={() =>
                              void loadAccessManager(
                                agent,
                              )
                            }
                          >
                            <KeyRound size={15} />
                            Acessos
                          </button>

                          <Link
                            className="admin-small-button"
                            to={`/agentes/${agent.slug}`}
                            target="_blank"
                          >
                            <ExternalLink size={15} />
                            Ver página
                          </Link>

                          <button
                            type="button"
                            className="admin-small-button admin-small-button-danger"
                            onClick={() =>
                              void deleteAgent(agent)
                            }
                            disabled={
                              deletingAgentId ===
                              agent.id
                            }
                          >
                            {deletingAgentId ===
                            agent.id ? (
                              <LoaderCircle
                                className="admin-spin"
                                size={15}
                              />
                            ) : (
                              <Trash2 size={15} />
                            )}

                            Excluir
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>

          {accessAgent && (
            <section
              id="admin-access-manager"
              className="admin-panel admin-access-panel"
            >
              <div className="admin-panel-header">
                <div>
                  <h2>Liberação de acessos</h2>
                  <p>
                    Agente: <strong>{accessAgent.name}</strong>
                  </p>
                </div>

                <button
                  type="button"
                  className="admin-small-button"
                  onClick={() =>
                    setAccessAgent(null)
                  }
                >
                  <X size={16} />
                  Fechar
                </button>
              </div>

              {!accessLinkConfig?.gpt_url && (
                <div className="admin-access-warning">
                  Este agente ainda não possui um link
                  privado cadastrado. Edite o agente e
                  informe o endereço do GPT antes de liberar
                  usuários.
                </div>
              )}

              {accessLinkConfig?.gpt_url &&
                !accessLinkConfig.access_enabled && (
                  <div className="admin-access-warning">
                    O link privado está cadastrado, mas a
                    liberação global está desativada. Edite
                    o agente e marque a opção de ativação
                    antes de liberar professores.
                  </div>
                )}

              {accessLoading ? (
                <div className="admin-state-page">
                  <LoaderCircle
                    className="admin-spin"
                    size={36}
                  />
                  <p>Carregando professores...</p>
                </div>
              ) : professors.length === 0 ? (
                <p>
                  Ainda não existem professores cadastrados
                  no sistema.
                </p>
              ) : (
                <div className="admin-professor-list">
                  {professors.map((professor) => {
                    const activeGrant =
                      activeGrantForUser(professor.id);

                    const userIsBusy =
                      accessBusyUserId === professor.id;

                    return (
                      <div
                        className="admin-professor-row"
                        key={professor.id}
                      >
                        <div>
                          <strong>
                            {professor.full_name?.trim() ||
                              professor.email}
                          </strong>

                          <small>
                            {professor.email}
                            {professor.status ===
                              "suspended" &&
                              " — conta suspensa"}
                          </small>
                        </div>

                        {activeGrant ? (
                          <button
                            type="button"
                            className="admin-small-button admin-small-button-danger"
                            onClick={() =>
                              void revokeAccess(
                                professor.id,
                              )
                            }
                            disabled={userIsBusy}
                          >
                            {userIsBusy ? (
                              <LoaderCircle
                                className="admin-spin"
                                size={16}
                              />
                            ) : (
                              <UserX size={16} />
                            )}

                            Revogar acesso
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="admin-small-button"
                            onClick={() =>
                              void grantAccess(
                                professor.id,
                              )
                            }
                            disabled={
                              userIsBusy ||
                              professor.status ===
                                "suspended" ||
                              !accessLinkConfig
                                ?.access_enabled
                            }
                          >
                            {userIsBusy ? (
                              <LoaderCircle
                                className="admin-spin"
                                size={16}
                              />
                            ) : (
                              <UserCheck size={16} />
                            )}

                            Liberar acesso
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </>
  );
}
