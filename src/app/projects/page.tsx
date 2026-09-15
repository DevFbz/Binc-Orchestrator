"use client";

import Link from "next/link";
import { ArrowUpRight, Camera, FolderKanban, ShieldCheck, WalletCards, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import MobileNav from "@/components/MobileNav";
import styles from "./page.module.css";

type Project = { project_id: string; name: string; description?: string; status: string; capabilities?: string[]; service?: string };
type Data = { projects?: { projects?: Project[] } };

const statusLabel: Record<string, string> = { operational: "Operacional", disabled: "Desativado", degraded: "Atenção" };

export default function ProjectsPage() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => { const timer = window.setTimeout(() => { fetch("/api/control-plane", { cache: "no-store" }).then(async (response) => { if (!response.ok) throw new Error(); setData(await response.json()); }).catch(() => setError(true)); }, 0); return () => window.clearTimeout(timer); }, []);
  const projects = data?.projects?.projects ?? [];
  return <main className={styles.page}>
    <header className={styles.header}><div><p className={styles.kicker}>CATÁLOGO OPERACIONAL</p><h1>Projetos</h1><p>Escolha um projeto para inspecionar status, capacidades e contexto operacional.</p></div><span className={styles.secure}><ShieldCheck size={15} /> Fonte: control plane</span></header>
    {error ? <div className={styles.notice}><XCircle size={18} /><div><strong>Catálogo indisponível</strong><p>O control plane não respondeu. Nenhum dado local foi exibido.</p></div></div> : <section className={styles.list}>{projects.length ? projects.map((project) => { const Icon = project.project_id === "cofrinia-finance" ? WalletCards : project.project_id === "instagram-content-operations" ? Camera : FolderKanban; return <article className={styles.card} key={project.project_id}><div className={styles.icon}><Icon size={21} /></div><div className={styles.body}><div className={styles.title}><h2>{project.name}</h2><span className={project.status === "operational" ? styles.ok : styles.warning}>{statusLabel[project.status] ?? project.status}</span></div><p>{project.description ?? "Módulo registrado no Binc OS."}</p><small>{project.service ?? "Serviço não informado"}</small></div><Link href={`/projects/${project.project_id}`} className={styles.open}>Abrir <ArrowUpRight size={15} /></Link></article>; }) : <div className={styles.empty}>Nenhum projeto foi registrado no control plane.</div>}</section>}
    <MobileNav />
  </main>;
}
