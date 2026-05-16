import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { StatusBadge } from "./_authenticated.runs.index";
import { Button } from "@/components/ui/button";
import { fmtDate, fmtDuration } from "@/lib/app";
import { exportCsvUrl } from "@/lib/engine";

export const Route = createFileRoute("/_authenticated/runs/$id")({ component: RunDetail });

function RunDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { data: run } = useQuery({ queryKey: ["runs", id], queryFn: async () => (await supabase.from("runs").select("*").eq("id", id).single()).data });
  const { data: convos = [] } = useQuery({ queryKey: ["conversations", id], queryFn: async () => ((await supabase.from("conversations").select("*").eq("run_id", id).order("created_at")).data ?? []) });
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: async () => (await supabase.from("settings").select("cc_api_base_url").maybeSingle()).data });

  useEffect(() => {
    const ch = supabase.channel(`run-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "runs", filter: `id=eq.${id}` }, () => qc.invalidateQueries({ queryKey: ["runs", id] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations", filter: `run_id=eq.${id}` }, () => qc.invalidateQueries({ queryKey: ["conversations", id] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, qc]);

  if (!run) return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;
  const csvUrl = settings?.cc_api_base_url ? exportCsvUrl(settings.cc_api_base_url, id) : null;

  return (
    <div>
      <PageHeader title={run.name ?? id.slice(0, 8)} desc={`Status: ${run.status}`} actions={
        <>{csvUrl && <Button asChild size="sm" variant="secondary"><a href={csvUrl}>Export CSV</a></Button>}
          <Button asChild size="sm" variant="ghost"><Link to="/runs">← Runs</Link></Button></>
      } />
      <div className="space-y-4 p-8">
        <div className="grid grid-cols-4 gap-3">
          <Stat label="Conversations" value={convos.length} />
          <Stat label="Avg score" value={(convos.filter((c) => c.avg_score).reduce((a, c) => a + Number(c.avg_score ?? 0), 0) / Math.max(1, convos.filter((c) => c.avg_score).length)).toFixed(2)} />
          <Stat label="Total cost" value={`$${convos.reduce((a, c) => a + Number(c.total_cost_usd ?? 0), 0).toFixed(4)}`} />
          <Stat label="Duration" value={fmtDuration(run.started_at && run.completed_at ? new Date(run.completed_at).getTime() - new Date(run.started_at).getTime() : null)} />
        </div>
        {convos.length === 0 ? <EmptyState msg="No conversations yet." /> : (
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground"><tr className="border-b">
              <th className="py-2 text-left font-medium">Config</th><th className="text-left">Status</th><th className="text-left">Turns</th><th className="text-left">Avg score</th><th className="text-left">Cost</th><th className="text-left">Started</th><th />
            </tr></thead>
            <tbody>{convos.map((c) => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-card/60">
                <td className="py-2 font-mono text-xs">{c.config_label ?? c.id.slice(0, 8)}</td>
                <td><StatusBadge status={c.status} /></td>
                <td className="font-mono text-xs">{c.turn_count}</td>
                <td className="font-mono text-xs">{c.avg_score ?? "—"}</td>
                <td className="font-mono text-xs">${Number(c.total_cost_usd ?? 0).toFixed(4)}</td>
                <td className="text-xs text-muted-foreground">{fmtDate(c.started_at)}</td>
                <td className="text-right"><Link to="/runs/$id/conversations/$convId" params={{ id, convId: c.id }} className="text-xs text-primary hover:underline">View →</Link></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-lg border bg-card p-3"><div className="text-[10px] uppercase text-muted-foreground">{label}</div><div className="mt-1 font-mono text-lg">{value}</div></div>;
}
