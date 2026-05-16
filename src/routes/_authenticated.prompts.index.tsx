import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCurrentUserId, fmtDate } from "@/lib/app";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/prompts/")({ component: ListPage });

function ListPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"monolithic" | "pc_project">("monolithic");

  const { data: rows = [] } = useQuery({
    queryKey: ["prompts"],
    queryFn: async () => ((await supabase.from("prompts").select("*").order("updated_at", { ascending: false })).data ?? []),
  });

  const create = useMutation({
    mutationFn: async () => {
      const user_id = await getCurrentUserId();
      const { data, error } = await supabase.from("prompts").insert({
        user_id, name: name || "Untitled", kind, system_prompt: "", sections: kind === "pc_project" ? [] : null,
      }).select("id").single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => { setOpen(false); setName(""); nav({ to: "/prompts/$id", params: { id } }); },
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("prompts").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prompts"] }),
  });

  const mono = rows.filter((r) => r.kind === "monolithic");
  const pc = rows.filter((r) => r.kind === "pc_project");

  return (
    <div>
      <PageHeader title="Bot Prompts" desc="System prompts that drive the bot LLM." actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="mr-1 h-3.5 w-3.5" /> New</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New bot prompt</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div>
                <Label>Kind</Label>
                <div className="mt-1 flex gap-2">
                  {(["monolithic", "pc_project"] as const).map((k) => (
                    <button key={k} type="button" onClick={() => setKind(k)} className={`rounded px-3 py-1.5 text-xs ${kind === k ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>{k}</button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => create.mutate()}>Create</Button></div>
            </div>
          </DialogContent>
        </Dialog>
      } />
      <div className="p-8">
        <Tabs defaultValue="monolithic">
          <TabsList><TabsTrigger value="monolithic">Monolithic ({mono.length})</TabsTrigger><TabsTrigger value="pc_project">PC Projects ({pc.length})</TabsTrigger></TabsList>
          {(["monolithic", "pc_project"] as const).map((k) => (
            <TabsContent key={k} value={k}>
              {(k === "monolithic" ? mono : pc).length === 0 ? <EmptyState msg="None yet." /> : (
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase text-muted-foreground"><tr className="border-b"><th className="py-2 text-left font-medium">Name</th><th className="text-left">Version</th><th className="text-left">Tags</th><th className="text-left">Updated</th><th /></tr></thead>
                  <tbody>{(k === "monolithic" ? mono : pc).map((r) => (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-card/60">
                      <td className="py-2"><Link to="/prompts/$id" params={{ id: r.id }} className="text-primary hover:underline">{r.name}</Link></td>
                      <td className="font-mono text-xs">v{r.version}</td>
                      <td className="text-xs text-muted-foreground">{(r.tags ?? []).join(", ") || "—"}</td>
                      <td className="text-xs text-muted-foreground">{fmtDate(r.updated_at)}</td>
                      <td className="text-right"><Button size="icon" variant="ghost" onClick={() => del.mutate(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button></td>
                    </tr>
                  ))}</tbody>
                </table>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
