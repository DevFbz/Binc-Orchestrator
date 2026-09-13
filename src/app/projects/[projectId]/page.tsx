"use client";

import Link from "next/link";
import { ArrowLeft, Camera, CircleDollarSign, ExternalLink, FolderKanban, ShieldCheck, WalletCards, XCircle } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import MobileNav from "@/components/MobileNav";
import styles from "./page.module.css";

type Project = { project_id: string; name: string; description?: string; status: string; capabilities?: string[]; repository?: string; service?: string; port?: number };
type Publication = { published_media_id?: string; published_at?: string; permalink?: string };
type Campaign = { campaign_id: string; status?: string; created_at?: string; product_snapshot?: { name?: string; brand?: string; sale_price?: number; stock?: number }; channels?: string[]; publication?: { feed?: Publication; story?: Publication }; story?: Publication; published_media_id?: string | null; approvals?: { final?: string | null } };
type Data = { projects?: { projects?: Project[] }; campaigns?: { campaigns?: Campaign[] } };
const brl = (value?: number) => typeof value === "number" ? value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—";
const formatDate = (value?: string) => value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(value)) : "—";
const statusLabel: Record<string, string> = { PUBLISHED: "Publicada", CAPTION_REVIEW: "Revisão da legenda", WAITING_IMAGE: "Aguardando imagem", IMAGE_RECEIVED: "Imagem recebida", REJECTED: "Rejeitada" };

export default function ProjectDetailPage() {
  const params = useParams<{ projectId: string }>();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => { const timer = window.setTimeout(() => { fetch("/api/control-plane", { cache: "no-store" }).then(async (response) => { if (!response.ok) throw new Error(); setData(await response.json()); }).catch(() => setError(true)); }, 0); return () => window.clearTimeout(timer); }, []);
  const project = data?.projects?.projects?.find((item) => item.project_id === params.projectId);
  const campaigns = data?.campaigns?.campaigns ?? [];
  const Icon = project?.project_id === "cofrinia-finance" ? WalletCards : project?.project_id === "instagram-content-operations" ? Camera : FolderKanban;
  const campaignRows = project?.project_id === "instagram-content-operations" ? campaigns.map((campaign) => { const product = campaign.product_snapshot; const feed = campaign.publication?.feed; const story = campaign.publication?.story ?? campaign.story; return <article className={styles.campaign} key={campaign.campaign_id}><div className={styles.campaignMain}><span className={`${styles.campaignStatus} ${campaign.status === "PUBLISHED" ? styles.published : styles.pending}`}>{statusLabel[campaign.status ?? ""] ?? campaign.status ?? "Sem status"}</span><h3>{product?.name ?? "Campanha sem produto"}</h3><p>{product?.brand ?? "Marca não informada"} · {brl(product?.sale_price)} · {product?.stock ? "Disponível em estoque" : "Estoque não informado"}</p><small>{campaign.campaign_id} · criada em {formatDate(campaign.created_at)}</small></div><div className={styles.channelList}><span>Feed {feed ? "publicado" : "não publicado"}{feed?.published_media_id ? ` · ${feed.published_media_id}` : ""}</span><span>Story {story ? "publicado" : "não publicado"}{story?.published_media_id ? ` · ${story.published_media_id}` : ""}</span>{(feed?.permalink || story?.permalink) ? <a href={feed?.permalink || story?.permalink} target="_blank" rel="noreferrer">Abrir publicação <ExternalLink size={12} /></a> : null}</div></article>; }) : [];
  return <main className={styles.page}>
    <header className={styles.header}><Link href="/projects" className={styles.back}><ArrowLeft size={16} /> Projetos</Link><span className={styles.secure}><ShieldCheck size={14} /> Catálogo protegido</span></header>
    {error ? <div className={styles.notice}><XCircle size={18} /><div><strong>Projeto indisponível</strong><p>O control plane não respondeu.</p></div></div> : project ? <><section className={styles.hero}><div><p className={styles.kicker}>{project.project_id}</p><h1>{project.name}<span>.</span></h1><p className={styles.subtitle}>{project.description}</p></div><Icon size={38} className={styles.heroIcon} /></section><section className={styles.details}><div><small>STATUS</small><strong>{project.status}</strong></div><div><small>SERVIÇO</small><strong>{project.service ?? "Não informado"}</strong></div><div><small>PORTA</small><strong>{project.port ?? "—"}</strong></div></section><section className={styles.panel}><p className={styles.kicker}>CAPACIDADES</p><div className={styles.tags}>{(project.capabilities ?? []).map((capability) => <span key={capability}>{capability}</span>)}</div>{project.repository && <a href={project.repository} target="_blank" rel="noreferrer" className={styles.repository}><CircleDollarSign size={14} /> Repositório oficial</a>}</section>{project.project_id === "instagram-content-operations" ? <section className={styles.campaignPanel}><div className={styles.sectionHeading}><div><p className={styles.kicker}>PUBLICAÇÃO E APROVAÇÃO</p><h2>Campanhas do Instagram</h2><p>Produtos, status e canais publicados neste projeto.</p></div><Link href="/campaigns">Ver histórico completo</Link></div><div className={styles.campaignList}>{campaignRows.length ? campaignRows : <p className={styles.empty}>Nenhuma campanha registrada.</p>}</div></section> : null}</> : <div className={styles.notice}>Carregando projeto…</div>}
    <MobileNav />
  </main>;
}
