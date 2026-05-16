import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/prompts/$id")({ component: Edit });

type Section = { id: string; name: string; prompt: string; order: number };

function Edit() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const { data } = useQuery({
    queryKey: ["prompts", id],
    queryFn: async () => (await supabase.from("prompts").select("*").eq("id", id).single()).data,
  });
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [endPrompt, setEndPrompt] = useState("");
  const [sections, setSections] = useState<Section[]>([]);
  const [selSection, setSelSection] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      setName(data.name); setDescription(data.description ?? ""); setTags((data.tags ?? []).join(", "));
      setSystemPrompt(data.system_prompt); setEndPrompt(data.end_system_prompt ?? "");
      const secs = (Array.isArray(data.sections) ? data.sections : []) as Section[];
      setSections(secs); setSelSection(secs[0]?.id ?? null);
    }
  }, [data]);

  async function save() {
    const { error } = await supabase.from("prompts").update({
      name, description, tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      system_prompt: systemPrompt, end_system_prompt: endPrompt,
      sections: data?.kind === "pc_project" ? (sections as never) : null,
      updated_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Saved"); nav({ to: "/prompts" }); }
  }

  async function saveAsNewVersion() {
    if (!data) return;
    const user_id = data.user_id;
    const { error } = await supabase.from("prompts").insert({
      user_id, name: data.name, kind: data.kind, system_prompt: systemPrompt, end_system_prompt: endPrompt,
      sections: data.kind === "pc_project" ? (sections as never) : null,
      version: (data.version ?? 1) + 1, description, tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
    });
    if (error) toast.error(error.message); else { toast.success("New version created"); nav({ to: "/prompts" }); }
  }

  if (!data) return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;
  const isPC = data.kind === "pc_project";
  const sel = sections.find((s) => s.id === selSection);

  return (
    <div className="space-y-4 p-8">
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1"><Label className="text-xs">Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="space-y-1"><Label className="text-xs">Description</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} /></div>
        <div className="space-y-1"><Label className="text-xs">Tags (comma-separated)</Label><Input value={tags} onChange={(e) => setTags(e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1"><Label className="text-xs">System prompt</Label><Textarea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} className="mono min-h-[300px] text-xs" /></div>
        <div className="space-y-1"><Label className="text-xs">End system prompt</Label><Textarea value={endPrompt} onChange={(e) => setEndPrompt(e.target.value)} className="mono min-h-[300px] text-xs" /></div>
      </div>

      {isPC && (
        <div className="grid grid-cols-[200px,1fr,1fr] gap-3 border-t pt-4">
          <div>
            <div className="mb-2 flex items-center justify-between"><Label className="text-xs">Sections</Label>
              <button className="text-xs text-primary hover:underline" onClick={() => {
                const s: Section = { id: crypto.randomUUID(), name: `Section ${sections.length + 1}`, prompt: "", order: sections.length };
                setSections([...sections, s]); setSelSection(s.id);
              }}>+ Add</button>
            </div>
            <div className="space-y-1">
              {sections.map((s) => (
                <button key={s.id} onClick={() => setSelSection(s.id)} className={`block w-full rounded px-2 py-1 text-left text-xs ${selSection === s.id ? "bg-accent" : "hover:bg-accent/50"}`}>{s.name}</button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {sel ? (<>
              <Input value={sel.name} onChange={(e) => setSections(sections.map((x) => x.id === sel.id ? { ...x, name: e.target.value } : x))} />
              <Textarea value={sel.prompt} onChange={(e) => setSections(sections.map((x) => x.id === sel.id ? { ...x, prompt: e.target.value } : x))} className="mono min-h-[300px] text-xs" />
            </>) : <p className="text-xs text-muted-foreground">No section selected.</p>}
          </div>
          <div>
            <Label className="text-xs">Preview (resolved for selected section)</Label>
            <pre className="mt-1 max-h-[400px] overflow-auto rounded border bg-background p-2 font-mono text-[10px]">{`[SYSTEM]\n${systemPrompt}\n\n[SECTION: ${sel?.name ?? "—"}]\n${sel?.prompt ?? ""}\n\n[END SYSTEM]\n${endPrompt}`}</pre>
          </div>
        </div>
      )}
      {!isPC && (
        <div>
          <Label className="text-xs">Preview (resolved)</Label>
          <pre className="mt-1 max-h-[300px] overflow-auto rounded border bg-background p-2 font-mono text-[10px]">{`[SYSTEM]\n${systemPrompt}\n\n[END SYSTEM]\n${endPrompt}`}</pre>
        </div>
      )}

      <div className="flex justify-end gap-2 border-t pt-4">
        <Button variant="ghost" onClick={() => nav({ to: "/prompts" })}>Cancel</Button>
        <Button variant="secondary" onClick={saveAsNewVersion}>Save as new version</Button>
        <Button onClick={save}>Save</Button>
      </div>
    </div>
  );
}
