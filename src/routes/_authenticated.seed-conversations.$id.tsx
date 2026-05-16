import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/seed-conversations/$id")({ component: View });

type Turn = { speaker?: string; content?: string };

function View() {
  const { id } = Route.useParams();
  const { data } = useQuery({
    queryKey: ["seed_conversations", id],
    queryFn: async () => (await supabase.from("seed_conversations").select("*").eq("id", id).single()).data,
  });
  if (!data) return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;
  const turns = (Array.isArray(data.turns) ? data.turns : []) as Turn[];
  return (
    <div className="mx-auto max-w-3xl space-y-4 p-8">
      <div>
        <Link to="/seed-conversations" className="text-xs text-muted-foreground hover:text-foreground">← Back</Link>
        <h1 className="mt-1 text-lg font-semibold">{data.name}</h1>
        <p className="text-xs text-muted-foreground">Source: {data.source ?? "—"} · {turns.length} turns</p>
      </div>
      <div className="space-y-2">
        {turns.map((t, i) => (
          <div key={i} className="rounded border bg-card p-3">
            <div className="mb-1 font-mono text-[10px] uppercase text-muted-foreground">T{i + 1} · {t.speaker ?? "?"}</div>
            <div className="whitespace-pre-wrap font-mono text-xs">{t.content ?? ""}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
