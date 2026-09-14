"use client";

import Link from "next/link";
import { ArrowLeft, Camera, CircleDollarSign, FolderKanban, ShieldCheck, WalletCards, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import MobileNav from "@/components/MobileNav";
import styles from "./page.module.css";

type Project = { project_id: string; name: string; description?: string; status: string; capabilities?: string[] };
type Data = { projects?: { projects?: Project[] }; permissions?: { can_manage_projects?: boolean } };

export default function ProjectsPage() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState(false);
  const [message, setMessage] = useState("");
  const [working, setWorking] = useState("");
  async function load() { try { const response = await fetch("/api/control-plane", { cache: "no-store" }); if (!response.ok) throw new Error(); setData(await response.json()); setError(false); } catch { setError(true); } }
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, []);
  async function toggleProject(project: Project) { const status = project.status === "disabled" ? "operational" : "disabled"; if (!window.confirm(`Confirma ${status === "disabled" ? "desativar" : "ativar"} o projeto “${project.name}”?`)) return; setWorking(project.project_id); setMessage(""); try { const response = await fetch("/api/control-plane", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "project_status", project_id: project.project_id, status, confirm: true }) }); const payload = await response.json().catch(() => ({})); if (!response.ok) throw new Error(payload.error || "Não foi possível atualizar o projeto."); setMessage(`Projeto ${status === "disabled" ? "desativado" : "ativado"} e auditado.`); await load(); } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Falha ao atualizar o projeto."); } finally { setWorking(""); } }
  const projects = data?.projects?.projects ?? [];
  const canManage = data?.permissions?.can_manage_projects === true;
  return <main className={styles.page}>
    <header className={styles.header}><Link href="/#projects" className={styles.back}><ArrowLeft size={16} /> Binc OS</Link><span className={styles.secure}><ShieldCheck size={14} /> Catálogo protegido</span></header>
    <section className={styles.hero}><div><p className={styles.kicker}>ECOSSISTEMA</p><h1>Projetos<span>.</span></h1><p className={styles.subtitle}>Todos os módulos catalogados pelo control plane, com o mesmo controle de estado do shell web.</p></div><FolderKanban size={34} className={styles.heroIcon} /></section>
    {message && <div className={styles.feedback} aria-live="polite">{message}</div>}
    {error ? <div className={styles.notice}><XCircle size={18} /><div><strong>Catálogo indisponível</strong><p>O control plane não respondeu.</p></div></div> : <section className={styles.list}>{projects.length ? projects.map((project) => { const Icon = project.project_id === "cofrinia-finance" ? WalletCards : project.project_id === "instagram-content-operations" ? Camera : FolderKanban; return <article className={styles.card} key={project.project_id}><div className={styles.icon}><Icon size={20} /></div><div className={styles.body}><div className={styles.title}><h2>{project.name}</h2><span>{project.status}</span></div><p>{project.description}</p><small>{project.capabilities?.join(" · ") ?? "Sem capacidades informadas"}</small></div><div className={styles.actions}><Link href={`/projects/${project.project_id}`} className={styles.open}>Detalhes</Link><button className={styles.toggle} disabled={!canManage || !!working} onClick={() => toggleProject(project)}>{working === project.project_id ? "Atualizando…" : project.status === "disabled" ? "Ativar" : "Desativar"}</button></div></article>; }) : <div className={styles.empty}>Nenhum projeto disponível.</div>}</section>}
    <footer className={styles.footer}><CircleDollarSign size={13} /> CofrinIA permanece como projeto financeiro oficial e independente.</footer>
    <MobileNav />
  </main>;
}
