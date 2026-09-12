import { readFileSync } from "node:fs";
import { join } from "node:path";
import Link from "next/link";
import { ArrowLeft, FileText, ShieldCheck } from "lucide-react";
import styles from "./page.module.css";

const documents = [
  ["PRD do terminal administrativo", "PRD_ADMIN_TERMINAL.md", "Escopo do terminal, contrato de eventos e Sprints 12–17."],
  ["Auditoria do dashboard", "QA_DASHBOARD_AUDIT.md", "Achados funcionais e critérios para corrigir botões e navegação."],
  ["PRD do Hermes Orchestrator", "PRD_HERMES_ORCHESTRATOR.md", "Arquitetura, fronteiras entre projetos e definição de pronto."],
] as const;

function readDocument(fileName: string) {
  return readFileSync(join(process.cwd(), "docs", fileName), "utf8");
}

export default function DocsPage() {
  return <main className={styles.page}>
    <header className={styles.header}><Link href="/" className={styles.back}><ArrowLeft size={16} /> Visão geral</Link><span className={styles.secure}><ShieldCheck size={14} /> Documentação interna</span></header>
    <section className={styles.hero}><div><p className={styles.kicker}>REFERÊNCIAS</p><h1>Documentação<span>.</span></h1><p className={styles.subtitle}>PRDs, auditorias e decisões operacionais completos, exibidos diretamente nesta página.</p></div><FileText size={34} className={styles.heroIcon} /></section>
    <section className={styles.list}>{documents.map(([title, fileName, description]) => <article className={styles.card} key={fileName}><header className={styles.cardHeader}><div className={styles.cardTitle}><FileText size={19} className={styles.icon} /><div><h2>{title}</h2><p>{description}</p></div></div><span className={styles.status}>Disponível</span></header><pre className={styles.document}>{readDocument(fileName)}</pre></article>)}</section>
  </main>;
}
