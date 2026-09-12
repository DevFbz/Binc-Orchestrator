"use client";

import Link from "next/link";
import { ArrowLeft, Bot, CheckCheck, Clock3, Inbox, LockKeyhole, MessageSquare, MoreHorizontal, Paperclip, Search, Send, ShieldCheck, UserRound, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "horário não informado";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
}

export default function TerminalPage() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetch("/api/control-plane", { cache: "no-store" })
        .then(async (response) => { if (!response.ok) throw new Error(); setData(await response.json()); })
        .catch(() => setError(true));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  const events = useMemo(() => data?.telegramEvents?.events ?? [], [data]);
  const visibleEvents = useMemo(() => events.filter((event) => !search.trim() || `${event.text ?? ""} ${event.campaign_id ?? ""} ${event.post_id ?? ""}`.toLocaleLowerCase("pt-BR").includes(search.trim().toLocaleLowerCase("pt-BR"))), [events, search]);
  const inbound = events.filter((event) => event.direction !== "outbound").length;
  const outbound = events.filter((event) => event.direction === "outbound").length;

  return <main className={styles.page}>
    <header className={styles.header}><Link href="/" className={styles.back}><ArrowLeft size={16} /> Visão geral</Link><span className={styles.secure}><ShieldCheck size={14} /> Ambiente protegido · somente leitura</span></header>
    <section className={styles.hero}><div><p className={styles.kicker}>TELEGRAM · INSTAGRAM</p><h1>Terminal de conversas<span>.</span></h1><p className={styles.subtitle}>Acompanhe a conversa real do fluxo de posts com contexto operacional, identidade protegida e estado de entrega.</p></div><div className={styles.heroBadge}><span className={styles.liveDot} /> Gateway conectado</div></section>
    <div className={styles.workspaceBar}><div className={styles.workspaceIdentity}><span className={styles.workspaceAvatar}><Bot size={17} /></span><div><strong>Magú Moto Peças Filho</strong><span>Instagram Content Operations · Telegram</span></div></div><div className={styles.scope}><Inbox size={15} /> Eventos persistidos pelo Hermes Gateway</div></div>
    <section className={styles.stats}><div><small>EVENTOS</small><strong>{events.length}</strong><span>nesta consulta</span></div><div><small>RECEBIDAS</small><strong>{inbound}</strong><span>mensagens do usuário</span></div><div><small>RESPONDIDAS</small><strong>{outbound}</strong><span>respostas do Hermes</span></div><div><small>ESCOPO</small><strong>IG</strong><span>sem dados financeiros</span></div></section>
    {error ? <div className={styles.notice}><XCircle size={18} /><div><strong>Terminal indisponível</strong><p>O control plane não respondeu. Nenhum dado local foi usado como substituto.</p></div></div> : <section className={styles.chatShell}>
      <div className={styles.chatHeader}><div><p className={styles.chatKicker}>CONVERSA ATIVA</p><h2>Solicitação de conteúdo Instagram</h2><span><span className={styles.onlineDot} /> Sincronização automática · identidade {maskReference(events[0]?.external_user_ref)}</span></div><button className={styles.iconButton} aria-label="Mais opções" disabled><MoreHorizontal size={18} /></button></div>
      <div className={styles.toolbar}><div className={styles.search}><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar nesta conversa" aria-label="Buscar nesta conversa" /></div><span>{visibleEvents.length} evento(s)</span></div>
      <div className={styles.messages}>
        {visibleEvents.length ? visibleEvents.map((event) => { const isBot = event.direction === "outbound"; return <article className={`${styles.messageRow} ${isBot ? styles.messageRowBot : styles.messageRowUser}`} key={event.event_id}><div className={`${styles.avatar} ${isBot ? styles.bot : styles.user}`}>{isBot ? <Bot size={16} /> : <UserRound size={16} />}</div><div className={styles.messageBlock}><div className={styles.messageAuthor}>{isBot ? "Hermes" : "Usuário"}<span>{formatDate(event.occurred_at)}</span></div><div className={`${styles.bubble} ${isBot ? styles.bubbleBot : styles.bubbleUser}`}><p>{event.text || "Mensagem sem texto"}</p><div className={styles.bubbleMeta}><span>{event.campaign_id || event.post_id ? `campanha/post: ${event.campaign_id || event.post_id}` : "campanha/post ainda não identificado"}</span>{isBot && <CheckCheck size={13} />}</div></div><small className={styles.messageFoot}>{maskReference(event.external_user_ref)} · {event.delivery_status ?? "status não informado"}</small></div></article>; }) : <div className={styles.empty}><MessageSquare size={22} /><strong>{search ? "Nenhum evento encontrado" : "Nenhum evento de Telegram disponível"}</strong><p>{search ? "Tente buscar por outro termo." : "Quando houver atividade, ela aparecerá aqui."}</p></div>}
      </div>
      <div className={styles.composer}><div className={styles.composerInput}><LockKeyhole size={15} /><span>Respostas administrativas estarão disponíveis na Sprint 15</span></div><button aria-label="Anexar arquivo" disabled><Paperclip size={17} /></button><button className={styles.sendButton} aria-label="Enviar mensagem" disabled><Send size={16} /></button></div>
    </section>}
    <footer className={styles.footer}><Clock3 size={13} /> Atualização consultada pelo control plane · <LockKeyhole size={13} /> Sem envio, anexos ou mutações nesta etapa</footer>
  </main>;
}
