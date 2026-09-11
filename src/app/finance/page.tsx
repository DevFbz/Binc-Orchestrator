"use client";

import Link from "next/link";
import { ArrowLeft, CalendarDays, CircleDollarSign, Plus, ShieldCheck, WalletCards } from "lucide-react";
import { useEffect, useState } from "react";
import styles from "./page.module.css";

type FinanceData = { ok?: boolean; finance?: { summary?: { income_cents?: number; expense_cents?: number; balance_cents?: number; entries?: number } } };
const brl = (cents = 0) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function FinancePage() {
  const [data, setData] = useState<FinanceData | null>(null);
  const [state, setState] = useState("checking");
  useEffect(() => { fetch("/api/control-plane").then(async (response) => { const payload = await response.json(); setData(payload); setState(response.ok ? "connected" : "unavailable"); }).catch(() => setState("unavailable")); }, []);
  const summary = data?.finance?.summary;
  return <main className={styles.page}>
    <header className={styles.header}><Link href="/" className={styles.back}><ArrowLeft size={16} /> Visão geral</Link><span className={styles.secure}><ShieldCheck size={14} /> Workspace privado</span></header>
    <section className={styles.hero}><div><p className={styles.kicker}>MÓDULO FINANCEIRO</p><h1>Assistente Financeiro<span>.</span></h1><p className={styles.subtitle}>Organize lançamentos, compromissos e decisões financeiras com o Hermes.</p></div><button className={styles.primary}><Plus size={16} /> Novo lançamento</button></section>
    <div className={styles.notice}><CircleDollarSign size={18} /><div><strong>{state === "connected" ? "Resumo sincronizado com o control plane" : "Conexão financeira pendente"}</strong><p>{state === "connected" ? "Os dados abaixo estão filtrados pelo workspace pessoal." : "Configure o control plane para carregar os dados reais."}</p></div></div>
    <section className={styles.cards}><article><small>RECEITAS NO PERÍODO</small><strong>{data ? brl(summary?.income_cents) : "—"}</strong><span>Este mês</span></article><article><small>DESPESAS NO PERÍODO</small><strong>{data ? brl(summary?.expense_cents) : "—"}</strong><span>Este mês</span></article><article><small>SALDO</small><strong className={(summary?.balance_cents ?? 0) >= 0 ? styles.green : styles.red}>{data ? brl(summary?.balance_cents) : "—"}</strong><span>Receitas menos despesas</span></article><article><small>LANÇAMENTOS</small><strong>{data ? (summary?.entries ?? 0) : "—"}</strong><span>Período atual</span></article></section>
    <section className={styles.grid}><article className={styles.panel}><div className={styles.panelHead}><div><p className={styles.kicker}>PRIVACIDADE</p><h2>Seu espaço financeiro</h2></div><WalletCards size={21} /></div><p className={styles.copy}>O módulo financeiro possui workspace próprio e não compartilha lançamentos com Instagram, campanhas ou outros clientes.</p><div className={styles.rule}><ShieldCheck size={15} /> Ações destrutivas exigem confirmação</div></article><article className={styles.panel}><div className={styles.panelHead}><div><p className={styles.kicker}>PRÓXIMOS PASSOS</p><h2>Comece pelo primeiro lançamento</h2></div><CalendarDays size={21} /></div><p className={styles.copy}>Adicione receitas e despesas com data, categoria, conta e descrição para habilitar relatórios e fluxo de caixa.</p><button className={styles.secondary}><Plus size={15} /> Criar lançamento</button></article></section>
  </main>;
}
