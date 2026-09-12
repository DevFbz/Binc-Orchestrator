"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Activity, ArrowUpRight, Bot, Camera, FileText, FolderKanban, LayoutDashboard, ListChecks, MoreHorizontal, Search, Settings2, ShieldCheck, Sparkles, WalletCards, Workflow } from "lucide-react";
import MobileNav from "@/components/MobileNav";
import styles from "./page.module.css";

type Section = "overview" | "projects" | "tasks" | "automations" | "governance" | "reports" | "docs" | "terminal";
type Project = { project_id: string; name: string; description?: string; status: string; capabilities?: string[]; service?: string; port?: number };
type Job = { job_id: string; project_id: string; tenant_id?: string; name: string; status: string; schedule: string; next_action: string; approval_required: boolean };
type AuditEvent = { timestamp?: string; actor_id?: string; project_id?: string; action?: string; result?: string };
type Health = { service: string; status: string };
type ControlPlaneData = { overview?: { totals?: { tenants?: number; campaigns?: number; published?: number } }; projects?: { projects?: Project[] }; jobs?: { jobs?: Job[]; summary?: { total: number; active: number; paused: number; approval_required: number } }; health?: { services?: Health[]; summary?: { total: number; operational: number; degraded: number; failed: number } }; audit?: { events?: AuditEvent[] }; report?: { period?: { start: string; end: string }; sources?: string[]; limitations?: string[] }; onboarding?: { workspaces?: { workspace_id: string; name: string; checklist?: { complete: boolean; missing: string[] } }[] }; metrics?: { metrics?: Record<string, number> }; telegramEvents?: { events?: { occurred_at?: string; direction?: string; text?: string; delivery_status?: string; external_user_ref?: string }[] } };

const navItems: { id: Section; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Visão geral", icon: LayoutDashboard },
  { id: "projects", label: "Projetos", icon: FolderKanban },
  { id: "tasks", label: "Tarefas", icon: ListChecks },
  { id: "automations", label: "Automações", icon: Workflow },
  { id: "governance", label: "Governança", icon: ShieldCheck },
  { id: "reports", label: "Relatórios", icon: FileText },
  { id: "docs", label: "Documentação", icon: FileText },
  { id: "terminal", label: "Terminal Telegram", icon: Bot },
];

const projectCatalog = [
  { id: "instagram-content-operations", color: "green", icon: Camera },
  { id: "cofrinia-finance", color: "amber", icon: WalletCards },
];

const titles: Record<Section, [string, string]> = {
  overview: ["Bom dia, Breno", "Aqui está o resumo real da sua operação."],
  projects: ["Projetos", "Módulos ativos e suas fronteiras operacionais."],
  tasks: ["Tarefas", "Jobs, estados e próximas ações do control plane."],
  automations: ["Automações", "Execuções governadas por agenda, aprovação e estado real."],
  governance: ["Governança", "Workspaces, permissões e configuração por cliente."],
  reports: ["Relatórios", "Leituras consolidadas com fontes e limitações declaradas."],
  docs: ["Documentação", "PRDs, auditorias e runbooks do Binc Orchestrator."],
  terminal: ["Terminal Telegram", "Mensagens e operações administrativas através do Hermes."],
};

function statusLabel(status: string) { return ({ operational: "Operacional", active: "Ativo", paused: "Pausado", degraded: "Atenção", failed: "Falhou", preparation: "Em preparação" } as Record<string, string>)[status] ?? status; }
function formatTime(value?: string) { return value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "—"; }
function mask(value?: string) { if (!value) return "usuário não identificado"; return value.length > 4 ? `${value.slice(0, 2)}••••${value.slice(-2)}` : "••••"; }

export default function Home() {
  const [activeSection, setActiveSection] = useState<Section>(() => {
    if (typeof window === "undefined") return "overview";
    const hash = window.location.hash.replace("#", "") as Section;
    return navItems.some((item) => item.id === hash) ? hash : "overview";
  });
  const [controlPlane, setControlPlane] = useState<"checking" | "connected" | "unavailable">("checking");
  const [remoteData, setRemoteData] = useState<ControlPlaneData | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [projectMessage, setProjectMessage] = useState("");

  useEffect(() => {
    const onHash = () => { const next = window.location.hash.replace("#", "") as Section; if (navItems.some((item) => item.id === next)) setActiveSection(next); };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetch("/api/control-plane", { cache: "no-store" }).then(async (response) => { if (!response.ok) throw new Error(); setRemoteData(await response.json()); setControlPlane("connected"); }).catch(() => setControlPlane("unavailable"));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const closePopovers = (event: KeyboardEvent | PointerEvent) => {
      if (event instanceof KeyboardEvent && event.key !== "Escape") return;
      if (event instanceof PointerEvent && (event.target as Element)?.closest("[data-popover-anchor], [data-floating-popover]")) return;
      setSearchOpen(false); setNotificationsOpen(false); setProfileOpen(false);
    };
    document.addEventListener("keydown", closePopovers);
    document.addEventListener("pointerdown", closePopovers);
    return () => { document.removeEventListener("keydown", closePopovers); document.removeEventListener("pointerdown", closePopovers); };
  }, []);

  const projects = remoteData?.projects?.projects ?? [];
  const jobs = remoteData?.jobs?.jobs ?? [];
  const audit = remoteData?.audit?.events ?? [];
  const health = remoteData?.health?.services ?? [];
  const events = remoteData?.telegramEvents?.events ?? [];
  const filteredProjects = (() => { const query = searchTerm.trim().toLocaleLowerCase("pt-BR"); return query ? projects.filter((project) => `${project.name} ${project.description ?? ""}`.toLocaleLowerCase("pt-BR").includes(query)) : projects; })();
  const totals = remoteData?.overview?.totals;

  function selectSection(section: Section) { setActiveSection(section); setSearchOpen(false); setNotificationsOpen(false); setProfileOpen(false); window.history.replaceState(null, "", section === "overview" ? "/" : `/#${section}`); }
  async function toggleProject(project: Project) {
    const nextStatus = project.status === "disabled" ? "operational" : "disabled";
    if (!window.confirm(`Confirma ${nextStatus === "disabled" ? "desativar" : "ativar"} o projeto “${project.name}”?`)) return;
    setProjectMessage("Atualizando projeto…");
    const response = await fetch("/api/control-plane", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "project_status", project_id: project.project_id, status: nextStatus, confirm: true }) });
    const payload = await response.json().catch(() => ({}));
    setProjectMessage(response.ok ? `Projeto ${nextStatus === "disabled" ? "desativado" : "ativado"} e auditado.` : payload.error || "Não foi possível atualizar o projeto.");
    if (response.ok) { const refreshed = await fetch("/api/control-plane", { cache: "no-store" }); if (refreshed.ok) setRemoteData(await refreshed.json()); }
  }

  function sectionStatus() { return controlPlane === "connected" ? "Control plane conectado" : controlPlane === "checking" ? "Verificando conexão…" : "Control plane indisponível"; }

  function projectRows() { return <div className={styles.projectList}>{filteredProjects.length ? filteredProjects.map((project) => { const visual = projectCatalog.find((item) => item.id === project.project_id) ?? { color: "amber", icon: Settings2 }; const Icon = visual.icon; return <article className={styles.project} key={project.project_id}><div className={`${styles.projectIcon} ${styles[visual.color]}`}><Icon size={18} /></div><div className={styles.projectInfo}><strong>{project.name}</strong><small>{project.description ?? "Módulo Binc"}</small><p>{project.capabilities?.join(" · ") ?? "Sem capacidades informadas"}</p></div><span className={`${styles.status} ${styles[visual.color]}`}><i /> {statusLabel(project.status)}</span><button className={styles.projectAction} onClick={() => toggleProject(project)}>{project.status === "disabled" ? "Ativar" : "Desativar"}</button></article>; }) : <p className={styles.emptyState}>Nenhum projeto encontrado.</p>}</div>; }
  function jobRows() { return <div className={styles.sectionList}>{jobs.length ? jobs.map((job) => <article className={styles.sectionRow} key={job.job_id}><div><strong>{job.name}</strong><small>{job.project_id}{job.tenant_id ? ` · ${job.tenant_id}` : ""}</small></div><span className={`${styles.status} ${job.status === "active" ? styles.green : styles.amber}`}><i /> {statusLabel(job.status)}</span><p>{job.schedule} · {job.next_action}</p></article>) : <p className={styles.emptyState}>Nenhum job registrado.</p>}</div>; }
  function auditRows() { return <div className={styles.sectionList}>{audit.length ? audit.slice(-8).reverse().map((item, index) => <article className={styles.sectionRow} key={`${item.timestamp}-${index}`}><div><strong>{item.action ?? "Evento operacional"}</strong><small>{item.project_id ?? "sem projeto"} · {item.actor_id ?? "ator não informado"}</small></div><span className={styles.auditResult}>{item.result ?? "sem resultado"}</span><p>{formatTime(item.timestamp)}</p></article>) : <p className={styles.emptyState}>Nenhuma atividade real registrada.</p>}</div>; }

  function renderOverview() { return <>
    <div className={styles.banner}><div className={styles.bannerIcon}><Bot size={20} /></div><div><strong>Binc OS está monitorando sua operação</strong><p>{sectionStatus()}</p></div><span className={`${styles.live} ${controlPlane !== "connected" ? styles.liveWarning : ""}`}><i /> {controlPlane === "connected" ? "LIVE" : "ATENÇÃO"}</span></div>
    <section className={styles.kpis}><article><small>PROJETOS ATIVOS</small><strong>{remoteData ? projects.length : "—"}</strong><span className={styles.positive}>Catálogo real</span></article><article><small>CAMPANHAS</small><strong>{remoteData ? totals?.campaigns ?? 0 : "—"}</strong><span>Histórico sincronizado</span></article><article><small>PUBLICAÇÕES</small><strong>{remoteData ? totals?.published ?? 0 : "—"}</strong><span>Aprovadas e registradas</span></article><article><small>SERVIÇOS</small><strong>{remoteData ? `${health.filter((item) => item.status === "operational").length}/${health.length}` : "—"}</strong><span className={health.every((item) => item.status === "operational") && health.length ? styles.positive : styles.warning}>{health.length ? "Saúde operacional" : "Sem leitura"}</span></article></section>
    <div className={styles.grid}><section className={styles.panel}><div className={styles.panelHeader}><div><p className={styles.sectionKicker}>ECOSSISTEMA</p><h2>Seus projetos</h2></div><button className={styles.textButton} onClick={() => selectSection("projects")}>Ver todos <ArrowUpRight size={13} /></button></div>{projectRows()}</section><section className={styles.panel}><div className={styles.panelHeader}><div><p className={styles.sectionKicker}>ORQUESTRAÇÃO</p><h2>Jobs atuais</h2></div><button className={styles.textButton} onClick={() => selectSection("automations")}>Ver agenda <ArrowUpRight size={13} /></button></div>{jobRows()}</section></div>
    <section className={styles.panel}><div className={styles.panelHeader}><div><p className={styles.sectionKicker}>AUDITORIA</p><h2>Atividade recente</h2></div><Link className={styles.textButton} href="/history">Abrir histórico <ArrowUpRight size={13} /></Link></div>{auditRows()}</section>
  </>; }

  function renderSection() {
    if (activeSection === "overview") return renderOverview();
    if (activeSection === "projects") return <section className={styles.sectionView}><div className={styles.sectionHeader}><div><p className={styles.sectionKicker}>CATÁLOGO REAL</p><h2>Projetos operacionais</h2></div><span>{projects.length} projeto(s)</span></div>{projectRows()}</section>;
    if (activeSection === "tasks" || activeSection === "automations") return <section className={styles.sectionView}><div className={styles.sectionHeader}><div><p className={styles.sectionKicker}>{activeSection === "tasks" ? "EXECUÇÃO" : "AUTOMAÇÕES"}</p><h2>{activeSection === "tasks" ? "Tarefas do control plane" : "Automações configuradas"}</h2></div><span>{jobs.length} job(s)</span></div>{jobRows()}</section>;
    if (activeSection === "governance") return <section className={styles.sectionView}><div className={styles.sectionHeader}><div><p className={styles.sectionKicker}>WORKSPACES</p><h2>Governança e onboarding</h2></div><span>{remoteData?.onboarding?.workspaces?.length ?? 0} workspace(s)</span></div><div className={styles.sectionList}>{(remoteData?.onboarding?.workspaces ?? []).map((workspace) => <article className={styles.sectionRow} key={workspace.workspace_id}><div><strong>{workspace.name}</strong><small>{workspace.workspace_id}</small></div><span className={workspace.checklist?.complete ? styles.complete : styles.auditResult}>{workspace.checklist?.complete ? "Completo" : "Pendente"}</span><p>{workspace.checklist?.complete ? "Configuração validada." : `Pendências: ${workspace.checklist?.missing.join(", ") || "não informado"}`}</p></article>)}</div></section>;
    if (activeSection === "reports") return <section className={styles.sectionView}><div className={styles.sectionHeader}><div><p className={styles.sectionKicker}>FONTE DECLARADA</p><h2>Relatório executivo</h2></div><Link href="/reports" className={styles.textButton}>Abrir relatório <ArrowUpRight size={13} /></Link></div><div className={styles.kpis}><article><small>PERÍODO</small><strong className={styles.compact}>{remoteData?.report?.period ? `${remoteData.report.period.start} → ${remoteData.report.period.end}` : "—"}</strong></article><article><small>EVENTOS</small><strong>{remoteData?.metrics?.metrics?.events_total ?? "—"}</strong></article><article><small>FALHAS</small><strong className={(remoteData?.metrics?.metrics?.delivery_failures ?? 0) === 0 ? styles.green : styles.red}>{remoteData?.metrics?.metrics?.delivery_failures ?? "—"}</strong></article></div><p className={styles.sectionNote}>Fontes: {remoteData?.report?.sources?.join(" · ") ?? "aguardando control plane"}</p></section>;
    if (activeSection === "docs") return <section className={styles.sectionView}><div className={styles.sectionHeader}><div><p className={styles.sectionKicker}>REFERÊNCIAS</p><h2>Documentação operacional</h2></div><Link href="/docs" className={styles.textButton}>Ver documentos <ArrowUpRight size={13} /></Link></div><div className={styles.sectionList}>{["PRD Binc OS UX e Sprints", "PRD Terminal Administrativo", "Threat Model", "Runbook Operacional"].map((name) => <article className={styles.sectionRow} key={name}><div><strong>{name}</strong><small>Documento versionado no Binc Orchestrator</small></div><span className={styles.auditResult}>Disponível</span></article>)}</div></section>;
    return <section className={styles.sectionView}><div className={styles.sectionHeader}><div><p className={styles.sectionKicker}>TELEGRAM · INSTAGRAM</p><h2>Terminal de conversas</h2></div><Link href="/terminal" className={styles.textButton}>Abrir terminal <ArrowUpRight size={13} /></Link></div><div className={styles.kpis}><article><small>EVENTOS</small><strong>{events.length}</strong><span>Persistidos no workspace</span></article><article><small>INBOUND</small><strong>{events.filter((event) => event.direction === "inbound").length}</strong></article><article><small>OUTBOUND</small><strong>{events.filter((event) => event.direction === "outbound").length}</strong></article></div><div className={styles.sectionList}>{events.slice(-5).reverse().map((event, index) => <article className={styles.sectionRow} key={`${event.occurred_at}-${index}`}><div><strong>{event.direction === "outbound" ? "Hermes" : "Usuário"}</strong><small>{mask(event.external_user_ref)} · {event.delivery_status ?? "status não informado"}</small></div><p>{event.text || "Mensagem sem texto"}</p></article>)}</div></section>;
  }

  return <main className={styles.shell}>
    <aside className={styles.sidebar}><div className={styles.brand}><span className={styles.brandMark}><Sparkles size={19} /></span><span>binc<span className={styles.brandAccent}>OS</span></span></div><div className={styles.workspace}><span className={styles.workspaceDot}><span /></span><div><small>Workspace</small><strong>Minha operação</strong></div></div><nav><p className={styles.navLabel}>OPERAÇÃO</p>{navItems.map(({ id, label, icon: Icon }) => <button key={id} className={`${styles.navItem} ${activeSection === id ? styles.active : ""}`} aria-current={activeSection === id ? "page" : undefined} onClick={() => selectSection(id)}><span><Icon size={16} /></span>{label}{id === "projects" && <b>{projects.length || "—"}</b>}</button>)}</nav><div className={styles.sidebarFooter}><div className={styles.avatar}>B</div><div><strong>Administrador</strong><small>Global admin</small></div><MoreHorizontal size={16} /></div></aside>
    <section className={styles.content} id="overview"><header className={styles.header}><div><p className={styles.eyebrow} suppressHydrationWarning>{new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric", timeZone: "America/Sao_Paulo" }).format(new Date()).toUpperCase()}</p><h1>{titles[activeSection][0]} <span>{activeSection === "overview" ? <Sparkles size={20} /> : null}</span></h1><p className={styles.subtitle}>{titles[activeSection][1]}</p></div><div className={styles.headerActions} data-popover-anchor><button className={styles.iconButton} aria-label="Buscar" aria-expanded={searchOpen} onClick={() => { setSearchOpen((value) => !value); setNotificationsOpen(false); setProfileOpen(false); }}><Search size={17} /></button><button className={styles.iconButton} aria-label="Notificações" aria-expanded={notificationsOpen} onClick={() => { setNotificationsOpen((value) => !value); setSearchOpen(false); setProfileOpen(false); }}><Activity size={17} /></button><button className={styles.profile} aria-label="Perfil do administrador" aria-expanded={profileOpen} onClick={() => { setProfileOpen((value) => !value); setSearchOpen(false); setNotificationsOpen(false); }}>B</button></div></header>{searchOpen && <div className={styles.headerPopover} data-floating-popover role="dialog" aria-label="Busca global"><Search size={15} /><input autoFocus value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar projetos" aria-label="Buscar projetos" /><button onClick={() => { setSearchTerm(""); setSearchOpen(false); }}>Fechar</button></div>}{notificationsOpen && <div className={styles.headerPopover} data-floating-popover role="dialog" aria-label="Notificações"><Activity size={15} /><div><strong>Atividade operacional</strong><p>{audit.length ? `${audit.length} evento(s) auditado(s)` : "Nenhum evento novo."}</p></div></div>}{profileOpen && <div className={styles.headerPopover} data-floating-popover role="menu" aria-label="Perfil"><div className={styles.avatar}>B</div><div><strong>Breno</strong><p>Administrador global</p></div><button onClick={() => selectSection("governance")}>Governança</button></div>}{projectMessage && <p className={styles.inlineFeedback}>{projectMessage}</p>}{renderSection()}<footer className={styles.footer}><span><ShieldCheck size={12} /> Binc OS <b>v0.1</b></span><span><i /> {controlPlane === "connected" ? "Sistemas verificados" : "Estado não verificado"}</span></footer></section><MobileNav />
  </main>;
}
