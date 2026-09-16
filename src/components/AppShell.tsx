"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, MoreHorizontal, Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { isActiveRoute, NAV_GROUP_LABELS, NAV_ITEMS } from "./navigation";
import styles from "./AppShell.module.css";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => typeof window !== "undefined" && window.localStorage.getItem("binc.sidebar.collapsed") === "true");
  if (pathname === "/login" || pathname.startsWith("/api/")) return <>{children}</>;
  function toggleSidebar() { setSidebarCollapsed((value) => { const next = !value; window.localStorage.setItem("binc.sidebar.collapsed", String(next)); return next; }); }
  const settingsActive = isActiveRoute(pathname, "/settings");
  return <div className={`${styles.shell} ${sidebarCollapsed ? styles.collapsed : ""}`}>
    <aside className={styles.sidebar} aria-label="Navegação principal">
      <div className={styles.brandRow}>
        <Link className={styles.brand} href="/"><span>B</span><strong>Binc OS</strong></Link>
        <button className={styles.collapseButton} type="button" onClick={toggleSidebar} aria-expanded={!sidebarCollapsed} aria-label={sidebarCollapsed ? "Expandir menu" : "Recolher menu"} title={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}>
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          <span>{sidebarCollapsed ? "Expandir menu" : "Recolher menu"}</span>
        </button>
      </div>
      <div className={styles.scope}><small>CONTROL PLANE</small><strong>Minha operação</strong><span>Estado verificado pelo Binc</span></div>
      <nav className={styles.nav}>{(["primary", "more"] as const).map((group) => <div className={styles.navGroup} key={group}><p className={styles.navLabel}>{NAV_GROUP_LABELS[group]}</p>{NAV_ITEMS.filter((item) => item.group === group).map((item) => { const Icon = item.icon; const active = isActiveRoute(pathname, item.href); return <Link href={item.href} key={item.id} aria-current={active ? "page" : undefined} title={sidebarCollapsed ? item.label : undefined}><Icon size={17} /><span>{item.label}</span></Link>; })}</div>)}</nav>
      <div className={styles.footer}>
        <Link className={styles.settingsLink} href="/settings" aria-current={settingsActive ? "page" : undefined} title={sidebarCollapsed ? "Configurações" : undefined}><Settings size={17} /><span>Configurações</span></Link>
        <div className={styles.profile}><span className={styles.avatar}>B</span><div><strong>Administrador</strong><small>Controle global</small></div><MoreHorizontal size={17} /></div>
      </div>
    </aside>
    <div className={styles.content}>{children}</div>
  </div>;
}
