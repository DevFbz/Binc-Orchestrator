"use client";

import Link from "next/link";
import { ArrowLeft, Camera, CheckCircle2, Clock3, ExternalLink, Filter, Package, Search, ShieldCheck, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import MobileNav from "@/components/MobileNav";
import styles from "./page.module.css";

type Publication = { image_path?: string; media_container_id?: string; published_media_id?: string; published_at?: string; status?: string; permalink?: string };
type Campaign = {
  campaign_id: string;
  tenant_name?: string;
  status?: string;
  content_type?: string;
  channels?: string[];
  created_at?: string;
  caption?: string;
  product_snapshot?: { name?: string; brand?: string; sale_price?: number; stock?: number };
  approvals?: { caption?: string | null; final?: string | null };
  media_container_id?: string | null;
  published_media_id?: string | null;
  publication?: { feed?: Publication; story?: Publication };
  story?: Publication;
};
type Data = { campaigns?: { campaigns?: Campaign[] } };

const statusLabel: Record<string, string> = { PUBLISHED: "Publicada", CAPTION_REVIEW: "Revisão da legenda", WAITING_IMAGE: "Aguardando imagem", IMAGE_RECEIVED: "Imagem recebida", REJECTED: "Rejeitada", EXPIRED: "Expirada" };
const statusClass: Record<string, string> = { PUBLISHED: "published", CAPTION_REVIEW: "review", WAITING_IMAGE: "waiting", IMAGE_RECEIVED: "received", REJECTED: "rejected", EXPIRED: "rejected" };
const brl = (value?: number) => typeof value === "number" ? value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—";
const formatDate = (value?: string) => value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(value)) : "—";

function PublicationCard({ label, publication }: { label: string; publication?: Publication }) {
  if (!publication) return <div className={styles.publication}><span className={styles.publicationLabel}>{label}</span><strong>Não publicado</strong><small>Sem registro de publicação neste canal.</small></div>;
  return <div className={styles.publication}><span className={styles.publicationLabel}>{label}</span><strong><CheckCircle2 size={14} /> Publicado</strong><small>{formatDate(publication.published_at)}</small><small>Media ID: {publication.published_media_id ?? "não informado"}</small>{publication.permalink ? <a href={publication.permalink} target="_blank" rel="noreferrer">Abrir no Instagram <ExternalLink size={12} /></a> : null}</div>;
}

export default function CampaignsPage() {
  const [data, setData] = useState<Data | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState(false);
  useEffect(() => { const timer = window.setTimeout(() => { fetch("/api/control-plane", { cache: "no-store" }).then(async (response) => { if (!response.ok) throw new Error(); setData(await response.json()); }).catch(() => setError(true)); }, 0); return () => window.clearTimeout(timer); }, []);
  const campaigns = useMemo(() => data?.campaigns?.campaigns ?? [], [data]);
  const filtered = useMemo(() => campaigns.filter((campaign) => { const q = query.trim().toLocaleLowerCase("pt-BR"); const product = campaign.product_snapshot; const haystack = [campaign.campaign_id, campaign.tenant_name, product?.name, product?.brand, campaign.status].filter(Boolean).join(" ").toLocaleLowerCase("pt-BR"); return (!q || haystack.includes(q)) && (!status || campaign.status === status); }), [campaigns, query, status]);
  const published = campaigns.filter((campaign) => campaign.status === "PUBLISHED").length;
  return <main className={styles.page}>
    <header className={styles.header}><Link href="/" className={styles.back}><ArrowLeft size={16} /> Visão geral</Link><span className={styles.secure}><ShieldCheck size={14} /> Catálogo de campanhas</span></header>
    <section className={styles.hero}><div><p className={styles.kicker}>INSTAGRAM · MAGÚ MOTO PEÇAS FILHO</p><h1>Campanhas<span>.</span></h1><p className={styles.subtitle}>Produtos, aprovações e publicações sincronizados do Instagram Studio.</p></div><Camera size={36} className={styles.heroIcon} /></section>
    <section className={styles.summary}><article><small>TOTAL</small><strong>{campaigns.length}</strong><span>campanhas registradas</span></article><article><small>PUBLICADAS</small><strong>{published}</strong><span>Feed ou Story</span></article><article><small>EXIBINDO</small><strong>{filtered.length}</strong><span>após filtros</span></article></section>
    <section className={styles.filters}><label className={styles.search}><Search size={15} /><input aria-label="Buscar campanhas" placeholder="Buscar produto, marca ou ID" value={query} onChange={(event) => setQuery(event.target.value)} /></label><label><Filter size={14} /> Status<select aria-label="Filtrar por status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Todos</option>{Object.entries(statusLabel).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label></section>
    {error ? <div className={styles.notice}><XCircle size={18} /><div><strong>Campanhas indisponíveis</strong><p>O Binc não conseguiu consultar o Instagram Studio pelo control plane.</p></div></div> : <section className={styles.list}>{filtered.length ? filtered.map((campaign) => { const product = campaign.product_snapshot; const feed = campaign.publication?.feed ?? (campaign.channels?.includes("feed") && campaign.published_media_id ? { media_container_id: campaign.media_container_id ?? undefined, published_media_id: campaign.published_media_id ?? undefined, published_at: campaign.approvals?.final ?? undefined } : undefined); const story = campaign.publication?.story ?? campaign.story; return <article className={styles.card} key={campaign.campaign_id}><header className={styles.cardHeader}><div><span className={`${styles.status} ${styles[statusClass[campaign.status ?? ""] ?? "waiting"]}`}><i /> {statusLabel[campaign.status ?? ""] ?? campaign.status ?? "Sem status"}</span><h2>{product?.name ?? "Campanha sem produto"}</h2><p>{product?.brand ?? "Marca não informada"} · {campaign.tenant_name ?? "Tenant não informado"}</p></div><code>{campaign.campaign_id}</code></header><div className={styles.productGrid}><div><small><Package size={13} /> Produto</small><strong>{product?.name ?? "—"}</strong><span>{product?.brand ?? "Marca não informada"}</span></div><div><small>PREÇO</small><strong>{brl(product?.sale_price)}</strong><span>{product?.stock ? "Disponível em estoque" : "Estoque não informado"}</span></div><div><small>CRIADA EM</small><strong>{formatDate(campaign.created_at)}</strong><span>{campaign.content_type ?? "product"}</span></div></div><div className={styles.publications}><PublicationCard label="FEED" publication={feed} /><PublicationCard label="STORY" publication={story} /></div><details><summary>Ver legenda e aprovações</summary><pre>{campaign.caption ?? "Legenda não disponível."}</pre><p>Legenda aprovada: {campaign.approvals?.caption ? formatDate(campaign.approvals.caption) : "não"} · Aprovação final: {campaign.approvals?.final ? formatDate(campaign.approvals.final) : "não"}</p></details></article>; }) : <div className={styles.empty}><Clock3 size={20} /><p>Nenhuma campanha corresponde aos filtros atuais.</p></div>}</section>}
    <MobileNav />
  </main>;
}
