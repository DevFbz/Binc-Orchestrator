import Link from "next/link";
import { ArrowLeft, FileText, ShieldCheck } from "lucide-react";
import styles from "./page.module.css";

const documents = [
  ["PRD do terminal administrativo", "/docs/PRD_ADMIN_TERMINAL.md", "Escopo do terminal, contrato de eventos e Sprints 12–17."],
  ["Auditoria do dashboard", "/docs/QA_DASHBOARD_AUDIT.md", "Achados funcionais e critérios para corrigir botões e navegação."],
  ["PRD do Hermes Orchestrator", "/docs/PRD_HERMES_ORCHESTRATOR.md", "Arquitetura, fronteiras entre projetos e definição de pronto."],
] as const;

export default function DocsPage() {
  return <main className={styles.page}>
    <header className={styles.header}><Link href="/" className={styles.back}><ArrowLeft size={16} /> Visão geral</Link><span className={styles.secure}><ShieldCheck size={14} /> Documentação interna</span></header>
    <section className={styles.hero}><div><p className={styles.kicker}>REFERÊNCIAS</p><h1>Documentação<span>.</span></h1><p className={styles.subtitle}>PRDs, auditorias e decisões operacionais do Binc Orchestrator.</p></div><FileText size={34} className={styles.heroIcon} /></section>
    <section className={styles.list}>{documents.map(([title, href, description]) => <article className={styles.card} key={href}><FileText size={19} className={styles.icon} /><div><h2>{title}</h2><p>{description}</p></div><Link href={href} className={styles.open}>Abrir arquivo</Link></article>)}</section>
  </main>;
}
