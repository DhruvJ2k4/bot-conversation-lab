import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/lead-prompts/$id")({ component: Edit });

function Edit() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const { data } = useQuery({
    queryKey: ["lead_prompts", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("lead_prompts").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [prompt, setPrompt] = useState("");

  useEffect(() => {
    if (data) {
      setName(data.name);
      setDescription(data.description ?? "");
      setPrompt(data.prompt ?? "");
    }
  }, [data]);

  async function save() {
    const { error } = await supabase
      .from("lead_prompts")
      .update({ name, description, prompt, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Saved"); nav({ to: "/lead-prompts" }); }
  }

  if (!data) return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;
  return (
    <div className="mx-auto max-w-3xl space-y-4 p-8">
      <div className="space-y-2">
        <Label>Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Prompt</Label>
        <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} className="mono min-h-[300px] text-xs" />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={() => nav({ to: "/lead-prompts" })}>Cancel</Button>
        <Button onClick={save}>Save</Button>
      </div>
    </div>
  );
}
