"use client";

import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { usePathname } from "next/navigation";
import { isActiveRoute, NAV_ITEMS } from "./navigation";
import styles from "./AppShell.module.css";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/login" || pathname.startsWith("/api/")) return <>{children}</>;
  return <div className={styles.shell}>
    <aside className={styles.sidebar} aria-label="Navegação principal">
      <Link className={styles.brand} href="/"><span>B</span><strong>Binc OS</strong></Link>
      <div className={styles.scope}><small>CONTROL PLANE</small><strong>Minha operação</strong><span>Estado verificado pelo Binc</span></div>
      <nav className={styles.nav}>{NAV_ITEMS.map((item) => { const Icon = item.icon; const active = isActiveRoute(pathname, item.href); return <Link href={item.href} key={item.id} aria-current={active ? "page" : undefined}><Icon size={17} /><span>{item.label}</span></Link>; })}</nav>
      <div className={styles.footer}><span className={styles.avatar}>B</span><div><strong>Administrador</strong><small>Controle global</small></div><MoreHorizontal size={17} /></div>
    </aside>
    <div className={styles.content}>{children}</div>
  </div>;
}
