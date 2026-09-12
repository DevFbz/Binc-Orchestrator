"use client";

import Link from "next/link";
import { ArrowLeft, Bot, Inbox, MessageSquare, Search, ShieldCheck, UserRound, XCircle } from "lucide-react";
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
  campaign_candidates?: { campaign_id: string; confidence: number; selected: boolean }[];
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
  const [query, setQuery] = useState("");
  const [deliveryStatus, setDeliveryStatus] = useState("");
  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetch("/api/control-plane", { cache: "no-store" })
        .then(async (response) => { if (!response.ok) throw new Error(); setData(await response.json()); })
        .catch(() => setError(true));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  const events = data?.telegramEvents?.events ?? [];
  const filteredEvents = events.filter((event) => {
    const haystack = [event.text, event.external_user_ref, event.campaign_id, event.post_id].filter(Boolean).join(" ").toLocaleLowerCase();
    return (!query.trim() || haystack.includes(query.trim().toLocaleLowerCase())) && (!deliveryStatus || event.delivery_status === deliveryStatus);
  });
  return <main className={styles.page}>
    <header className={styles.header}><Link href="/" className={styles.back}><ArrowLeft size={16} /> Visão geral</Link><span className={styles.secure}><ShieldCheck size={14} /> Somente leitura</span></header>
    <section className={styles.hero}><div><p className={styles.kicker}>TELEGRAM · INSTAGRAM</p><h1>Terminal administrativo<span>.</span></h1><p className={styles.subtitle}>Acompanhe as mensagens do fluxo de criação e publicação de posts, sem expor conversas financeiras.</p></div><Bot size={36} className={styles.heroIcon} /></section>
    <div className={styles.scope}><Inbox size={16} /><span><strong>Escopo ativo:</strong> Magú Moto Peças Filho · eventos persistidos pelo Hermes Gateway</span></div>
    <div className={styles.filters}><label><Search size={15} /><input aria-label="Buscar eventos" placeholder="Buscar por texto, usuário ou campanha" value={query} onChange={(event) => setQuery(event.target.value)} /></label><select aria-label="Filtrar por entrega" value={deliveryStatus} onChange={(event) => setDeliveryStatus(event.target.value)}><option value="">Todos os estados</option><option value="received">Recebido</option><option value="queued">Na fila</option><option value="sent">Enviado</option><option value="failed">Falhou</option><option value="unknown">Desconhecido</option></select><span>{filteredEvents.length} evento(s)</span></div>
    {error ? <div className={styles.notice}><XCircle size={18} /><div><strong>Terminal indisponível</strong><p>O control plane não respondeu. Nenhum dado local foi usado como substituto.</p></div></div> : <section className={styles.list}>
      {filteredEvents.length ? filteredEvents.map((event) => <article className={styles.event} key={event.event_id}><div className={`${styles.avatar} ${event.direction === "outbound" ? styles.bot : styles.user}`}>{event.direction === "outbound" ? <Bot size={16} /> : <UserRound size={16} />}</div><div className={styles.content}><div className={styles.meta}><strong>{event.direction === "outbound" ? "Hermes" : "Usuário"}</strong><span>{formatDate(event.occurred_at)}</span><em>{event.delivery_status ?? "status não informado"}</em></div><p className={styles.text}>{event.text || "Mensagem sem texto"}</p><small>{maskReference(event.external_user_ref)} · {event.campaign_id || event.post_id ? `campanha/post: ${event.campaign_id || event.post_id}` : "campanha/post ainda não identificado"}</small>{event.campaign_candidates?.length ? <div className={styles.candidates}><span>candidatos:</span>{event.campaign_candidates.map((candidate) => <em key={candidate.campaign_id}>{candidate.campaign_id} · {Math.round(candidate.confidence * 100)}%{candidate.selected ? " · recomendado" : ""}</em>)}</div> : null}</div></article>) : <div className={styles.empty}><MessageSquare size={20} /><p>{events.length ? "Nenhum evento corresponde aos filtros atuais." : "Nenhum evento de Telegram disponível para este workspace."}</p></div>}
    </section>}
    <footer className={styles.footer}>Composer, anexos e respostas administrativas pertencem à Sprint 15 e continuam bloqueados nesta tela.</footer>
  </main>;
}
