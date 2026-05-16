import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/personas/$id")({ component: Edit });

function Edit() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const { data } = useQuery({
    queryKey: ["personas", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("personas").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [overlay, setOverlay] = useState("");
  const [attrs, setAttrs] = useState("{}");

  useEffect(() => {
    if (data) {
      setName(data.name);
      setDescription(data.description ?? "");
      setOverlay(data.overlay_text ?? "");
      setAttrs(JSON.stringify(data.attributes ?? {}, null, 2));
    }
  }, [data]);

  async function save() {
    let parsedAttrs: Record<string, unknown> = {};
    try { parsedAttrs = JSON.parse(attrs); } catch { toast.error("Attributes must be valid JSON"); return; }
    const { error } = await supabase
      .from("personas")
      .update({ name, description, overlay_text: overlay, attributes: parsedAttrs as never, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Saved"); nav({ to: "/personas" }); }
  }

  if (!data) return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;
  return (
    <div className="mx-auto max-w-3xl space-y-4 p-8">
      <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div className="space-y-2"><Label>Description</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} /></div>
      <div className="space-y-2"><Label>Attributes (JSON)</Label><Textarea value={attrs} onChange={(e) => setAttrs(e.target.value)} className="mono min-h-[150px] text-xs" /></div>
      <div className="space-y-2"><Label>Overlay text (injected into lead prompt)</Label><Textarea value={overlay} onChange={(e) => setOverlay(e.target.value)} className="mono min-h-[250px] text-xs" /></div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={() => nav({ to: "/personas" })}>Cancel</Button>
        <Button onClick={save}>Save</Button>
      </div>
    </div>
  );
}
