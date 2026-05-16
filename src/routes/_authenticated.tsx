import { createFileRoute, Outlet, redirect, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { EngineStatusBadge } from "@/components/EngineStatusBadge";
import { AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data } = await supabase.from("settings").select("cc_api_base_url").maybeSingle();
      return data;
    },
  });
  const engineConfigured = !!settings?.cc_api_base_url;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-12 items-center justify-between border-b px-4">
          <div />
          <EngineStatusBadge />
        </header>
        {!engineConfigured && (
          <div className="flex items-center justify-between gap-3 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs">
            <div className="flex items-center gap-2 text-amber-200">
              <AlertTriangle className="h-3.5 w-3.5" />
              Engine offline — runs will use mock mode until configured.
            </div>
            <Link to="/settings" className="text-amber-200 hover:underline">
              Open Settings →
            </Link>
          </div>
        )}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
