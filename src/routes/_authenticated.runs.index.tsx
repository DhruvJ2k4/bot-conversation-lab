import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { fmtDate, fmtDuration } from "@/lib/app";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/runs/")({ component: ListPage });

type Run = {
  id: string; name: string | null; status: string; created_at: string; started_at: string | null;
  completed_at: string | null; metrics: Record<string, unknown> | null;
};

function ListPage() {
  const qc = useQueryClient();
  const { data: rows = [] } = useQuery({
    queryKey: ["runs"],
    queryFn: async () => ((await supabase.from("runs").select("*").order("created_at", { ascending: false })).data ?? []) as Run[],
  });

  useEffect(() => {
    const ch = supabase.channel("runs-list").on("postgres_changes", { event: "*", schema: "public", table: "runs" }, () => {
      qc.invalidateQueries({ queryKey: ["runs"] });
    }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const active = rows.filter((r) => r.status === "queued" || r.status === "running");
  const history = rows.filter((r) => !(r.status === "queued" || r.status === "running"));

  return (
    <div>
      <PageHeader title="Runs" desc="Live and historical bot evaluation runs." actions={
        <Button size="sm" asChild><Link to="/runs/new"><Plus className="mr-1 h-3.5 w-3.5" /> New Run</Link></Button>
      } />
      <div className="space-y-8 p-8">
        <section>
          <h2 className="mb-2 flex items-center gap-2 text-xs uppercase text-muted-foreground">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> Active queue
          </h2>
          {active.length === 0 ? <EmptyState msg="No active runs." /> : <RunTable rows={active} />}
        </section>
        <section>
          <h2 className="mb-2 text-xs uppercase text-muted-foreground">History</h2>
          {history.length === 0 ? <EmptyState msg="No runs yet." /> : <RunTable rows={history} />}
        </section>
      </div>
    </div>
  );
}

function RunTable({ rows }: { rows: Run[] }) {
  return (
    <table className="w-full text-sm">
      <thead className="text-xs uppercase text-muted-foreground"><tr className="border-b">
        <th className="py-2 text-left font-medium">Name</th><th className="text-left">Status</th>
        <th className="text-left">Created</th><th className="text-left">Duration</th><th />
      </tr></thead>
      <tbody>{rows.map((r) => {
        const dur = r.started_at && r.completed_at ? new Date(r.completed_at).getTime() - new Date(r.started_at).getTime() : null;
        return (
          <tr key={r.id} className="border-b last:border-0 hover:bg-card/60">
            <td className="py-2"><Link to="/runs/$id" params={{ id: r.id }} className="text-primary hover:underline">{r.name ?? r.id.slice(0, 8)}</Link></td>
            <td><StatusBadge status={r.status} /></td>
            <td className="text-xs text-muted-foreground">{fmtDate(r.created_at)}</td>
            <td className="text-xs text-muted-foreground">{fmtDuration(dur)}</td>
            <td className="text-right"><Link to="/runs/$id" params={{ id: r.id }} className="text-xs text-primary hover:underline">View →</Link></td>
          </tr>
        );
      })}</tbody>
    </table>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    queued: "bg-muted text-muted-foreground", running: "bg-primary/20 text-primary",
    done: "bg-emerald-500/20 text-emerald-300", failed: "bg-destructive/20 text-destructive-foreground",
    cancelled: "bg-muted text-muted-foreground",
  };
  return <span className={`rounded px-1.5 py-0.5 text-[10px] uppercase ${map[status] ?? "bg-muted"}`}>{status}</span>;
}

// silence unused import warning
void useState;
