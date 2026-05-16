import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getCurrentUserId, fmtDate } from "@/lib/app";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/seed-conversations/")({ component: ListPage });

type SeedRow = { id: string; name: string; source: string | null; created_at: string; turns: unknown };

function ListPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [source, setSource] = useState("");
  const [json, setJson] = useState('[\n  {"speaker": "bot", "content": "Hello"},\n  {"speaker": "lead", "content": "Hi"}\n]');

  const { data: rows = [] } = useQuery({
    queryKey: ["seed_conversations"],
    queryFn: async () => ((await supabase.from("seed_conversations").select("*").order("created_at", { ascending: false })).data ?? []) as SeedRow[],
  });

  const create = useMutation({
    mutationFn: async () => {
      let turns: unknown;
      try { turns = JSON.parse(json); } catch { throw new Error("Invalid JSON"); }
      if (!Array.isArray(turns)) throw new Error("Turns must be an array");
      const user_id = await getCurrentUserId();
      const { error } = await supabase.from("seed_conversations").insert({ user_id, name: name || "Untitled seed", source: source || null, turns: turns as never });
      if (error) throw error;
    },
    onSuccess: () => { setOpen(false); setName(""); setSource(""); qc.invalidateQueries({ queryKey: ["seed_conversations"] }); toast.success("Seed saved"); },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("seed_conversations").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["seed_conversations"] }),
  });

  return (
    <div>
      <PageHeader title="Seed Conversations" desc="Pre-recorded transcripts the engine can resume from." actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="mr-1 h-3.5 w-3.5" /> Upload JSON</Button></DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>New seed conversation</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div><Label>Source</Label><Input value={source} onChange={(e) => setSource(e.target.value)} placeholder="optional" /></div>
              <div><Label>Turns (JSON)</Label><Textarea value={json} onChange={(e) => setJson(e.target.value)} className="mono min-h-[280px] text-xs" /></div>
              <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => create.mutate()}>Save</Button></div>
            </div>
          </DialogContent>
        </Dialog>
      } />
      <div className="p-8">
        {rows.length === 0 ? <EmptyState msg="No seed conversations yet." /> : (
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground"><tr className="border-b"><th className="py-2 text-left font-medium">Name</th><th className="text-left">Source</th><th className="text-left">Turns</th><th className="text-left">Created</th><th /></tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.id} className="border-b last:border-0 hover:bg-card/60">
                <td className="py-2"><Link to="/seed-conversations/$id" params={{ id: r.id }} className="text-primary hover:underline">{r.name}</Link></td>
                <td className="text-muted-foreground">{r.source ?? "—"}</td>
                <td className="font-mono text-xs">{Array.isArray(r.turns) ? r.turns.length : "?"}</td>
                <td className="text-xs text-muted-foreground">{fmtDate(r.created_at)}</td>
                <td className="text-right"><Button size="icon" variant="ghost" onClick={() => del.mutate(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
