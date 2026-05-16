import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  FileText, UserCog, ClipboardList, MessageSquare, Gavel, Play, Settings as SettingsIcon, Bot, LogOut, Megaphone,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const items = [
  { to: "/runs", label: "Runs", icon: Play },
  { to: "/prompts", label: "Bot Prompts", icon: Bot },
  { to: "/lead-prompts", label: "Lead Prompts", icon: Megaphone },
  { to: "/personas", label: "Personas", icon: UserCog },
  { to: "/test-cases", label: "Test Cases", icon: ClipboardList },
  { to: "/seed-conversations", label: "Seed Conversations", icon: MessageSquare },
  { to: "/judge-prompts", label: "Judge Prompts", icon: Gavel },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

export function Sidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const nav = useNavigate();
  return (
    <aside className="flex h-screen w-56 flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="h-6 w-6 rounded bg-primary/20 flex items-center justify-center">
          <FileText className="h-3.5 w-3.5 text-primary" />
        </div>
        <span className="text-sm font-semibold tracking-tight">Ramayana</span>
      </div>
      <nav className="flex-1 space-y-0.5 px-2">
        {items.map((it) => {
          const active = path === it.to || path.startsWith(it.to + "/");
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              className={`flex items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {it.label}
            </Link>
          );
        })}
      </nav>
      <button
        onClick={async () => {
          await supabase.auth.signOut();
          nav({ to: "/login" });
        }}
        className="m-2 flex items-center gap-2 rounded px-2 py-1.5 text-xs text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
      >
        <LogOut className="h-3.5 w-3.5" /> Sign out
      </button>
    </aside>
  );
}
