"use client";

import Link from "next/link";
import { ArrowLeft, Clock3, ShieldCheck, Workflow, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import styles from "./page.module.css";

type Job = { job_id: string; project_id: string; tenant_id?: string; name: string; status: string; schedule: string; next_action: string; approval_required: boolean };
type Data = { jobs?: { jobs?: Job[]; summary?: { total: number; active: number; paused: number; approval_required: number } } };

const statusConfig: Record<string, { label: string; className: string }> = { active: { label: "Ativo", className: "active" }, paused: { label: "Pausado", className: "paused" }, failed: { label: "Falhou", className: "failed" }, completed: { label: "Concluído", className: "completed" } };

export default function JobsPage() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => { fetch("/api/control-plane").then(async (response) => { if (!response.ok) throw new Error(); setData(await response.json()); }).catch(() => setError(true)); }, []);
  const jobs = data?.jobs?.jobs ?? [];
  const summary = data?.jobs?.summary;
  return <main className={styles.page}>
    <header className={styles.header}><Link href="/" className={styles.back}><ArrowLeft size={16} /> Visão geral</Link><span className={styles.secure}><ShieldCheck size={14} /> Orquestração protegida</span></header>
    <section className={styles.hero}><div><p className={styles.kicker}>AUTOMAÇÕES</p><h1>Jobs do Hermes<span>.</span></h1><p className={styles.subtitle}>Acompanhe os processos que mantêm seus projetos funcionando.</p></div><button className={styles.primary}><Workflow size={16} /> Novo job</button></section>
    {error ? <div className={styles.notice}><XCircle size={18} /><div><strong>Control plane indisponível</strong><p>Não foi possível carregar os jobs agora.</p></div></div> : <><section className={styles.cards}><article><small>TOTAL</small><strong>{summary?.total ?? "—"}</strong><span>Jobs registrados</span></article><article><small>ATIVOS</small><strong className={styles.green}>{summary?.active ?? "—"}</strong><span>Executando normalmente</span></article><article><small>PAUSADOS</small><strong>{summary?.paused ?? "—"}</strong><span>Aguardando configuração</span></article><article><small>COM APROVAÇÃO</small><strong>{summary?.approval_required ?? "—"}</strong><span>Exigem decisão humana</span></article></section><section className={styles.list}>{jobs.map((job) => { const config = statusConfig[job.status] ?? statusConfig.paused; return <article className={styles.job} key={job.job_id}><div className={styles.jobIcon}><Workflow size={18} /></div><div className={styles.jobMain}><div className={styles.jobTitle}><strong>{job.name}</strong><span className={`${styles.jobStatus} ${styles[config.className]}`}>{config.label}</span></div><p>{job.project_id}{job.tenant_id ? ` · ${job.tenant_id}` : ""}</p><div className={styles.jobMeta}><span><Clock3 size={13} /> {job.schedule}</span><span>{job.next_action}</span>{job.approval_required && <span className={styles.approval}><ShieldCheck size={13} /> Aprovação necessária</span>}</div></div></article>; })}</section></>}
  </main>;
}
