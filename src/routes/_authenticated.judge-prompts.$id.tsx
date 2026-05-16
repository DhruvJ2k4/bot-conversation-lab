import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { JUDGE_FACTORS } from "@/lib/app";

export const Route = createFileRoute("/_authenticated/judge-prompts/$id")({ component: Edit });

function Edit() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const { data } = useQuery({
    queryKey: ["judge_prompts", id],
    queryFn: async () => (await supabase.from("judge_prompts").select("*").eq("id", id).single()).data,
  });
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [factors, setFactors] = useState<string[]>([]);

  useEffect(() => { if (data) { setName(data.name); setPrompt(data.prompt); setFactors(data.factors ?? []); } }, [data]);

  async function save() {
    const { error } = await supabase.from("judge_prompts").update({ name, prompt, factors, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Saved"); nav({ to: "/judge-prompts" }); }
  }

  if (!data) return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;
  return (
    <div className="mx-auto max-w-3xl space-y-4 p-8">
      <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div className="space-y-2">
        <Label>Factors</Label>
        <div className="flex flex-wrap gap-2">
          {JUDGE_FACTORS.map((f) => {
            const on = factors.includes(f);
            return (
              <button key={f} type="button" onClick={() => setFactors(on ? factors.filter((x) => x !== f) : [...factors, f])}
                className={`rounded-full px-2.5 py-1 text-xs ${on ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                {f}
              </button>
            );
          })}
        </div>
      </div>
      <div className="space-y-2"><Label>Prompt</Label><Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} className="mono min-h-[400px] text-xs" /></div>
      <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => nav({ to: "/judge-prompts" })}>Cancel</Button><Button onClick={save}>Save</Button></div>
    </div>
  );
}
