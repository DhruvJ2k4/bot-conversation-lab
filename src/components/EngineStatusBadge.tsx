import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { pingEngine } from "@/lib/engine";

export function EngineStatusBadge() {
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data } = await supabase.from("settings").select("cc_api_base_url").maybeSingle();
      return data;
    },
  });
  const [status, setStatus] = useState<{ ok: boolean; latencyMs: number; error?: string } | null>(null);
  const url = settings?.cc_api_base_url ?? "";

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (!url) {
        if (!cancelled) setStatus({ ok: false, latencyMs: 0, error: "no url" });
        return;
      }
      const r = await pingEngine(url);
      if (!cancelled) setStatus(r);
    }
    check();
    const id = setInterval(check, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [url]);

  const ok = !!status?.ok;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span
        className={`inline-block h-2 w-2 rounded-full ${ok ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "bg-red-500"}`}
        title={status?.error ?? ""}
      />
      <span className="font-mono text-muted-foreground">
        {url ? (ok ? `engine · ${status?.latencyMs}ms` : "engine offline") : "engine not configured"}
      </span>
    </div>
  );
}
