"use client";

import Link from "next/link";
import { ArrowLeft, Camera, CircleDollarSign, FolderKanban, ShieldCheck, WalletCards, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import MobileNav from "@/components/MobileNav";
import styles from "./page.module.css";

type Project = { project_id: string; name: string; description?: string; status: string; capabilities?: string[] };
type Data = { projects?: { projects?: Project[] } };

export default function ProjectsPage() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => { const timer = window.setTimeout(() => { fetch("/api/control-plane", { cache: "no-store" }).then(async (response) => { if (!response.ok) throw new Error(); setData(await response.json()); }).catch(() => setError(true)); }, 0); return () => window.clearTimeout(timer); }, []);
  const projects = data?.projects?.projects ?? [];
  return <main className={styles.page}>
    <header className={styles.header}><Link href="/" className={styles.back}><ArrowLeft size={16} /> Visão geral</Link><span className={styles.secure}><ShieldCheck size={14} /> Catálogo protegido</span></header>
    <section className={styles.hero}><div><p className={styles.kicker}>ECOSSISTEMA</p><h1>Projetos<span>.</span></h1><p className={styles.subtitle}>Todos os módulos catalogados pelo control plane, sem duplicar domínios.</p></div><FolderKanban size={34} className={styles.heroIcon} /></section>
    {error ? <div className={styles.notice}><XCircle size={18} /><div><strong>Catálogo indisponível</strong><p>O control plane não respondeu.</p></div></div> : <section className={styles.list}>{projects.map((project) => { const Icon = project.project_id === "cofrinia-finance" ? WalletCards : project.project_id === "instagram-content-operations" ? Camera : FolderKanban; return <article className={styles.card} key={project.project_id}><div className={styles.icon}><Icon size={20} /></div><div className={styles.body}><div className={styles.title}><h2>{project.name}</h2><span>{project.status}</span></div><p>{project.description}</p><small>{project.capabilities?.join(" · ") ?? "Sem capacidades informadas"}</small></div><Link href={`/projects/${project.project_id}`} className={styles.open}>Abrir</Link></article>; })}</section>}
    <footer className={styles.footer}><CircleDollarSign size={13} /> CofrinIA permanece como projeto financeiro oficial e independente.</footer>
    <MobileNav />
  </main>;
}
