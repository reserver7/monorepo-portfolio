import {
  AlertTriangle,
  LayoutDashboard,
  type LucideIcon,
  Settings,
  TableProperties,
  Upload,
  UploadCloud,
  Workflow
} from "lucide-react";

export type OpsNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const opsNavItems: OpsNavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/logs", label: "Logs", icon: Upload },
  { href: "/issues", label: "Issues", icon: AlertTriangle },
  { href: "/qa-assistant", label: "QA Assistant", icon: Workflow },
  { href: "/deployments", label: "Deployments", icon: TableProperties },
  { href: "/reports", label: "Reports", icon: UploadCloud },
  { href: "/settings", label: "Settings", icon: Settings }
];

