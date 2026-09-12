"use client";

import Link from "next/link";
import { ArrowLeft, CalendarDays, CircleDollarSign, Plus, ShieldCheck, WalletCards, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import styles from "./page.module.css";

type FinanceData = { ok?: boolean; financeEntries?: { entries?: { entry_id: string; entry_type: string; amount_cents: number; category: string; occurred_on: string; description: string }[] }; finance?: { summary?: { income_cents?: number; expense_cents?: number; balance_cents?: number; entries?: number } } };
const brl = (cents = 0) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function FinancePage() {
  const [data, setData] = useState<FinanceData | null>(null);
  const [state, setState] = useState("checking");
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ entry_type: "expense", amount: "", category: "", occurred_on: new Date().toISOString().slice(0, 10), description: "" });
  const load = () => fetch("/api/control-plane").then(async (response) => { const payload = await response.json(); setData(payload); setState(response.ok ? "connected" : "unavailable"); }).catch(() => setState("unavailable"));
  useEffect(() => { const timer = window.setTimeout(load, 0); return () => window.clearTimeout(timer); }, []);
  const summary = data?.finance?.summary;
  const entries = data?.financeEntries?.entries ?? [];
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!window.confirm("Confirma a criação deste lançamento financeiro?")) return;
    const amountCents = Math.round(Number(form.amount.replace(",", ".")) * 100);
    const response = await fetch("/api/control-plane", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "finance_entry", workspace_id: "personal", entry_type: form.entry_type, amount_cents: amountCents, category: form.category, occurred_on: form.occurred_on, description: form.description, confirm: true }) });
    const payload = await response.json();
    if (!response.ok) { setMessage(payload.error || "Não foi possível criar o lançamento."); return; }
    setMessage("Lançamento criado e auditado."); setOpen(false); setForm({ ...form, amount: "", category: "", description: "" }); load();
  }
  return <main className={styles.page}>
    <header className={styles.header}><Link href="/" className={styles.back}><ArrowLeft size={16} /> Visão geral</Link><span className={styles.secure}><ShieldCheck size={14} /> Workspace privado</span></header>
    <section className={styles.hero}><div><p className={styles.kicker}>MÓDULO FINANCEIRO</p><h1>Assistente Financeiro<span>.</span></h1><p className={styles.subtitle}>Organize lançamentos, compromissos e decisões financeiras com o Hermes.</p></div><button className={styles.primary} onClick={() => setOpen(true)}><Plus size={16} /> Novo lançamento</button></section>
    {message && <div className={styles.feedback}>{message}</div>}
    {open && <form className={styles.form} onSubmit={submit}><div className={styles.formHead}><div><p className={styles.kicker}>NOVO LANÇAMENTO</p><h2>Registrar movimentação</h2></div><button type="button" className={styles.close} onClick={() => setOpen(false)}><X size={17} /></button></div><label>Tipo<select value={form.entry_type} onChange={(e) => setForm({ ...form, entry_type: e.target.value })}><option value="expense">Despesa</option><option value="income">Receita</option></select></label><label>Valor (R$)<input required inputMode="decimal" placeholder="0,00" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></label><label>Categoria<input required placeholder="Ex.: alimentação" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></label><label>Data<input required type="date" value={form.occurred_on} onChange={(e) => setForm({ ...form, occurred_on: e.target.value })} /></label><label>Descrição<input required placeholder="Descrição do lançamento" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label><button className={styles.primary} type="submit">Confirmar lançamento</button></form>}
    <div className={styles.notice}><CircleDollarSign size={18} /><div><strong>{state === "connected" ? "Resumo sincronizado com o control plane" : "Conexão financeira pendente"}</strong><p>{state === "connected" ? "Os dados abaixo estão filtrados pelo workspace pessoal." : "Configure o control plane para carregar os dados reais."}</p></div></div>
    <section className={styles.cards}><article><small>RECEITAS NO PERÍODO</small><strong>{data ? brl(summary?.income_cents) : "—"}</strong><span>Este mês</span></article><article><small>DESPESAS NO PERÍODO</small><strong>{data ? brl(summary?.expense_cents) : "—"}</strong><span>Este mês</span></article><article><small>SALDO</small><strong className={(summary?.balance_cents ?? 0) >= 0 ? styles.green : styles.red}>{data ? brl(summary?.balance_cents) : "—"}</strong><span>Receitas menos despesas</span></article><article><small>LANÇAMENTOS</small><strong>{data ? (summary?.entries ?? 0) : "—"}</strong><span>Período atual</span></article></section>
    <section className={styles.entries}><div className={styles.entriesHead}><div><p className={styles.kicker}>HISTÓRICO</p><h2>Lançamentos recentes</h2></div><span>{entries.length} no período</span></div>{entries.length === 0 ? <p className={styles.empty}>Nenhum lançamento registrado neste workspace.</p> : entries.map((entry) => <div className={styles.entry} key={entry.entry_id}><div><strong>{entry.description}</strong><small>{entry.occurred_on} · {entry.category}</small></div><strong className={entry.entry_type === "income" ? styles.green : styles.red}>{entry.entry_type === "income" ? "+" : "-"}{brl(entry.amount_cents)}</strong></div>)}</section>
    <section className={styles.grid}><article className={styles.panel}><div className={styles.panelHead}><div><p className={styles.kicker}>PRIVACIDADE</p><h2>Seu espaço financeiro</h2></div><WalletCards size={21} /></div><p className={styles.copy}>O módulo financeiro possui workspace próprio e não compartilha lançamentos com Instagram, campanhas ou outros clientes.</p><div className={styles.rule}><ShieldCheck size={15} /> Ações destrutivas exigem confirmação</div></article><article className={styles.panel}><div className={styles.panelHead}><div><p className={styles.kicker}>PRÓXIMOS PASSOS</p><h2>Fluxo de caixa</h2></div><CalendarDays size={21} /></div><p className={styles.copy}>Cada lançamento confirmado alimenta o resumo mensal e os relatórios executivos do Binc Orchestrator.</p></article></section>
  </main>;
}
