"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, CircleAlert, ShieldCheck, Users } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import MobileNav from "@/components/MobileNav";
import styles from "./page.module.css";

type Workspace = { workspace_id: string; name: string; owner_id: string; checklist?: { complete: boolean; missing: string[] } };
type Data = { onboarding?: { workspaces?: Workspace[] } };

export default function OnboardingPage() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [member, setMember] = useState({ member_id: "", workspace_id: "personal", role: "reader" });
  useEffect(() => { const timer = window.setTimeout(() => { fetch("/api/control-plane").then(async (response) => { if (!response.ok) throw new Error(); setData(await response.json()); }).catch(() => setError(true)); }, 0); return () => window.clearTimeout(timer); }, []);
  const workspaces = data?.onboarding?.workspaces ?? [];
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!window.confirm(`Confirma o convite do membro “${member.member_id}” no workspace selecionado?`)) return;
    const response = await fetch("/api/control-plane", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "member_create", ...member, confirm: true }) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) { setMessage(payload.error || "Não foi possível criar o convite."); return; }
    setMessage("Convite criado e auditado."); setOpen(false); setMember({ ...member, member_id: "" });
  }
  return <main className={styles.page}>
    <header className={styles.header}><Link href="/" className={styles.back}><ArrowLeft size={16} /> Visão geral</Link><span className={styles.secure}><ShieldCheck size={14} /> Governança protegida</span></header>
    <section className={styles.hero}><div><p className={styles.kicker}>GOVERNANÇA</p><h1>Onboarding<span>.</span></h1><p className={styles.subtitle}>Configure workspaces e clientes sem misturar projetos, integrações ou permissões.</p></div><button className={styles.primary} onClick={() => { setOpen((value) => !value); setMessage(""); }}><Users size={16} /> Novo membro</button></section>
    {message && <div className={styles.feedback}>{message}</div>}
    {open && <form className={styles.form} onSubmit={submit}><div><p className={styles.kicker}>ACESSO</p><h2>Convidar membro</h2></div><label>Identificador<input required pattern="[A-Za-z0-9._-]+" value={member.member_id} onChange={(event) => setMember({ ...member, member_id: event.target.value })} placeholder="ex.: operador-1" /></label><label>Workspace<select value={member.workspace_id} onChange={(event) => setMember({ ...member, workspace_id: event.target.value })}>{workspaces.map((workspace) => <option key={workspace.workspace_id} value={workspace.workspace_id}>{workspace.name}</option>)}</select></label><label>Papel<select value={member.role} onChange={(event) => setMember({ ...member, role: event.target.value })}><option value="reader">Reader</option><option value="reviewer">Reviewer</option><option value="workspace_admin">Workspace admin</option></select></label><button className={styles.primary} type="submit">Confirmar convite</button></form>}
    {error ? <div className={styles.notice}><CircleAlert size={18} /><div><strong>Control plane indisponível</strong><p>Não foi possível carregar os workspaces.</p></div></div> : <section className={styles.list}>{workspaces.map((workspace) => { const checklist = workspace.checklist; return <article className={styles.workspace} key={workspace.workspace_id}><div className={styles.workspaceIcon}><Users size={18} /></div><div className={styles.workspaceMain}><div className={styles.workspaceTitle}><div><strong>{workspace.name}</strong><small>{workspace.workspace_id} · owner: {workspace.owner_id}</small></div><span className={checklist?.complete ? styles.complete : styles.incomplete}>{checklist?.complete ? <><CheckCircle2 size={14} /> Completo</> : <><CircleAlert size={14} /> Pendente</>}</span></div>{checklist?.complete ? <p className={styles.okText}>Integrações, projeto, membros e política de aprovação configurados.</p> : <><p className={styles.pendingText}>Itens pendentes:</p><div className={styles.missing}>{(checklist?.missing ?? []).map((item) => <span key={item}>{item}</span>)}</div></>}</div></article>; })}</section>}
    <MobileNav />
  </main>;
}
