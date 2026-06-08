"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut, Menu } from "lucide-react";
import { Logo } from "./Logo";
import { navForRole } from "./nav-config";
import { Chatbot } from "@/components/shared/Chatbot";
import { cn } from "@/lib/utils";

interface AppShellProps {
  role: string;
  userName: string;
  userEmail: string;
  title?: string;
  children: React.ReactNode;
}

export function AppShell({ role, userName, userEmail, title, children }: AppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = navForRole(role);
  const initial = (userName || userEmail || "?").charAt(0).toUpperCase();

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  })();

  const isActive = (href: string) => {
    if (href === "/admin" || href === "/publisher") return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <div className="flex min-h-screen">
      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[99] bg-black/45 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed bottom-0 left-0 top-0 z-[200] flex w-[220px] flex-shrink-0 flex-col bg-navy transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-[220px]",
          "md:translate-x-0"
        )}
      >
        <div className="border-b border-white/10 px-5 py-6">
          <Logo />
        </div>
        <nav className="flex-1 px-3 py-5">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "mb-1 flex items-center gap-3 rounded-[10px] px-3.5 py-3 text-sm font-medium transition-all",
                isActive(item.href)
                  ? "border-l-[3px] border-indigo bg-indigo/25 text-white"
                  : "text-white/55 hover:bg-white/[0.07] hover:text-white"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 border-t border-white/10 px-5 py-4 text-sm font-medium text-white/45 transition-colors hover:text-white"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </aside>

      {/* Main */}
      <div className="flex min-h-screen w-full flex-col md:ml-[220px] md:w-[calc(100vw-220px)]">
        <div className="flex flex-shrink-0 items-center justify-between border-b border-cardborder bg-white px-4 py-4 md:px-8">
          <button
            className="flex flex-shrink-0 flex-col gap-[5px] p-1 md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Menu"
          >
            <Menu size={22} className="text-navy" />
          </button>
          <div>
            {title ? (
              <h1 className="text-xl font-bold text-navy">{title}</h1>
            ) : (
              <>
                <div className="text-sm font-semibold text-navy">
                  {greeting}, {userName?.split(" ")[0] || "there"} 👋
                </div>
                <div className="text-xs text-[#9CA3AF]">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2.5 text-[13px] text-[#666]">
            <span className="hidden text-[#6B7280] sm:inline">{userEmail}</span>
            <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-indigo text-[13px] font-bold text-white">
              {initial}
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-6 p-4 md:p-8">{children}</div>
      </div>

      <Chatbot />
    </div>
  );
}
