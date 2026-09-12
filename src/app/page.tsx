"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Bot,
  CalendarClock,
  ChevronDown,
  Camera,
  CircleDollarSign,
  FileText,
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  MoreHorizontal,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  WalletCards,
  Workflow,
} from "lucide-react";
import MobileNav from "@/components/MobileNav";
import styles from "./page.module.css";

const projectCatalog = [
  { id: "instagram-content-operations", color: "green", icon: Camera },
  { id: "cofrinia-finance", color: "amber", icon: WalletCards },
];

type Project = { project_id: string; name: string; description?: string; status: string; capabilities?: string[] };
type ControlPlaneData = { overview?: { totals?: { tenants?: number; campaigns?: number; published?: number } }; projects?: { projects?: Project[] }; tenants?: { tenants?: unknown[] }; campaigns?: { campaigns?: unknown[] } };

const statusLabel: Record<string, string> = { operational: "Operacional", preparation: "Em preparação", degraded: "Atenção", offline: "Offline" };

const activities = [
  ["Instagram", "Campanha de produto publicada", "Hoje, 14:20", Camera],
  ["Agenda", "Pré-revisão configurada para 18:30", "Hoje, 14:24", CalendarClock],
  ["Documentação", "PRD do Hermes Orchestrator atualizado", "Hoje, 14:42", FileText],
] as const;

export default function Home() {
  const [controlPlane, setControlPlane] = useState<"checking" | "connected" | "not_configured" | "unavailable">("checking");
  const [remoteData, setRemoteData] = useState<ControlPlaneData | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const currentDate = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric", timeZone: "America/Sao_Paulo" }).format(new Date()).toUpperCase();

  useEffect(() => {
    fetch("/api/control-plane")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          setControlPlane(payload.code === "control_plane_not_configured" ? "not_configured" : "unavailable");
          return;
        }
        setRemoteData(payload);
        setControlPlane("connected");
      })
      .catch(() => setControlPlane("unavailable"));
  }, []);

  const remoteProjects = remoteData?.projects?.projects ?? [];
  const projects = remoteProjects.map((project) => {
    const visual = projectCatalog.find((item) => item.id === project.project_id) ?? { color: "amber", icon: Settings2 };
    return { ...project, ...visual, type: project.description ?? "Módulo Hermes", detail: project.capabilities?.join(" · ") ?? "Sem capacidades informadas" };
  });
  const normalizedSearch = searchTerm.trim().toLocaleLowerCase("pt-BR");
  const visibleProjects = normalizedSearch ? projects.filter((project) => `${project.name} ${project.description ?? ""}`.toLocaleLowerCase("pt-BR").includes(normalizedSearch)) : projects;
  const totals = remoteData?.overview?.totals;
  const connectionText = controlPlane === "connected" ? "Control plane conectado" : controlPlane === "checking" ? "Verificando conexão com a Azure..." : "Configure a conexão com o control plane da Azure";

  return (
    <main className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}><span className={styles.brandMark}><Sparkles size={19} /></span><span>hermes<span className={styles.brandAccent}>OS</span></span></div>
        <div className={styles.workspace}><span className={styles.workspaceDot}><span /></span><div><small>Workspace</small><strong>Minha operação</strong></div><ChevronDown size={15} className={styles.chevron} /></div>
        <nav>
          <p className={styles.navLabel}>ORGANIZAÇÃO</p>
          <a className={`${styles.navItem} ${styles.active}`} href="#overview"><LayoutDashboard size={16} /> Visão geral</a>
          <Link className={styles.navItem} href="/projects"><FolderKanban size={16} /> Projetos <b>2</b></Link>
          <a className={styles.navItem} href="/jobs"><ListChecks size={16} /> Tarefas</a>
          <a className={styles.navItem} href="/jobs"><Workflow size={16} /> Automações</a>
          <a className={styles.navItem} href="/onboarding"><ShieldCheck size={16} /> Governança</a>
          <p className={styles.navLabel}>MÓDULOS</p>
          <Link className={styles.navItem} href="/projects?project=instagram-content-operations"><Camera size={16} /> Instagram</Link>
          <Link className={styles.navItem} href="/terminal"><Bot size={16} /> Terminal Telegram</Link>
          <a className={styles.navItem} href="https://github.com/DevFbz/CofrinIA---Agente-Financeiro" target="_blank" rel="noreferrer"><CircleDollarSign size={16} /> CofrinIA Finance</a>
          <a className={styles.navItem} href="/reports"><FileText size={16} /> Relatórios</a>
          <a className={styles.navItem} href="/docs"><FileText size={16} /> Documentação</a>
        </nav>
        <div className={styles.sidebarFooter}><div className={styles.avatar}>B</div><div><strong>Administrador</strong><small>Global admin</small></div><MoreHorizontal size={16} /></div>
      </aside>
      <section className={styles.content} id="overview">
        <header className={styles.header}><div><p className={styles.eyebrow} suppressHydrationWarning>{currentDate}</p><h1>Bom dia, Breno <span><Sparkles size={20} /></span></h1><p className={styles.subtitle}>Aqui está o resumo da sua operação.</p></div><div className={styles.headerActions}><button className={styles.iconButton} aria-label="Buscar" aria-expanded={searchOpen} onClick={() => setSearchOpen((open) => !open)}><Search size={17} /></button><button className={styles.iconButton} aria-label="Notificações" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen((open) => !open)}><Activity size={17} /></button><button className={styles.profile} aria-label="Perfil do administrador" aria-expanded={profileOpen} onClick={() => setProfileOpen((open) => !open)}>B</button></div></header>
        {searchOpen && <div className={styles.headerPopover}><Search size={15} /><input autoFocus value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar projetos" aria-label="Buscar projetos" /><button onClick={() => { setSearchTerm(""); setSearchOpen(false); }}>Fechar</button></div>}
        {notificationsOpen && <div className={styles.headerPopover}><Activity size={15} /><div><strong>Notificações</strong><p>Nenhuma notificação nova.</p></div></div>}
        {profileOpen && <div className={styles.headerPopover}><div className={styles.avatar}>B</div><div><strong>Breno</strong><p>Administrador global</p></div><Link href="/onboarding">Governança</Link></div>}
        <div className={styles.banner}><div className={styles.bannerIcon}><Bot size={20} /></div><div><strong>Hermes está monitorando sua operação</strong><p>{connectionText}</p></div><span className={`${styles.live} ${controlPlane !== "connected" ? styles.liveWarning : ""}`}><i /> {controlPlane === "connected" ? "LIVE" : "ATENÇÃO"}</span></div>
        <section className={styles.kpis}><article><small>PROJETOS ATIVOS</small><strong>{remoteData ? (totals?.tenants ?? projects.length) : "—"}</strong><span className={styles.positive}>Dados do control plane</span></article><article><small>CAMPANHAS</small><strong>{remoteData ? (totals?.campaigns ?? 0) : "—"}</strong><span>Histórico sincronizado</span></article><article><small>PUBLICAÇÕES</small><strong>{remoteData ? (totals?.published ?? 0) : "—"}</strong><span>Aprovadas e registradas</span></article><article><small>CONEXÃO</small><strong>{controlPlane === "connected" ? "OK" : "—"}</strong><span className={controlPlane === "connected" ? styles.positive : styles.warning}>{controlPlane === "connected" ? "Control plane online" : "Configuração pendente"}</span></article></section>
        <div className={styles.grid}>
          <section className={styles.panel} id="projects"><div className={styles.panelHeader}><div><p className={styles.sectionKicker}>ECOSSISTEMA</p><h2>Seus projetos</h2></div><Link className={styles.textButton} href="/projects">Ver todos <ArrowUpRight size={13} /></Link></div><div className={styles.projectList}>{visibleProjects.map((project) => { const Icon = project.icon; return <article className={styles.project} key={project.name}><div className={`${styles.projectIcon} ${styles[project.color]}`}><Icon size={18} /></div><div className={styles.projectInfo}><strong>{project.name}</strong><small>{project.type}</small><p>{project.detail}</p></div><span className={`${styles.status} ${styles[project.color]}`}><i /> {statusLabel[project.status] ?? project.status}</span><MoreHorizontal size={16} className={styles.more} /></article>; })}{searchTerm && !visibleProjects.length && <p className={styles.emptyState}>Nenhum projeto encontrado para “{searchTerm}”.</p>}</div></section>
          <section className={styles.panel} id="automations"><div className={styles.panelHeader}><div><p className={styles.sectionKicker}>ORQUESTRAÇÃO</p><h2>Próximas automações</h2></div><Link className={styles.textButton} href="/jobs">Ver agenda <ArrowUpRight size={13} /></Link></div><div className={styles.automation}><div className={styles.time}>18:30<small>Hoje</small></div><div className={styles.timeline}><span className={styles.timelineDot} /></div><div className={styles.automationBody}><strong>Pré-revisão de conteúdo</strong><small>Instagram Content Operations</small><p>Legenda + prompt enviados ao Telegram</p></div><span className={`${styles.status} ${styles.amber}`}><i /> Aguardando</span></div><div className={styles.automation}><div className={styles.time}>19:30<small>Hoje</small></div><div className={styles.timeline}><span className={styles.timelineDotMuted} /></div><div className={styles.automationBody}><strong>Janela de publicação</strong><small>Instagram Content Operations</small><p>Somente após aprovação humana</p></div><span className={`${styles.status} ${styles.muted}`}>Programada</span></div></section>
        </div>
        <section className={styles.panel} id="activity"><div className={styles.panelHeader}><div><p className={styles.sectionKicker}>AUDITORIA</p><h2>Atividade recente</h2></div><Link className={styles.textButton} href="/history">Abrir histórico <ArrowUpRight size={13} /></Link></div><div className={styles.activityList}>{activities.map(([tag, title, time, Icon]) => <div className={styles.activity} key={title}><span className={styles.activityDot} /><span className={styles.activityTag}><Icon size={12} /> {tag}</span><strong>{title}</strong><time>{time}</time></div>)}</div></section>
        <footer className={styles.footer}><span><ShieldCheck size={12} /> Hermes Orchestrator <b>v0.1</b></span><span><i /> Todos os sistemas operacionais</span></footer>
      </section>
      <MobileNav />
    </main>
  );
}
