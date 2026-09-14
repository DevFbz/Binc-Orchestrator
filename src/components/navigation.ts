import { Activity, Bot, Camera, FileText, FolderKanban, LayoutDashboard, ListChecks, ShieldCheck, WalletCards, Workflow } from "lucide-react";

export const NAV_ITEMS = [
  { id: "overview", label: "Visão geral", icon: LayoutDashboard, href: "/", route: "/" },
  { id: "projects", label: "Projetos", icon: FolderKanban, href: "/#projects", route: "/projects" },
  { id: "tasks", label: "Tarefas", icon: ListChecks, href: "/#tasks", route: "/jobs" },
  { id: "automations", label: "Automações", icon: Workflow, href: "/#automations", route: "/jobs" },
  { id: "governance", label: "Governança", icon: ShieldCheck, href: "/#governance", route: "/onboarding" },
  { id: "reports", label: "Relatórios", icon: FileText, href: "/#reports", route: "/reports" },
  { id: "docs", label: "Documentação", icon: FileText, href: "/#docs", route: "/docs" },
  { id: "terminal", label: "Terminal Telegram", icon: Bot, href: "/#terminal", route: "/terminal" },
] as const;

export type NavigationSection = (typeof NAV_ITEMS)[number]["id"];

export const projectIcons = { instagram: Camera, finance: WalletCards, activity: Activity };
