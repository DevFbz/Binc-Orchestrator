"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, CircleAlert, ShieldCheck, Users } from "lucide-react";
import { useEffect, useState } from "react";
import MobileNav from "@/components/MobileNav";
import styles from "./page.module.css";

type Workspace = { workspace_id: string; name: string; owner_id: string; checklist?: { complete: boolean; missing: string[] } };
type Data = { onboarding?: { workspaces?: Workspace[] } };

export default function OnboardingPage() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => { const timer = window.setTimeout(() => { fetch("/api/control-plane").then(async (response) => { if (!response.ok) throw new Error(); setData(await response.json()); }).catch(() => setError(true)); }, 0); return () => window.clearTimeout(timer); }, []);
  const workspaces = data?.onboarding?.workspaces ?? [];
  return <main className={styles.page}>
    <header className={styles.header}><Link href="/" className={styles.back}><ArrowLeft size={16} /> Visão geral</Link><span className={styles.secure}><ShieldCheck size={14} /> Governança protegida</span></header>
    <section className={styles.hero}><div><p className={styles.kicker}>GOVERNANÇA</p><h1>Onboarding<span>.</span></h1><p className={styles.subtitle}>Configure workspaces e clientes sem misturar projetos, integrações ou permissões.</p></div><button className={styles.primary} disabled title="Criação de workspace será habilitada após o contrato de RBAC e auditoria"><Users size={16} /> Novo workspace</button></section>
    {error ? <div className={styles.notice}><CircleAlert size={18} /><div><strong>Control plane indisponível</strong><p>Não foi possível carregar os workspaces.</p></div></div> : <section className={styles.list}>{workspaces.map((workspace) => { const checklist = workspace.checklist; return <article className={styles.workspace} key={workspace.workspace_id}><div className={styles.workspaceIcon}><Users size={18} /></div><div className={styles.workspaceMain}><div className={styles.workspaceTitle}><div><strong>{workspace.name}</strong><small>{workspace.workspace_id} · owner: {workspace.owner_id}</small></div><span className={checklist?.complete ? styles.complete : styles.incomplete}>{checklist?.complete ? <><CheckCircle2 size={14} /> Completo</> : <><CircleAlert size={14} /> Pendente</>}</span></div>{checklist?.complete ? <p className={styles.okText}>Integrações, projeto, membros e política de aprovação configurados.</p> : <><p className={styles.pendingText}>Itens pendentes:</p><div className={styles.missing}>{(checklist?.missing ?? []).map((item) => <span key={item}>{item}</span>)}</div></>}</div></article>; })}</section>}
  <MobileNav />
  </main>;
}
