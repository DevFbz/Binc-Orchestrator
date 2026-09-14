"use client";

import { CalendarRange, FileText, Filter } from "lucide-react";
import { useMemo, useState } from "react";
import styles from "./ReportPanel.module.css";

type Project = { project_id: string; name: string };
type Workspace = { workspace_id: string; name: string };
export type Report = { period?: { start: string; end: string }; sources?: string[]; limitations?: string[]; sections?: { projects?: { total: number }; jobs?: { summary?: { total: number; active: number; paused: number } }; campaigns?: { total: number; published: number }; finance?: { income_cents: number; expense_cents: number; balance_cents: number } } };

type Props = { initialReport?: Report; projects?: Project[]; workspaces?: Workspace[]; compact?: boolean };
const brl = (cents = 0) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function ReportPanel({ initialReport, projects = [], workspaces = [], compact = false }: Props) {
  const [report, setReport] = useState<Report | undefined>(initialReport);
  const [filters, setFilters] = useState({ start: "", end: "", workspace_id: workspaces[0]?.workspace_id ?? "personal", project_id: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const viewReport = report ?? initialReport;
  const query = useMemo(() => { const next = new URLSearchParams({ workspace_id: filters.workspace_id }); if (filters.start) next.set("start", filters.start); if (filters.end) next.set("end", filters.end); if (filters.project_id) next.set("project_id", filters.project_id); return next; }, [filters]);
  async function applyFilters() { setLoading(true); setMessage(""); try { const response = await fetch(`/api/reports/overview?${query.toString()}`, { cache: "no-store" }); if (!response.ok) throw new Error("Não foi possível atualizar o relatório."); setReport(await response.json()); setMessage("Relatório atualizado."); } catch (error) { setMessage(error instanceof Error ? error.message : "Relatório indisponível."); } finally { setLoading(false); } }
  const csv = `/api/reports/export?format=csv&${query.toString()}`;
  const pdf = `/api/reports/export?format=pdf&${query.toString()}`;
  return <section className={`${styles.panel} ${compact ? styles.compact : ""}`}>
    <div className={styles.heading}><div><p className={styles.kicker}>RELATÓRIO EXECUTIVO</p><h2>Dados no escopo selecionado</h2></div><div className={styles.exports}><a href={csv} download><FileText size={14} /> Exportar CSV</a><a href={pdf} download><FileText size={14} /> Exportar PDF</a></div></div>
    <div className={styles.filters}><div className={styles.filterTitle}><Filter size={14} /><strong>Filtros</strong></div><label>Início<input type="date" value={filters.start} onChange={(event) => setFilters({ ...filters, start: event.target.value })} /></label><label>Fim<input type="date" value={filters.end} onChange={(event) => setFilters({ ...filters, end: event.target.value })} /></label><label>Workspace<select value={filters.workspace_id} onChange={(event) => setFilters({ ...filters, workspace_id: event.target.value })}>{workspaces.map((workspace) => <option key={workspace.workspace_id} value={workspace.workspace_id}>{workspace.name}</option>)}{!workspaces.length && <option value="personal">personal</option>}</select></label><label>Projeto<select value={filters.project_id} onChange={(event) => setFilters({ ...filters, project_id: event.target.value })}><option value="">Todos</option>{projects.map((project) => <option key={project.project_id} value={project.project_id}>{project.name}</option>)}</select></label><button type="button" onClick={applyFilters} disabled={loading}>{loading ? "Atualizando…" : "Aplicar filtros"}</button></div>
    {message && <p className={styles.message} aria-live="polite">{message}</p>}
    <div className={styles.period}><CalendarRange size={14} /> <span>Período</span><strong>{viewReport?.period?.start ?? "—"}</strong><em>até</em><strong>{viewReport?.period?.end ?? "—"}</strong></div>
    <div className={styles.metrics}><div><small>PROJETOS</small><strong>{viewReport?.sections?.projects?.total ?? "—"}</strong></div><div><small>JOBS</small><strong>{viewReport?.sections?.jobs?.summary?.total ?? "—"}</strong></div><div><small>CAMPANHAS</small><strong>{viewReport?.sections?.campaigns?.total ?? "—"}</strong></div><div><small>SALDO</small><strong>{viewReport ? brl(viewReport.sections?.finance?.balance_cents) : "—"}</strong></div></div>
    <div className={styles.sources}><span>Fontes:</span>{(viewReport?.sources ?? []).map((source) => <b key={source}>{source}</b>)}</div>
  </section>;
}
