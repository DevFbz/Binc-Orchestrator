"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import styles from "./page.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    const data = await response.json();
    if (!response.ok) { setMessage(data.code === "auth_not_configured" ? "Autenticação ainda não configurada." : "Credenciais inválidas."); return; }
    router.push("/");
  }
  return <main className={styles.page}><form className={styles.card} onSubmit={submit}><div className={styles.mark}>✦</div><p className={styles.kicker}>BINC ORCHESTRATOR</p><h1>Entrar</h1><p className={styles.subtitle}>Acesse seu painel administrativo seguro.</p><label>E-mail<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Senha<input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>{message && <p className={styles.error}>{message}</p>}<button type="submit">Entrar</button></form></main>;
}
