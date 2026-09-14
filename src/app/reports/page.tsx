"use client";

import Link from "next/link";
import { ArrowLeft, BarChart3, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import MobileNav from "@/components/MobileNav";
import ReportPanel, { type Report } from "@/components/ReportPanel";
import styles from "./page.module.css";

type Project = { project_id: string; name: string };
type Workspace = { workspace_id: string; name: string };
type Data = { report?: Report; projects?: { projects?: Project[] }; onboarding?: { workspaces?: Workspace[] } };

export default function ReportsPage() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => { const timer = window.setTimeout(() => { fetch("/api/control-plane", { cache: "no-store" }).then(async (response) => { if (!response.ok) throw new Error(); setData(await response.json()); }).catch(() => setError(true)); }, 0); return () => window.clearTimeout(timer); }, []);
  return <main className={styles.page}>
    <header className={styles.header}><Link href="/#reports" className={styles.back}><ArrowLeft size={16} /> Binc OS</Link><span className={styles.secure}><ShieldCheck size={14} /> Relatório auditável</span></header>
    <section className={styles.hero}><div><p className={styles.kicker}>RELATÓRIOS</p><h1>Visão executiva<span>.</span></h1><p className={styles.subtitle}>A mesma experiência de filtros e exportação disponível no shell web e no mobile.</p></div><BarChart3 size={34} className={styles.heroIcon} /></section>
    {error ? <div className={styles.notice}><BarChart3 size={18} /><div><strong>Relatório indisponível</strong><p>O control plane não respondeu.</p></div></div> : <ReportPanel initialReport={data?.report} projects={data?.projects?.projects} workspaces={data?.onboarding?.workspaces} />}
    <MobileNav />
  </main>;
}
