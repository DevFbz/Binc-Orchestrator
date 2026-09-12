"use client";

import Link from "next/link";
import { ArrowLeft, Camera, CircleDollarSign, FolderKanban, ShieldCheck, WalletCards, XCircle } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./page.module.css";

type Project = { project_id: string; name: string; description?: string; status: string; capabilities?: string[]; repository?: string; service?: string; port?: number };
type Data = { projects?: { projects?: Project[] } };

export default function ProjectDetailPage() {
  const params = useParams<{ projectId: string }>();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => { const timer = window.setTimeout(() => { fetch("/api/control-plane", { cache: "no-store" }).then(async (response) => { if (!response.ok) throw new Error(); setData(await response.json()); }).catch(() => setError(true)); }, 0); return () => window.clearTimeout(timer); }, []);
  const project = data?.projects?.projects?.find((item) => item.project_id === params.projectId);
  const Icon = project?.project_id === "cofrinia-finance" ? WalletCards : project?.project_id === "instagram-content-operations" ? Camera : FolderKanban;
  return <main className={styles.page}>
    <header className={styles.header}><Link href="/projects" className={styles.back}><ArrowLeft size={16} /> Projetos</Link><span className={styles.secure}><ShieldCheck size={14} /> Catálogo protegido</span></header>
    {error ? <div className={styles.notice}><XCircle size={18} /><div><strong>Projeto indisponível</strong><p>O control plane não respondeu.</p></div></div> : project ? <><section className={styles.hero}><div><p className={styles.kicker}>{project.project_id}</p><h1>{project.name}<span>.</span></h1><p className={styles.subtitle}>{project.description}</p></div><Icon size={38} className={styles.heroIcon} /></section><section className={styles.details}><div><small>STATUS</small><strong>{project.status}</strong></div><div><small>SERVIÇO</small><strong>{project.service ?? "Não informado"}</strong></div><div><small>PORTA</small><strong>{project.port ?? "—"}</strong></div></section><section className={styles.panel}><p className={styles.kicker}>CAPACIDADES</p><div className={styles.tags}>{(project.capabilities ?? []).map((capability) => <span key={capability}>{capability}</span>)}</div>{project.repository && <a href={project.repository} target="_blank" rel="noreferrer" className={styles.repository}><CircleDollarSign size={14} /> Repositório oficial</a>}</section></> : <div className={styles.notice}>Carregando projeto…</div>}
  </main>;
}
