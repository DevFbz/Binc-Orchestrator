"use client";

import Link from "next/link";
import { ArrowLeft, FileText, ShieldCheck, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import styles from "./page.module.css";

type Event = { timestamp?: string; actor_id?: string; project_id?: string; action?: string; result?: string; details?: Record<string, unknown> };
type Data = { audit?: { events?: Event[] } };

export default function HistoryPage() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => { const timer = window.setTimeout(() => { fetch("/api/control-plane", { cache: "no-store" }).then(async (response) => { if (!response.ok) throw new Error(); setData(await response.json()); }).catch(() => setError(true)); }, 0); return () => window.clearTimeout(timer); }, []);
  const events = data?.audit?.events ?? [];
  return <main className={styles.page}>
    <header className={styles.header}><Link href="/" className={styles.back}><ArrowLeft size={16} /> Visão geral</Link><span className={styles.secure}><ShieldCheck size={14} /> Auditoria protegida</span></header>
    <section className={styles.hero}><div><p className={styles.kicker}>AUDITORIA</p><h1>Histórico operacional<span>.</span></h1><p className={styles.subtitle}>Eventos reais registrados pelo control plane, com origem e resultado.</p></div><FileText size={34} className={styles.heroIcon} /></section>
    {error ? <div className={styles.notice}><XCircle size={18} /><div><strong>Histórico indisponível</strong><p>O control plane não respondeu.</p></div></div> : <section className={styles.list}>{events.length ? events.map((event, index) => <article className={styles.event} key={`${event.timestamp ?? "event"}-${index}`}><span className={styles.dot} /><div><strong>{event.action ?? "Evento"}</strong><p>{event.project_id ?? "sem projeto"} · {event.result ?? "sem resultado"}</p><small>{event.timestamp ?? "Horário não informado"} · {event.actor_id ?? "ator não informado"}</small></div></article>) : <div className={styles.empty}>Nenhum evento de auditoria disponível.</div>}</section>}
  </main>;
}
