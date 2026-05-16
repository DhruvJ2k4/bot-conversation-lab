import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/test-cases/$id")({ component: Edit });

function Edit() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const { data } = useQuery({
    queryKey: ["test_cases", id],
    queryFn: async () => (await supabase.from("test_cases").select("*").eq("id", id).single()).data,
  });
  const [name, setName] = useState("");
  const [scenario, setScenario] = useState("");
  const [expected, setExpected] = useState("");
  const [overlay, setOverlay] = useState("");

  useEffect(() => {
    if (data) { setName(data.name); setScenario(data.scenario); setExpected(data.expected_behavior ?? ""); setOverlay(data.overlay_text ?? ""); }
  }, [data]);

  async function save() {
    const { error } = await supabase.from("test_cases").update({ name, scenario, expected_behavior: expected, overlay_text: overlay, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Saved"); nav({ to: "/test-cases" }); }
  }

  if (!data) return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;
  return (
    <div className="mx-auto max-w-3xl space-y-4 p-8">
      <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div className="space-y-2"><Label>Scenario</Label><Textarea value={scenario} onChange={(e) => setScenario(e.target.value)} className="mono min-h-[150px] text-xs" /></div>
      <div className="space-y-2"><Label>Expected behavior</Label><Textarea value={expected} onChange={(e) => setExpected(e.target.value)} className="mono min-h-[120px] text-xs" /></div>
      <div className="space-y-2"><Label>Overlay text</Label><Textarea value={overlay} onChange={(e) => setOverlay(e.target.value)} className="mono min-h-[150px] text-xs" /></div>
      <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => nav({ to: "/test-cases" })}>Cancel</Button><Button onClick={save}>Save</Button></div>
    </div>
  );
}
