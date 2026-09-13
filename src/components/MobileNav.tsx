import Link from "next/link";
import { Bot, Camera, FileText, FolderKanban, LayoutDashboard, ShieldCheck, Workflow } from "lucide-react";
import styles from "./MobileNav.module.css";

const items = [
  ["/", "Início", LayoutDashboard],
  ["/projects", "Projetos", FolderKanban],
  ["/campaigns", "Campanhas", Camera],
  ["/jobs", "Jobs", Workflow],
  ["/onboarding", "Governança", ShieldCheck],
  ["/terminal", "Terminal", Bot],
  ["/reports", "Relatórios", FileText],
] as const;

export default function MobileNav() {
  return <nav className={styles.nav} aria-label="Navegação mobile">{items.map(([href, label, Icon]) => <Link href={href} key={href}><Icon size={16} /><span>{label}</span></Link>)}</nav>;
}
