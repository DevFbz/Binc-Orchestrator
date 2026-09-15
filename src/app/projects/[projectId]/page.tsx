"use client";

import Link from "next/link";
import { ArrowLeft, Camera, CircleDollarSign, ExternalLink, FolderKanban, ShieldCheck, WalletCards, XCircle } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import MobileNav from "@/components/MobileNav";
import styles from "./page.module.css";

type Project = { project_id: string; name: string; description?: string; status: string; capabilities?: string[]; repository?: string; service?: string; port?: number };
type Publication = { published_media_id?: string; published_at?: string; permalink?: string };
type Campaign = { campaign_id: string; status?: string; created_at?: string; caption?: string; product_snapshot?: { name?: string; brand?: string; sale_price?: number; stock?: number }; channels?: string[]; publication?: { feed?: Publication; story?: Publication }; story?: Publication; published_media_id?: string | null; approvals?: { caption?: string | null; final?: string | null } };
type Data = { projects?: { projects?: Project[] }; campaigns?: { campaigns?: Campaign[] }; permissions?: { can_manage_projects?: boolean } };
const brl = (value?: number) => typeof value === "number" ? value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—";
const formatDate = (value?: string | null) => value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(value)) : "—";
const projectStatusLabel: Record<string, string> = { operational: "Operacional", disabled: "Desativado", preparation: "Em preparação", degraded: "Atenção" };
const statusLabel: Record<string, string> = { PUBLISHED: "Publicada", CAPTION_REVIEW: "Revisão da legenda", WAITING_IMAGE: "Imagem recebida", IMAGE_RECEIVED: "Imagem recebida", REJECTED: "Rejeitada" };

export default function ProjectDetailPage() {
  const params = useParams<{ projectId: string }>();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "campaigns">("overview");
  const [message, setMessage] = useState("");
  const [working, setWorking] = useState(false);
  const selectTab = (tab: "overview" | "campaigns") => {
    setActiveTab(tab);
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${tab === "campaigns" ? "#campaigns" : ""}`);
  };
  useEffect(() => {
    const syncTab = () => setActiveTab(window.location.hash === "#campaigns" ? "campaigns" : "overview");
    syncTab();
    window.addEventListener("hashchange", syncTab);
    return () => window.removeEventListener("hashchange", syncTab);
  }, []);
  useEffect(() => { const timer = window.setTimeout(() => { fetch("/api/control-plane", { cache: "no-store" }).then(async (response) => { if (!response.ok) throw new Error(); setData(await response.json()); }).catch(() => setError(true)); }, 0); return () => window.clearTimeout(timer); }, []);
  const project = data?.projects?.projects?.find((item) => item.project_id === params.projectId);
  const campaigns = data?.campaigns?.campaigns ?? [];
  const canManage = data?.permissions?.can_manage_projects === true;
  const canToggle = project?.status === "operational" || project?.status === "disabled";
  async function toggleProject() {
    if (!project) return;
    const status = project.status === "disabled" ? "operational" : "disabled";
    if (!window.confirm(`Confirma ${status === "disabled" ? "ativar" : "desativar"} o projeto “${project.name}”?`)) return;
    setWorking(true); setMessage("");
    try {
      const response = await fetch("/api/control-plane", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "project_status", project_id: project.project_id, status, confirm: true }) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "Não foi possível atualizar o projeto.");
      setMessage(`Projeto ${status === "disabled" ? "desativado" : "ativado"} e auditado.`);
      const refreshed = await fetch("/api/control-plane", { cache: "no-store" });
      if (refreshed.ok) setData(await refreshed.json());
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Falha ao atualizar o projeto."); }
    finally { setWorking(false); }
  }
  const Icon = project?.project_id === "cofrinia-finance" ? WalletCards : project?.project_id === "instagram-content-operations" ? Camera : FolderKanban;
  const campaignRows = project?.project_id === "instagram-content-operations" ? campaigns.map((campaign) => {
    const product = campaign.product_snapshot;
    const feed = campaign.publication?.feed;
    const story = campaign.publication?.story ?? campaign.story;
    return <article className={styles.campaign} key={campaign.campaign_id}>
      <div className={styles.campaignMain}>
        <span className={`${styles.campaignStatus} ${campaign.status === "PUBLISHED" ? styles.published : styles.pending}`}>{statusLabel[campaign.status ?? ""] ?? campaign.status ?? "Sem status"}</span>
        <h3>{product?.name ?? "Campanha sem produto"}</h3>
        <p>{product?.brand ?? "Marca não informada"} · {brl(product?.sale_price)} · {product?.stock ? "Disponível em estoque" : "Estoque não informado"}</p>
        <small>{campaign.campaign_id} · criada em {formatDate(campaign.created_at)}</small>
        {campaign.caption && <p className={styles.caption}><strong>Legenda:</strong> {campaign.caption}</p>}
        <small>Aprovação da legenda: {formatDate(campaign.approvals?.caption)} · aprovação final: {formatDate(campaign.approvals?.final)}</small>
      </div>
      <div className={styles.channelList}>
        <span>Feed {feed ? "publicado" : "não publicado"}{feed?.published_media_id ? ` · ${feed.published_media_id}` : ""}</span>
        <span>Story {story ? "publicado" : "não publicado"}{story?.published_media_id ? ` · ${story.published_media_id}` : ""}</span>
        {feed?.permalink ? <a href={feed.permalink} target="_blank" rel="noreferrer">Abrir Feed <ExternalLink size={12} /></a> : null}
        {story?.permalink ? <a href={story.permalink} target="_blank" rel="noreferrer">Abrir Story <ExternalLink size={12} /></a> : null}
      </div>
    </article>;
  }) : [];
  return <main className={styles.page}>
    <header className={styles.header}><Link href="/projects" className={styles.back}><ArrowLeft size={16} /> Projetos</Link><span className={styles.secure}><ShieldCheck size={14} /> Catálogo protegido</span></header>
    {error ? <div className={styles.notice}><XCircle size={18} /><div><strong>Projeto indisponível</strong><p>O control plane não respondeu.</p></div></div> : project ? <><section className={styles.hero}><div><p className={styles.kicker}>{project.project_id}</p><h1>{project.name}<span>.</span></h1><p className={styles.subtitle}>{project.description}</p></div><Icon size={38} className={styles.heroIcon} /></section>{message && <div className={styles.feedback} aria-live="polite">{message}</div>}<section className={styles.details}><div><small>STATUS</small><strong>{projectStatusLabel[project.status] ?? project.status}</strong></div><div><small>SERVIÇO</small><strong>{project.service ?? "Não informado"}</strong></div><div><small>PORTA</small><strong>{project.port ?? "—"}</strong></div><button className={styles.toggle} disabled={!canManage || working || !canToggle} title={!canToggle ? "Projeto em preparação: revisão de segurança e serviço ainda não configurados." : undefined} onClick={toggleProject}>{working ? "Atualizando…" : project.status === "preparation" ? "Em preparação" : project.status === "disabled" ? "Ativar projeto" : "Desativar projeto"}</button></section>{project.project_id === "instagram-content-operations" ? <><nav className={styles.tabs} aria-label="Abas do projeto" role="tablist"><button id="overview-tab" role="tab" aria-selected={activeTab === "overview"} aria-controls="overview-panel" className={activeTab === "overview" ? styles.activeTab : ""} onClick={() => selectTab("overview")}>Visão geral</button><button id="campaigns-tab" role="tab" aria-selected={activeTab === "campaigns"} aria-controls="campaigns-panel" className={activeTab === "campaigns" ? styles.activeTab : ""} onClick={() => selectTab("campaigns")}>Campanhas</button></nav>{activeTab === "overview" ? <section id="overview-panel" role="tabpanel" aria-labelledby="overview-tab" className={styles.panel}><p className={styles.kicker}>CAPACIDADES</p><div className={styles.tags}>{(project.capabilities ?? []).map((capability) => <span key={capability}>{capability}</span>)}</div>{project.repository && <a href={project.repository} target="_blank" rel="noreferrer" className={styles.repository}><CircleDollarSign size={14} /> Repositório oficial</a>}</section> : <section id="campaigns-panel" role="tabpanel" aria-labelledby="campaigns-tab" className={styles.campaignPanel}><div className={styles.sectionHeading}><div><p className={styles.kicker}>PUBLICAÇÃO E APROVAÇÃO</p><h2>Campanhas do Instagram</h2><p>Produtos, status e canais publicados neste projeto.</p></div></div><div className={styles.campaignList}>{campaignRows.length ? campaignRows : <p className={styles.empty}>Nenhuma campanha registrada.</p>}</div></section>}</> : <section className={styles.panel}><p className={styles.kicker}>CAPACIDADES</p><div className={styles.tags}>{(project.capabilities ?? []).map((capability) => <span key={capability}>{capability}</span>)}</div>{project.repository && <a href={project.repository} target="_blank" rel="noreferrer" className={styles.repository}><CircleDollarSign size={14} /> Repositório oficial</a>}</section>}</> : <div className={styles.notice}>Carregando projeto…</div>}
    <MobileNav />
  </main>;
}
