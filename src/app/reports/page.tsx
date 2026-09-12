"use client";

import Link from "next/link";
import { ArrowLeft, BarChart3, CalendarRange, FileText, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import MobileNav from "@/components/MobileNav";
import styles from "./page.module.css";

type Report = { period: { start: string; end: string }; sources: string[]; limitations: string[]; sections: { projects?: { total: number }; jobs?: { summary?: { total: number; active: number; paused: number } }; campaigns?: { total: number; published: number }; finance?: { income_cents: number; expense_cents: number; balance_cents: number } } };
type Data = { report?: Report };
const brl = (cents = 0) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function ReportsPage() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => { const timer = window.setTimeout(() => { fetch("/api/control-plane").then(async (response) => { if (!response.ok) throw new Error(); setData(await response.json()); }).catch(() => setError(true)); }, 0); return () => window.clearTimeout(timer); }, []);
  const report = data?.report;
  return <main className={styles.page}>
    <header className={styles.header}><Link href="/" className={styles.back}><ArrowLeft size={16} /> Visão geral</Link><span className={styles.secure}><ShieldCheck size={14} /> Relatório auditável</span></header>
    <section className={styles.hero}><div><p className={styles.kicker}>RELATÓRIOS</p><h1>Visão executiva<span>.</span></h1><p className={styles.subtitle}>Uma leitura consolidada da operação, com período, fontes e limitações declarados.</p></div><a className={styles.primary} href="/api/reports/export?format=csv" download><FileText size={16} /> Exportar CSV</a></section>
    {error ? <div className={styles.notice}><BarChart3 size={18} /><div><strong>Relatório indisponível</strong><p>O control plane não respondeu para este período.</p></div></div> : <><div className={styles.period}><CalendarRange size={16} /> Período: <strong>{report?.period.start ?? "—"}</strong> até <strong>{report?.period.end ?? "—"}</strong></div><section className={styles.cards}><article><small>PROJETOS</small><strong>{report?.sections.projects?.total ?? "—"}</strong><span>Registrados no control plane</span></article><article><small>JOBS</small><strong>{report?.sections.jobs?.summary?.total ?? "—"}</strong><span>{report?.sections.jobs?.summary?.active ?? 0} ativos</span></article><article><small>CAMPANHAS</small><strong>{report?.sections.campaigns?.total ?? "—"}</strong><span>{report?.sections.campaigns?.published ?? 0} publicadas</span></article><article><small>SALDO FINANCEIRO</small><strong>{report ? brl(report.sections.finance?.balance_cents) : "—"}</strong><span>Workspace pessoal</span></article></section><section className={styles.grid}><article className={styles.panel}><p className={styles.kicker}>FONTES</p><h2>Origem dos dados</h2><div className={styles.tags}>{(report?.sources ?? []).map((source) => <span key={source}>{source}</span>)}</div></article><article className={styles.panel}><p className={styles.kicker}>LIMITAÇÕES</p><h2>Interpretação</h2><ul>{(report?.limitations ?? []).map((item) => <li key={item}>{item}</li>)}</ul></article></section></>}
  <MobileNav />
  </main>;
}
