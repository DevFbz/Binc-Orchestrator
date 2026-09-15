"use client";

import Link from "next/link";
import { Activity, ArrowUpRight, Bot, ShieldCheck, Workflow, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import MobileNav from "@/components/MobileNav";
import styles from "./page.module.css";

type Project = { project_id: string; name: string; description?: string; status: string };
type Job = { job_id: string; name: string; status: string; schedule: string; next_action: string };
type AuditEvent = { timestamp?: string; action?: string; project_id?: string; result?: string };
type Service = { service: string; status: string };
type Data = { overview?: { totals?: { campaigns?: number; published?: number } }; projects?: { projects?: Project[] }; jobs?: { jobs?: Job[]; summary?: { total?: number; active?: number } }; health?: { services?: Service[] }; audit?: { events?: AuditEvent[] } };

const formatTime = (value?: string) => value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(value)) : "—";
const getGreeting = (date: Date) => { const hour = Number(new Intl.DateTimeFormat("pt-BR", { hour: "numeric", hourCycle: "h23", timeZone: "America/Sao_Paulo" }).format(date)); if (hour >= 5 && hour < 12) return "Bom dia"; if (hour >= 12 && hour < 18) return "Boa tarde"; if (hour < 5) return "Boa madrugada"; return "Boa noite"; };

export default function Home() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => { const update = () => setNow(new Date()); update(); const timer = window.setInterval(update, 60_000); return () => window.clearInterval(timer); }, []);
  useEffect(() => { const timer = window.setTimeout(() => { fetch("/api/control-plane", { cache: "no-store" }).then(async (response) => { if (!response.ok) throw new Error(); setData(await response.json()); }).catch(() => setError(true)); }, 0); return () => window.clearTimeout(timer); }, []);
  const projects = data?.projects?.projects ?? [];
  const jobs = data?.jobs?.jobs ?? [];
  const services = data?.health?.services ?? [];
  const audit = data?.audit?.events ?? [];
  const totals = data?.overview?.totals;
  const healthy = services.filter((item) => item.status === "operational").length;
  return <main className={styles.page}>
    <header className={styles.header}><div><p className={styles.kicker}>VISÃO GERAL</p><h1>{now ? `${getGreeting(now)}, Breno` : "Olá, Breno"}</h1><p>Estado consolidado de projetos, automações e serviços conectados.</p></div><span className={styles.live}><i /> {error ? "Control plane indisponível" : "Control plane conectado"}</span></header>
    {error ? <div className={styles.notice}><XCircle size={18} /><div><strong>Dados indisponíveis</strong><p>Não foi possível consultar o control plane. Nenhuma métrica foi substituída por dados locais.</p></div></div> : <><section className={styles.metrics}><article><small>PROJETOS</small><strong>{projects.length || "—"}</strong><span>registrados</span></article><article><small>AUTOMAÇÕES</small><strong>{data?.jobs?.summary?.active ?? "—"}</strong><span>ativas agora</span></article><article><small>CAMPANHAS</small><strong>{totals?.campaigns ?? "—"}</strong><span>no Instagram</span></article><article><small>SERVIÇOS</small><strong>{services.length ? `${healthy}/${services.length}` : "—"}</strong><span>operacionais</span></article></section>
    <section className={styles.grid}><section className={styles.panel}><div className={styles.panelHead}><div><p className={styles.kicker}>PROJETOS</p><h2>Onde operar</h2></div><Link href="/projects">Ver projetos <ArrowUpRight size={14} /></Link></div><div className={styles.projectList}>{projects.map((project) => <Link className={styles.project} href={`/projects/${project.project_id}`} key={project.project_id}><div><strong>{project.name}</strong><small>{project.description ?? "Sem descrição"}</small></div><span className={project.status === "operational" ? styles.ok : styles.warning}>{project.status}</span></Link>)}</div></section><section className={styles.panel}><div className={styles.panelHead}><div><p className={styles.kicker}>AUTOMAÇÕES</p><h2>Próximas ações</h2></div><Link href="/jobs">Abrir automações <ArrowUpRight size={14} /></Link></div><div className={styles.jobList}>{jobs.slice(0, 4).map((job) => <article className={styles.job} key={job.job_id}><Workflow size={15} /><div><strong>{job.name}</strong><small>{job.schedule} · {job.next_action}</small></div><span className={job.status === "active" ? styles.ok : styles.warning}>{job.status}</span></article>)}</div></section></section>
    <section className={styles.panel}><div className={styles.panelHead}><div><p className={styles.kicker}>AUDITORIA</p><h2>Atividade recente</h2></div><Link href="/history">Histórico completo <ArrowUpRight size={14} /></Link></div><div className={styles.audit}>{audit.slice(-6).reverse().map((item, index) => <article key={`${item.timestamp}-${index}`}><Activity size={14} /><div><strong>{item.action ?? "Evento operacional"}</strong><small>{item.project_id ?? "sem projeto"} · {formatTime(item.timestamp)}</small></div><span>{item.result ?? "sem resultado"}</span></article>)}</div></section></>}
    <footer className={styles.footer}><ShieldCheck size={13} /> Dados exibidos a partir do control plane · <Bot size={13} /> Hermes mantém o transporte de mensagens.</footer>
    <MobileNav />
  </main>;
}
