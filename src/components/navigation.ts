import { Bot, FileText, FolderKanban, LayoutDashboard, Settings2, ShieldCheck, Workflow } from "lucide-react";

export const NAV_ITEMS = [
  { id: "overview", label: "Visão geral", icon: LayoutDashboard, href: "/", group: "primary" },
  { id: "projects", label: "Projetos", icon: FolderKanban, href: "/projects", group: "primary" },
  { id: "automations", label: "Automações", icon: Workflow, href: "/jobs", group: "primary" },
  { id: "reports", label: "Relatórios", icon: FileText, href: "/reports", group: "primary" },
  { id: "governance", label: "Governança", icon: ShieldCheck, href: "/onboarding", group: "more" },
  { id: "terminal", label: "Terminal", icon: Bot, href: "/terminal", group: "more" },
  { id: "docs", label: "Documentação", icon: Settings2, href: "/docs", group: "more" },
] as const;

export const NAV_GROUP_LABELS = { primary: "OPERAÇÃO", more: "ACESSO" } as const;
export const MOBILE_PRIMARY_ITEMS = NAV_ITEMS.filter((item) => item.group === "primary");
export const MOBILE_MORE_ITEMS = NAV_ITEMS.filter((item) => item.group === "more");
export type NavigationId = (typeof NAV_ITEMS)[number]["id"];

export function isActiveRoute(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
