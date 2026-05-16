import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { getCurrentUserId, fmtDate } from "@/lib/app";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/personas/")({ component: ListPage });

function ListPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { data: rows = [] } = useQuery({
    queryKey: ["personas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("personas").select("*").order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const create = useMutation({
    mutationFn: async () => {
      const user_id = await getCurrentUserId();
      const { data, error } = await supabase.from("personas").insert({ user_id, name: "Untitled persona" }).select("id").single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => nav({ to: "/personas/$id", params: { id } }),
    onError: (e) => toast.error(e instanceof Error ? e.message : String(e)),
  });
  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("personas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["personas"] }),
  });

  return (
    <div>
      <PageHeader
        title="Personas"
        desc="User-side personas injected as overlays into the lead prompt."
        actions={<Button size="sm" onClick={() => create.mutate()}><Plus className="mr-1 h-3.5 w-3.5" /> New</Button>}
      />
      <div className="p-8">
        {rows.length === 0 ? <EmptyState msg="No personas yet." /> : (
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-muted-foreground">
              <tr className="border-b"><th className="py-2 text-left font-medium">Name</th><th className="text-left">Description</th><th className="text-left">Updated</th><th /></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-card/60">
                  <td className="py-2"><Link to="/personas/$id" params={{ id: r.id }} className="text-primary hover:underline">{r.name}</Link></td>
                  <td className="text-muted-foreground">{r.description ?? "—"}</td>
                  <td className="text-xs text-muted-foreground">{fmtDate(r.updated_at)}</td>
                  <td className="text-right"><Button size="icon" variant="ghost" onClick={() => del.mutate(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
