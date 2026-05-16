import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fmtDate } from "@/lib/app";

export const Route = createFileRoute("/_authenticated/runs/$id/conversations/$convId")({ component: ConvView });

type Turn = { id: number; turn_index: number; speaker: "bot" | "lead" | "system"; content: string; latency_ms: number | null; created_at: string; raw_output: unknown; metadata: unknown };
type Score = { factor: string; score: number; rationale: string | null };

function ConvView() {
  const { id, convId } = Route.useParams();
  const qc = useQueryClient();

  const { data: conv } = useQuery({ queryKey: ["conv", convId], queryFn: async () => (await supabase.from("conversations").select("*").eq("id", convId).single()).data });
  const { data: turns = [] } = useQuery({ queryKey: ["turns", convId], queryFn: async () => ((await supabase.from("turns").select("*").eq("conversation_id", convId).order("turn_index")).data ?? []) as Turn[] });
  const { data: scores = [] } = useQuery({ queryKey: ["scores", convId], queryFn: async () => ((await supabase.from("scores").select("*").eq("conversation_id", convId)).data ?? []) as Score[] });

  useEffect(() => {
    const ch = supabase.channel(`conv-${convId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "turns", filter: `conversation_id=eq.${convId}` }, () => qc.invalidateQueries({ queryKey: ["turns", convId] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "scores", filter: `conversation_id=eq.${convId}` }, () => qc.invalidateQueries({ queryKey: ["scores", convId] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations", filter: `id=eq.${convId}` }, () => qc.invalidateQueries({ queryKey: ["conv", convId] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [convId, qc]);

  if (!conv) return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="flex flex-col">
      <header className="border-b px-8 py-4">
        <Link to="/runs/$id" params={{ id }} className="text-xs text-muted-foreground hover:text-foreground">← Back to run</Link>
        <div className="mt-1 flex items-center justify-between">
          <h1 className="text-lg font-semibold">{conv.config_label ?? convId.slice(0, 8)}</h1>
          <div className="flex flex-wrap gap-1">
            {scores.map((s) => (
              <span key={s.factor} className="rounded bg-secondary px-2 py-0.5 text-[10px] font-mono">{s.factor}: {Number(s.score).toFixed(1)}</span>
            ))}
          </div>
        </div>
        <div className="mt-1 font-mono text-xs text-muted-foreground">{conv.status} · {conv.turn_count} turns · ${Number(conv.total_cost_usd ?? 0).toFixed(4)}</div>
      </header>

      <div className="grid grid-cols-[1fr,1fr,1fr] gap-px bg-border">
        <ColHeader label="BOT" />
        <ColHeader label="LEAD" />
        <ColHeader label="SYSTEM" />
        {turns.map((t) => (
          <div key={t.id} className="contents">
            <TurnCell turn={t} col="bot" />
            <TurnCell turn={t} col="lead" />
            <TurnCell turn={t} col="system" />
          </div>
        ))}
      </div>

      <section className="border-t p-8">
        <h2 className="mb-3 text-xs uppercase text-muted-foreground">Scores</h2>
        <div className="space-y-2">
          {scores.length === 0 ? <p className="text-sm text-muted-foreground">No scores yet.</p> : scores.map((s) => (
            <details key={s.factor} className="rounded border bg-card p-3 text-sm">
              <summary className="cursor-pointer">{s.factor} — <span className="font-mono">{Number(s.score).toFixed(1)}</span></summary>
              <p className="mt-2 text-xs text-muted-foreground">{s.rationale ?? "—"}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}

function ColHeader({ label }: { label: string }) {
  return <div className="bg-card px-4 py-2 text-[10px] font-mono uppercase text-muted-foreground">{label}</div>;
}

function TurnCell({ turn, col }: { turn: Turn; col: "bot" | "lead" | "system" }) {
  if (turn.speaker !== col) return <div className="bg-background" />;
  return (
    <div className="space-y-1 bg-background p-3 text-xs animate-in fade-in duration-300">
      <div className="font-mono text-[10px] text-muted-foreground">T{turn.turn_index + 1} · {fmtDate(turn.created_at)} · +{turn.latency_ms ?? 0}ms</div>
      <div className="whitespace-pre-wrap font-mono">{turn.content}</div>
      {turn.raw_output ? (
        <details className="mt-1"><summary className="cursor-pointer text-[10px] text-muted-foreground">raw</summary><pre className="mt-1 overflow-auto rounded bg-card p-2 text-[10px]">{JSON.stringify(turn.raw_output, null, 2)}</pre></details>
      ) : null}
    </div>
  );
}
