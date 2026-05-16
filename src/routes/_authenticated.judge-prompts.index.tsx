import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { getCurrentUserId, fmtDate, JUDGE_FACTORS } from "@/lib/app";
import { Plus, Trash2, Star } from "lucide-react";

export const Route = createFileRoute("/_authenticated/judge-prompts/")({ component: ListPage });

function ListPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { data: rows = [] } = useQuery({
    queryKey: ["judge_prompts"],
    queryFn: async () => ((await supabase.from("judge_prompts").select("*").order("updated_at", { ascending: false })).data ?? []),
  });

  const create = useMutation({
    mutationFn: async () => {
      const user_id = await getCurrentUserId();
      const { data, error } = await supabase.from("judge_prompts").insert({ user_id, name: "Untitled judge", prompt: "", factors: [...JUDGE_FACTORS] }).select("id").single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => nav({ to: "/judge-prompts/$id", params: { id } }),
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("judge_prompts").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["judge_prompts"] }),
  });
  const setDefault = useMutation({
    mutationFn: async (id: string) => {
      const user_id = await getCurrentUserId();
      await supabase.from("judge_prompts").update({ is_default: false }).eq("user_id", user_id);
      const { error } = await supabase.from("judge_prompts").update({ is_default: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["judge_prompts"] }),
  });

  return (
    <div>
      <PageHeader title="Judge Prompts" desc="Rubrics the judge LLM uses to score each conversation." actions={<Button size="sm" onClick={() => create.mutate()}><Plus className="mr-1 h-3.5 w-3.5" /> New</Button>} />
      <div className="p-8">
        {rows.length === 0 ? <EmptyState msg="No judge prompts yet." /> : (
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground"><tr className="border-b"><th className="py-2 text-left font-medium">Name</th><th className="text-left">Factors</th><th className="text-left">Updated</th><th /></tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.id} className="border-b last:border-0 hover:bg-card/60">
                <td className="py-2"><Link to="/judge-prompts/$id" params={{ id: r.id }} className="text-primary hover:underline">{r.name}</Link>{r.is_default && <span className="ml-2 rounded bg-primary/20 px-1.5 py-0.5 text-[10px] uppercase text-primary">default</span>}</td>
                <td className="font-mono text-xs text-muted-foreground">{(r.factors ?? []).length}</td>
                <td className="text-xs text-muted-foreground">{fmtDate(r.updated_at)}</td>
                <td className="text-right space-x-1">
                  {!r.is_default && <Button size="icon" variant="ghost" title="Set as default" onClick={() => setDefault.mutate(r.id)}><Star className="h-3.5 w-3.5" /></Button>}
                  <Button size="icon" variant="ghost" onClick={() => del.mutate(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
