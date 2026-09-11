"use client";

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
import styles from "./page.module.css";

const projectCatalog = [
  { id: "instagram-content-operations", color: "green", icon: Camera },
  { id: "personal-finance-assistant", color: "amber", icon: WalletCards },
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
          <a className={styles.navItem} href="#projects"><FolderKanban size={16} /> Projetos <b>2</b></a>
          <a className={styles.navItem} href="#tasks"><ListChecks size={16} /> Tarefas</a>
          <a className={styles.navItem} href="/jobs"><Workflow size={16} /> Automações</a>
          <p className={styles.navLabel}>MÓDULOS</p>
          <a className={styles.navItem} href="#instagram"><Camera size={16} /> Instagram</a>
          <a className={styles.navItem} href="/finance"><CircleDollarSign size={16} /> Finanças</a>
          <a className={styles.navItem} href="#reports"><FileText size={16} /> Relatórios</a>
          <a className={styles.navItem} href="#docs"><FileText size={16} /> Documentação</a>
        </nav>
        <div className={styles.sidebarFooter}><div className={styles.avatar}>F</div><div><strong>Administrador</strong><small>Global admin</small></div><MoreHorizontal size={16} /></div>
      </aside>
      <section className={styles.content} id="overview">
        <header className={styles.header}><div><p className={styles.eyebrow} suppressHydrationWarning>{currentDate}</p><h1>Bom dia, Fábio <span><Sparkles size={20} /></span></h1><p className={styles.subtitle}>Aqui está o resumo da sua operação.</p></div><div className={styles.headerActions}><button className={styles.iconButton} aria-label="Buscar"><Search size={17} /></button><button className={styles.iconButton} aria-label="Notificações"><Activity size={17} /></button><button className={styles.profile}>F</button></div></header>
        <div className={styles.banner}><div className={styles.bannerIcon}><Bot size={20} /></div><div><strong>Hermes está monitorando sua operação</strong><p>{connectionText}</p></div><span className={`${styles.live} ${controlPlane !== "connected" ? styles.liveWarning : ""}`}><i /> {controlPlane === "connected" ? "LIVE" : "ATENÇÃO"}</span></div>
        <section className={styles.kpis}><article><small>PROJETOS ATIVOS</small><strong>{remoteData ? (totals?.tenants ?? projects.length) : "—"}</strong><span className={styles.positive}>Dados do control plane</span></article><article><small>CAMPANHAS</small><strong>{remoteData ? (totals?.campaigns ?? 0) : "—"}</strong><span>Histórico sincronizado</span></article><article><small>PUBLICAÇÕES</small><strong>{remoteData ? (totals?.published ?? 0) : "—"}</strong><span>Aprovadas e registradas</span></article><article><small>CONEXÃO</small><strong>{controlPlane === "connected" ? "OK" : "—"}</strong><span className={controlPlane === "connected" ? styles.positive : styles.warning}>{controlPlane === "connected" ? "Control plane online" : "Configuração pendente"}</span></article></section>
        <div className={styles.grid}>
          <section className={styles.panel} id="projects"><div className={styles.panelHeader}><div><p className={styles.sectionKicker}>ECOSSISTEMA</p><h2>Seus projetos</h2></div><button className={styles.textButton}>Ver todos <ArrowUpRight size={13} /></button></div><div className={styles.projectList}>{projects.map((project) => { const Icon = project.icon; return <article className={styles.project} key={project.name}><div className={`${styles.projectIcon} ${styles[project.color]}`}><Icon size={18} /></div><div className={styles.projectInfo}><strong>{project.name}</strong><small>{project.type}</small><p>{project.detail}</p></div><span className={`${styles.status} ${styles[project.color]}`}><i /> {statusLabel[project.status] ?? project.status}</span><MoreHorizontal size={16} className={styles.more} /></article>; })}</div></section>
          <section className={styles.panel} id="automations"><div className={styles.panelHeader}><div><p className={styles.sectionKicker}>ORQUESTRAÇÃO</p><h2>Próximas automações</h2></div><button className={styles.textButton}>Ver agenda <ArrowUpRight size={13} /></button></div><div className={styles.automation}><div className={styles.time}>18:30<small>Hoje</small></div><div className={styles.timeline}><span className={styles.timelineDot} /></div><div className={styles.automationBody}><strong>Pré-revisão de conteúdo</strong><small>Instagram Content Operations</small><p>Legenda + prompt enviados ao Telegram</p></div><span className={`${styles.status} ${styles.amber}`}><i /> Aguardando</span></div><div className={styles.automation}><div className={styles.time}>19:30<small>Hoje</small></div><div className={styles.timeline}><span className={styles.timelineDotMuted} /></div><div className={styles.automationBody}><strong>Janela de publicação</strong><small>Instagram Content Operations</small><p>Somente após aprovação humana</p></div><span className={`${styles.status} ${styles.muted}`}>Programada</span></div></section>
        </div>
        <section className={styles.panel} id="activity"><div className={styles.panelHeader}><div><p className={styles.sectionKicker}>AUDITORIA</p><h2>Atividade recente</h2></div><button className={styles.textButton}>Abrir histórico <ArrowUpRight size={13} /></button></div><div className={styles.activityList}>{activities.map(([tag, title, time, Icon]) => <div className={styles.activity} key={title}><span className={styles.activityDot} /><span className={styles.activityTag}><Icon size={12} /> {tag}</span><strong>{title}</strong><time>{time}</time></div>)}</div></section>
        <footer className={styles.footer}><span><ShieldCheck size={12} /> Hermes Orchestrator <b>v0.1</b></span><span><i /> Todos os sistemas operacionais</span></footer>
      </section>
    </main>
  );
}
