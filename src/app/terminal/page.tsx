"use client";

import Link from "next/link";
import { ArrowLeft, Bot, Inbox, MessageSquare, ShieldCheck, UserRound, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import styles from "./page.module.css";

type Event = {
  event_id?: string;
  occurred_at?: string;
  direction?: "inbound" | "outbound";
  actor_type?: string;
  text?: string;
  delivery_status?: string;
  external_user_ref?: string;
  campaign_id?: string | null;
  post_id?: string | null;
};
type Data = { telegramEvents?: { events?: Event[] } };

function maskReference(value?: string) {
  if (!value) return "usuário não identificado";
  if (value.length <= 4) return "••••";
  return `${value.slice(0, 2)}••••${value.slice(-2)}`;
}

function formatDate(value?: string) {
  if (!value) return "horário não informado";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export default function TerminalPage() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetch("/api/control-plane", { cache: "no-store" })
        .then(async (response) => { if (!response.ok) throw new Error(); setData(await response.json()); })
        .catch(() => setError(true));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  const events = data?.telegramEvents?.events ?? [];
  return <main className={styles.page}>
    <header className={styles.header}>
      <Link href="/" className={styles.back}><ArrowLeft size={16} /> Visão geral</Link>
      <span className={styles.secure}><ShieldCheck size={14} /> Somente leitura</span>
    </header>
    <section className={styles.hero}>
      <div><p className={styles.kicker}>TELEGRAM · INSTAGRAM</p><h1>Terminal administrativo<span>.</span></h1><p className={styles.subtitle}>Acompanhe as mensagens do fluxo de criação e publicação de posts, sem expor conversas financeiras.</p></div>
      <Bot size={36} className={styles.heroIcon} />
    </section>
    <div className={styles.scope}><Inbox size={16} /><span><strong>Escopo ativo:</strong> Magú Moto Peças Filho · eventos persistidos pelo Hermes Gateway</span></div>
    {error ? <div className={styles.notice}><XCircle size={18} /><div><strong>Terminal indisponível</strong><p>O control plane não respondeu. Nenhum dado local foi usado como substituto.</p></div></div> : <section className={styles.list}>
      {events.length ? events.map((event) => <article className={styles.event} key={event.event_id}>
        <div className={`${styles.avatar} ${event.direction === "outbound" ? styles.bot : styles.user}`}>{event.direction === "outbound" ? <Bot size={16} /> : <UserRound size={16} />}</div>
        <div className={styles.content}><div className={styles.meta}><strong>{event.direction === "outbound" ? "Hermes" : "Usuário"}</strong><span>{formatDate(event.occurred_at)}</span><em>{event.delivery_status ?? "status não informado"}</em></div><p className={styles.text}>{event.text || "Mensagem sem texto"}</p><small>{maskReference(event.external_user_ref)} · {event.campaign_id || event.post_id ? `campanha/post: ${event.campaign_id || event.post_id}` : "campanha/post ainda não identificado"}</small></div>
      </article>) : <div className={styles.empty}><MessageSquare size={20} /><p>Nenhum evento de Telegram disponível para este workspace.</p></div>}
    </section>}
    <footer className={styles.footer}>Composer, anexos e respostas administrativas pertencem à Sprint 15 e continuam bloqueados nesta tela.</footer>
  </main>;
}
