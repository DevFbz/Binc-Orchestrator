"use client";

import Link from "next/link";
import { ArrowLeft, ShieldCheck, Users, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import MobileNav from "@/components/MobileNav";
import GovernancePanel, { type GovernanceAudit, type GovernanceMember, type GovernanceWorkspace } from "@/components/GovernancePanel";
import styles from "./page.module.css";

type Data = { onboarding?: { workspaces?: GovernanceWorkspace[] }; members?: { magu?: { members?: GovernanceMember[] }; personal?: { members?: GovernanceMember[] } }; audit?: { events?: GovernanceAudit[] }; permissions?: { can_manage_members?: boolean } };

export default function OnboardingPage() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState(false);
  async function load() { try { const response = await fetch("/api/control-plane", { cache: "no-store" }); if (!response.ok) throw new Error(); setData(await response.json()); setError(false); } catch { setError(true); } }
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, []);
  const members = [...(data?.members?.magu?.members ?? []), ...(data?.members?.personal?.members ?? [])];
  return <main className={styles.page}>
    <header className={styles.header}><Link href="/#governance" className={styles.back}><ArrowLeft size={16} /> Binc OS</Link><span className={styles.secure}><ShieldCheck size={14} /> Governança protegida</span></header>
    <section className={styles.hero}><div><p className={styles.kicker}>GOVERNANÇA</p><h1>Onboarding<span>.</span></h1><p className={styles.subtitle}>A mesma gestão de workspaces, membros, convites e auditoria disponível no shell web e no mobile.</p></div><Users size={34} className={styles.heroIcon} /></section>
    {error ? <div className={styles.notice}><XCircle size={18} /><div><strong>Control plane indisponível</strong><p>Não foi possível carregar os workspaces.</p></div></div> : <GovernancePanel workspaces={data?.onboarding?.workspaces} members={members} audit={data?.audit?.events} canManageMembers={data?.permissions?.can_manage_members === true} onReload={load} />}
    <MobileNav />
  </main>;
}
