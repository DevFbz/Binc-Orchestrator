"use client";

import Link from "next/link";
import { ArrowLeft, Bot, ShieldCheck, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import MobileNav from "@/components/MobileNav";
import TerminalPanel, { type TerminalEvent } from "@/components/TerminalPanel";
import styles from "./page.module.css";

type Data = { telegramEvents?: { events?: TerminalEvent[] }; permissions?: { can_send_telegram?: boolean } };

export default function TerminalPage() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState(false);
  async function load() { try { const response = await fetch("/api/control-plane", { cache: "no-store" }); if (!response.ok) throw new Error(); setData(await response.json()); setError(false); } catch { setError(true); } }
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, []);
  return <main className={styles.page}>
    <header className={styles.header}><Link href="/" className={styles.back}><ArrowLeft size={16} /> Visão geral</Link><span className={styles.secure}><ShieldCheck size={14} /> Terminal administrativo</span></header>
    <section className={styles.hero}><div><p className={styles.kicker}>TELEGRAM · INSTAGRAM</p><h1>Terminal administrativo<span>.</span></h1><p className={styles.subtitle}>A mesma timeline, filtros e composer disponíveis no shell web e no mobile.</p></div><Bot size={36} className={styles.heroIcon} /></section>
    {error ? <div className={styles.notice}><XCircle size={18} /><div><strong>Terminal indisponível</strong><p>O control plane não respondeu. Nenhum dado local foi usado como substituto.</p></div></div> : <TerminalPanel events={data?.telegramEvents?.events} canSendTelegram={data?.permissions?.can_send_telegram === true} onReload={load} />}
    <MobileNav />
  </main>;
}
