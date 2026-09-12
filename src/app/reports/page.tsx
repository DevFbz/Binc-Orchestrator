"use client";

import Link from "next/link";
import { ArrowLeft, BarChart3, CalendarRange, FileText, Filter, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import MobileNav from "@/components/MobileNav";
import styles from "./page.module.css";

type Report = { period: { start: string; end: string }; sources: string[]; limitations: string[]; sections: { projects?: { total: number }; jobs?: { summary?: { total: number; active: number; paused: number } }; campaigns?: { total: number; published: number }; finance?: { income_cents: number; expense_cents: number; balance_cents: number } } };
type Project = { project_id: string; name: string };
type Workspace = { workspace_id: string; name: string };
type Data = { report?: Report; projects?: { projects?: Project[] }; onboarding?: { workspaces?: Workspace[] } };
const brl = (cents = 0) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function ReportsPage() {
  const [data, setData] = useState<Data | null>(null);
  const [filters, setFilters] = useState({ start: "", end: "", workspace_id: "personal", project_id: "" });
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  useEffect(() => { const timer = window.setTimeout(() => { fetch("/api/control-plane", { cache: "no-store" }).then(async (response) => { if (!response.ok) throw new Error(); setData(await response.json()); }).catch(() => setError(true)); }, 0); return () => window.clearTimeout(timer); }, []);
  const report = data?.report;
  const workspaces = data?.onboarding?.workspaces ?? [];
  const projects = data?.projects?.projects ?? [];
  const exportQuery = new URLSearchParams({ format: "csv", workspace_id: filters.workspace_id });
  if (filters.start) exportQuery.set("start", filters.start);
  if (filters.end) exportQuery.set("end", filters.end);
  if (filters.project_id) exportQuery.set("project_id", filters.project_id);
  async function applyFilters() { setLoading(true); setError(false); const query = new URLSearchParams({ workspace_id: filters.workspace_id }); if (filters.start) query.set("start", filters.start); if (filters.end) query.set("end", filters.end); if (filters.project_id) query.set("project_id", filters.project_id); try { const response = await fetch(`/api/reports/overview?${query}`, { cache: "no-store" }); if (!response.ok) throw new Error(); const nextReport = await response.json(); setData((current) => ({ ...(current ?? {}), report: nextReport })); } catch { setError(true); } finally { setLoading(false); } }
  return <main className={styles.page}>
    <header className={styles.header}><Link href="/" className={styles.back}><ArrowLeft size={16} /> Visão geral</Link><span className={styles.secure}><ShieldCheck size={14} /> Relatório auditável</span></header>
    <section className={styles.hero}><div><p className={styles.kicker}>RELATÓRIOS</p><h1>Visão executiva<span>.</span></h1><p className={styles.subtitle}>Uma leitura consolidada da operação, com período, fontes e limitações declarados.</p></div><div className={styles.exportActions}><a className={styles.primary} href={`/api/reports/export?${exportQuery.toString()}`} download><FileText size={16} /> CSV</a><a className={styles.secondary} href={`/api/reports/export?${exportQuery.toString().replace("format=csv", "format=pdf")}`} download><FileText size={16} /> PDF</a></div></section>
    <section className={styles.filters}><div className={styles.filterTitle}><Filter size={15} /><strong>Filtrar relatório</strong></div><label>Início<input type="date" value={filters.start} onChange={(event) => setFilters({ ...filters, start: event.target.value })} /></label><label>Fim<input type="date" value={filters.end} onChange={(event) => setFilters({ ...filters, end: event.target.value })} /></label><label>Workspace<select value={filters.workspace_id} onChange={(event) => setFilters({ ...filters, workspace_id: event.target.value })}>{workspaces.map((workspace) => <option key={workspace.workspace_id} value={workspace.workspace_id}>{workspace.name}</option>)}{!workspaces.length && <option value="personal">personal</option>}</select></label><label>Projeto<select value={filters.project_id} onChange={(event) => setFilters({ ...filters, project_id: event.target.value })}><option value="">Todos os projetos</option>{projects.map((project) => <option key={project.project_id} value={project.project_id}>{project.name}</option>)}</select></label><button className={styles.apply} type="button" onClick={applyFilters} disabled={loading}>{loading ? "Atualizando…" : "Aplicar filtros"}</button></section>
    {error ? <div className={styles.notice}><BarChart3 size={18} /><div><strong>Relatório indisponível</strong><p>O control plane não respondeu para este filtro.</p></div></div> : <><div className={styles.period}><CalendarRange size={16} /> Período: <strong>{report?.period.start ?? "—"}</strong> até <strong>{report?.period.end ?? "—"}</strong></div><section className={styles.cards}><article><small>PROJETOS</small><strong>{report?.sections.projects?.total ?? "—"}</strong><span>Registrados no escopo</span></article><article><small>JOBS</small><strong>{report?.sections.jobs?.summary?.total ?? "—"}</strong><span>{report?.sections.jobs?.summary?.active ?? 0} ativos</span></article><article><small>CAMPANHAS</small><strong>{report?.sections.campaigns?.total ?? "—"}</strong><span>{report?.sections.campaigns?.published ?? 0} publicadas</span></article><article><small>SALDO FINANCEIRO</small><strong>{report ? brl(report.sections.finance?.balance_cents) : "—"}</strong><span>Escopo financeiro selecionado</span></article></section><section className={styles.grid}><article className={styles.panel}><p className={styles.kicker}>FONTES</p><h2>Origem dos dados</h2><div className={styles.tags}>{(report?.sources ?? []).map((source) => <span key={source}>{source}</span>)}</div></article><article className={styles.panel}><p className={styles.kicker}>LIMITAÇÕES</p><h2>Interpretação</h2><ul>{(report?.limitations ?? []).map((item) => <li key={item}>{item}</li>)}</ul></article></section></>}
    <MobileNav />
  </main>;
}
