import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { getCurrentUserId, fmtDate } from "@/lib/app";
import { Trash2, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/lead-prompts/")({ component: ListPage });

function ListPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["lead_prompts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("lead_prompts").select("*").order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const user_id = await getCurrentUserId();
      const { data, error } = await supabase
        .from("lead_prompts")
        .insert({ user_id, name: "Untitled lead prompt", prompt: "" })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => nav({ to: "/lead-prompts/$id", params: { id } }),
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lead_prompts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lead_prompts"] }),
  });

  return (
    <div>
      <PageHeader
        title="Lead Prompts"
        desc="Prompts that drive the lead (simulated user) LLM."
        actions={
          <Button size="sm" onClick={() => create.mutate()} disabled={create.isPending}>
            <Plus className="mr-1 h-3.5 w-3.5" /> New
          </Button>
        }
      />
      <div className="p-8">
        {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : rows.length === 0 ? (
          <EmptyState msg="No lead prompts yet." />
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground">
              <tr className="border-b">
                <th className="py-2 text-left font-medium">Name</th>
                <th className="text-left font-medium">Description</th>
                <th className="text-left font-medium">Updated</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-card/60">
                  <td className="py-2">
                    <Link to="/lead-prompts/$id" params={{ id: r.id }} className="text-primary hover:underline">{r.name}</Link>
                  </td>
                  <td className="text-muted-foreground">{r.description ?? "—"}</td>
                  <td className="text-xs text-muted-foreground">{fmtDate(r.updated_at)}</td>
                  <td className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => del.mutate(r.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
