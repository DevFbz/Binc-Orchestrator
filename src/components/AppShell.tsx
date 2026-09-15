"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { isActiveRoute, NAV_ITEMS } from "./navigation";
import styles from "./AppShell.module.css";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => typeof window !== "undefined" && window.localStorage.getItem("binc.sidebar.collapsed") === "true");
  if (pathname === "/login" || pathname.startsWith("/api/")) return <>{children}</>;
  function toggleSidebar() { setSidebarCollapsed((value) => { const next = !value; window.localStorage.setItem("binc.sidebar.collapsed", String(next)); return next; }); }
  return <div className={`${styles.shell} ${sidebarCollapsed ? styles.collapsed : ""}`}>
    <aside className={styles.sidebar} aria-label="Navegação principal">
      <div className={styles.brandRow}><Link className={styles.brand} href="/"><span>B</span><strong>Binc OS</strong></Link><button className={styles.collapseButton} type="button" onClick={toggleSidebar} aria-label={sidebarCollapsed ? "Expandir menu" : "Recolher menu"} title={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}>{sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}</button></div>
      <div className={styles.scope}><small>CONTROL PLANE</small><strong>Minha operação</strong><span>Estado verificado pelo Binc</span></div>
      <nav className={styles.nav}>{NAV_ITEMS.map((item) => { const Icon = item.icon; const active = isActiveRoute(pathname, item.href); return <Link href={item.href} key={item.id} aria-current={active ? "page" : undefined} title={sidebarCollapsed ? item.label : undefined}><Icon size={17} /><span>{item.label}</span></Link>; })}</nav>
      <div className={styles.footer}><span className={styles.avatar}>B</span><div><strong>Administrador</strong><small>Controle global</small></div><MoreHorizontal size={17} /></div>
    </aside>
    <div className={styles.content}>{children}</div>
  </div>;
}
