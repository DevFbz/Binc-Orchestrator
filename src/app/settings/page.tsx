import Link from "next/link";
import { ArrowLeft, Check, MonitorCog, ShieldCheck } from "lucide-react";
import styles from "./page.module.css";

export default function SettingsPage() {
  return <main className={styles.page}>
    <header className={styles.header}><Link href="/" className={styles.back}><ArrowLeft size={16} /> Visão geral</Link><span className={styles.secure}><ShieldCheck size={14} /> Preferências do painel</span></header>
    <section className={styles.hero}><p className={styles.kicker}>CONFIGURAÇÕES</p><h1>Preferências do Binc OS.</h1><p className={styles.subtitle}>Ajustes de apresentação e navegação deste workspace.</p></section>
    <section className={styles.card}><div className={styles.cardHead}><div><p className={styles.kicker}>APARÊNCIA</p><h2>Interface</h2></div><MonitorCog size={26} /></div><div className={styles.row}><div><strong>Tema atual</strong><small>O tema dark é aplicado ao painel operacional.</small></div><span className={styles.badge}><Check size={13} /> Dark</span></div><div className={styles.row}><div><strong>Sidebar</strong><small>Use o botão no topo do menu para recolher ou expandir.</small></div><span className={styles.badge}><Check size={13} /> Disponível</span></div></section>
  </main>;
}
