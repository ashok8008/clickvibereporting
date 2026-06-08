import { Home, BarChart3, Tag, Users, Upload, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";

export interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
}

export function navForRole(role: string): NavItem[] {
  if (role === "ADMIN") {
    return [
      { label: "Home", href: "/admin", icon: <Home size={18} /> },
      { label: "Reporting", href: "/admin/reporting", icon: <BarChart3 size={18} /> },
      { label: "Offers", href: "/admin/offers", icon: <Tag size={18} /> },
      { label: "Publishers", href: "/admin/publishers", icon: <Users size={18} /> },
      { label: "Upload", href: "/admin/upload", icon: <Upload size={18} /> },
      { label: "AppsFlyer", href: "/admin/appsflyer", icon: <RefreshCw size={18} /> },
    ];
  }
  return [
    { label: "Home", href: "/publisher", icon: <Home size={18} /> },
    { label: "Reporting", href: "/publisher/reporting", icon: <BarChart3 size={18} /> },
  ];
}
