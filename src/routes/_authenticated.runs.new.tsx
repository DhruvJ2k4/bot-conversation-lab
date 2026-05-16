import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCurrentUserId, ALL_MODELS, JUDGE_FACTORS } from "@/lib/app";
import { launchRun } from "@/lib/engine";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/runs/new")({ component: NewRun });

type ConfigRow = {
  id: string; pc_section_id: string | null; persona_id: string | null;
  test_case_id: string | null; seed_conversation_id: string | null;
  repeat_count: number; factors_enabled: string[];
};

function NewRun() {
  const nav = useNavigate();
  const { data: prompts = [] } = useQuery({ queryKey: ["prompts"], queryFn: async () => ((await supabase.from("prompts").select("*")).data ?? []) });
  const { data: leads = [] } = useQuery({ queryKey: ["lead_prompts"], queryFn: async () => ((await supabase.from("lead_prompts").select("id,name")).data ?? []) });
  const { data: judges = [] } = useQuery({ queryKey: ["judge_prompts"], queryFn: async () => ((await supabase.from("judge_prompts").select("*")).data ?? []) });
  const { data: personas = [] } = useQuery({ queryKey: ["personas"], queryFn: async () => ((await supabase.from("personas").select("id,name")).data ?? []) });
  const { data: testCases = [] } = useQuery({ queryKey: ["test_cases"], queryFn: async () => ((await supabase.from("test_cases").select("id,name")).data ?? []) });
  const { data: seeds = [] } = useQuery({ queryKey: ["seed_conversations"], queryFn: async () => ((await supabase.from("seed_conversations").select("id,name")).data ?? []) });
  const { data: settings } = useQuery({ queryKey: ["settings-full"], queryFn: async () => (await supabase.from("settings").select("*").maybeSingle()).data });

  const [name, setName] = useState(() => `Run ${new Date().toISOString().slice(0, 16).replace("T", " ")}`);
  const [botPromptId, setBotPromptId] = useState<string>("");
  const [leadPromptId, setLeadPromptId] = useState<string>("");
  const [judgePromptId, setJudgePromptId] = useState<string>("");
  const [botModel, setBotModel] = useState(settings?.default_bot_model ?? "gpt-4.1");
  const [leadModel, setLeadModel] = useState(settings?.default_lead_model ?? "claude-sonnet-4-5");
  const [judgeModel, setJudgeModel] = useState(settings?.default_judge_model ?? "gemini-2.5-flash");
  const [maxTurns, setMaxTurns] = useState(40);
  const [parallelism, setParallelism] = useState(10);
  const [configs, setConfigs] = useState<ConfigRow[]>([
    { id: crypto.randomUUID(), pc_section_id: null, persona_id: null, test_case_id: null, seed_conversation_id: null, repeat_count: 1, factors_enabled: [...JUDGE_FACTORS] },
  ]);
  const [busy, setBusy] = useState(false);

  const selBot = prompts.find((p) => p.id === botPromptId);
  const sections = (selBot?.kind === "pc_project" && Array.isArray(selBot.sections)) ? (selBot.sections as { id: string; name: string }[]) : [];

  const totalConvos = configs.reduce((a, c) => a + c.repeat_count, 0);
  const estSeconds = useMemo(() => {
    const perConvo = 3 * (maxTurns / 2) + 10;
    return Math.ceil(totalConvos / Math.max(parallelism, 1)) * perConvo;
  }, [totalConvos, maxTurns, parallelism]);

  function updateCfg(id: string, patch: Partial<ConfigRow>) {
    setConfigs((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  async function launch() {
    if (!botPromptId || !leadPromptId) { toast.error("Bot prompt and lead prompt are required"); return; }
    setBusy(true);
    try {
      const user_id = await getCurrentUserId();
      const judge = judges.find((j) => j.id === judgePromptId) ?? judges.find((j) => j.is_default);
      const { data: run, error: runErr } = await supabase.from("runs").insert({
        user_id, name, bot_prompt_id: botPromptId, lead_prompt_id: leadPromptId, judge_prompt_id: judge?.id ?? null,
        config: { bot_model: botModel, lead_model: leadModel, judge_model: judgeModel, max_turns: maxTurns, parallelism,
                  caching_enabled: !!settings?.caching_enabled, token_tracker_enabled: !!settings?.token_tracker_enabled,
                  cost_tracker_enabled: !!settings?.cost_tracker_enabled } as never,
        status: "queued",
      }).select("id").single();
      if (runErr) throw runErr;
      const runId = run.id as string;

      const cfgRows = configs.map((c, i) => ({
        run_id: runId, order_index: i, pc_section_id: c.pc_section_id, persona_id: c.persona_id,
        test_case_id: c.test_case_id, seed_conversation_id: c.seed_conversation_id,
        repeat_count: c.repeat_count, factors_enabled: c.factors_enabled,
      }));
      const { data: insertedCfgs, error: cfgErr } = await supabase.from("run_configs").insert(cfgRows).select("id");
      if (cfgErr) throw cfgErr;

      const engineUrl = settings?.cc_api_base_url ?? "";
      if (engineUrl) {
        try {
          await launchRun(engineUrl, runId);
          toast.success("Run launched");
        } catch (e) {
          await supabase.from("runs").update({ status: "failed", status_message: e instanceof Error ? e.message : String(e) }).eq("id", runId);
          toast.error(`Engine unreachable — run marked failed: ${e instanceof Error ? e.message : ""}`);
        }
      } else {
        // Mock mode
        await mockRun(runId, insertedCfgs![0].id, selBot?.system_prompt ?? "", "");
        toast.success("Mock run launched (no engine configured)");
      }
      nav({ to: "/runs/$id", params: { id: runId } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title="New Run" />
      <div className="space-y-6 p-8">
        <section className="space-y-3 rounded-lg border bg-card p-5">
          <h2 className="text-sm font-medium">Configuration</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
            <Field label="Max turns"><Input type="number" value={maxTurns} onChange={(e) => setMaxTurns(+e.target.value)} /></Field>
            <Field label="Bot prompt"><PickSelect value={botPromptId} onChange={setBotPromptId} options={prompts.map((p) => ({ value: p.id, label: `${p.name} (${p.kind})` }))} /></Field>
            <Field label="Lead prompt"><PickSelect value={leadPromptId} onChange={setLeadPromptId} options={leads.map((l) => ({ value: l.id, label: l.name }))} /></Field>
            <Field label="Judge prompt"><PickSelect value={judgePromptId} onChange={setJudgePromptId} options={judges.map((j) => ({ value: j.id, label: j.name + (j.is_default ? " (default)" : "") }))} /></Field>
            <Field label="Parallelism"><Input type="number" value={parallelism} onChange={(e) => setParallelism(Math.min(20, +e.target.value))} /></Field>
            <Field label="Bot model"><ModelSelect value={botModel} onChange={setBotModel} /></Field>
            <Field label="Lead model"><ModelSelect value={leadModel} onChange={setLeadModel} /></Field>
            <Field label="Judge model"><ModelSelect value={judgeModel} onChange={setJudgeModel} /></Field>
          </div>
        </section>

        <section className="space-y-3 rounded-lg border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium">Configs</h2>
            <Button size="sm" variant="secondary" onClick={() => setConfigs([...configs, { id: crypto.randomUUID(), pc_section_id: null, persona_id: null, test_case_id: null, seed_conversation_id: null, repeat_count: 1, factors_enabled: [...JUDGE_FACTORS] }])}><Plus className="mr-1 h-3.5 w-3.5" /> Add Config</Button>
          </div>
          <div className="space-y-3">
            {configs.map((c, i) => (
              <div key={c.id} className="grid grid-cols-6 gap-2 rounded border bg-background p-3 text-xs">
                <div className="col-span-6 flex items-center justify-between"><span className="font-mono text-muted-foreground">#{i + 1}</span>
                  <Button size="icon" variant="ghost" disabled={configs.length === 1} onClick={() => setConfigs(configs.filter((x) => x.id !== c.id))}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
                <Field label="PC Section"><PickSelect disabled={selBot?.kind !== "pc_project"} value={c.pc_section_id ?? ""} onChange={(v) => updateCfg(c.id, { pc_section_id: v || null })} options={sections.map((s) => ({ value: s.id, label: s.name }))} /></Field>
                <Field label="Persona"><PickSelect value={c.persona_id ?? ""} onChange={(v) => updateCfg(c.id, { persona_id: v || null })} options={personas.map((p) => ({ value: p.id, label: p.name }))} /></Field>
                <Field label="Test case"><PickSelect value={c.test_case_id ?? ""} onChange={(v) => updateCfg(c.id, { test_case_id: v || null })} options={testCases.map((t) => ({ value: t.id, label: t.name }))} /></Field>
                <Field label="Seed convo"><PickSelect value={c.seed_conversation_id ?? ""} onChange={(v) => updateCfg(c.id, { seed_conversation_id: v || null })} options={seeds.map((s) => ({ value: s.id, label: s.name }))} /></Field>
                <Field label="Repeat"><Input type="number" min={1} max={20} value={c.repeat_count} onChange={(e) => updateCfg(c.id, { repeat_count: +e.target.value })} /></Field>
                <Field label="Factors">
                  <div className="flex flex-wrap gap-1">
                    {JUDGE_FACTORS.map((f) => {
                      const on = c.factors_enabled.includes(f);
                      return <button key={f} type="button" onClick={() => updateCfg(c.id, { factors_enabled: on ? c.factors_enabled.filter((x) => x !== f) : [...c.factors_enabled, f] })} className={`rounded px-1.5 py-0.5 text-[10px] ${on ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>{f}</button>;
                    })}
                  </div>
                </Field>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-end justify-between rounded-lg border bg-card p-5">
          <div className="text-sm">
            <div>Total conversations: <span className="font-mono">{totalConvos}</span></div>
            <div className="text-xs text-muted-foreground">Estimated runtime: ~{Math.round(estSeconds * 0.7 / 60)}–{Math.round(estSeconds * 1.3 / 60)} min</div>
            {!settings?.cc_api_base_url && <div className="mt-1 text-xs text-amber-300">Engine not configured — will run in mock mode.</div>}
          </div>
          <div className="flex gap-2">
            <Button asChild variant="ghost"><Link to="/runs">Cancel</Link></Button>
            <Button onClick={launch} disabled={busy}>{busy ? "Launching…" : "Launch Run"}</Button>
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1"><Label className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</Label>{children}</div>;
}

function PickSelect({ value, onChange, options, disabled }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; disabled?: boolean }) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
      <SelectContent>{options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
    </Select>
  );
}

function ModelSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>{ALL_MODELS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
    </Select>
  );
}

async function mockRun(runId: string, runConfigId: string, botPrompt: string, leadPrompt: string) {
  await supabase.from("runs").update({ status: "running", started_at: new Date().toISOString() }).eq("id", runId);
  const { data: conv } = await supabase.from("conversations").insert({
    run_id: runId, run_config_id: runConfigId, config_label: "Mock conversation",
    bot_system_prompt_resolved: botPrompt, lead_prompt_resolved: leadPrompt, status: "running", started_at: new Date().toISOString(),
  }).select("id").single();
  if (!conv) return;
  const convId = conv.id as string;
  // Fire off mock turns in the background
  (async () => {
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 500));
      const speaker = i % 2 === 0 ? "bot" : "lead";
      await supabase.from("turns").insert({
        conversation_id: convId, turn_index: i, speaker,
        content: speaker === "bot" ? `Bot turn ${i}: Namaste, aapka kya naam hai?` : `Lead turn ${i}: Mera naam Ravi hai.`,
        latency_ms: 800 + Math.floor(Math.random() * 800), tokens_in: 120, tokens_out: 80, cost_usd: 0.0012,
      });
    }
    const factors = [...JUDGE_FACTORS];
    const scoresByFactor: Record<string, number> = {};
    for (const f of factors) {
      const s = 3 + Math.random() * 2;
      scoresByFactor[f] = +s.toFixed(1);
      const { data: jp } = await supabase.from("judge_prompts").select("id").eq("is_default", true).maybeSingle();
      if (jp) await supabase.from("scores").insert({ conversation_id: convId, judge_prompt_id: jp.id, factor: f, score: +s.toFixed(1), rationale: `Mock rationale for ${f}.` });
    }
    const avg = +(Object.values(scoresByFactor).reduce((a, b) => a + b, 0) / factors.length).toFixed(2);
    await supabase.from("conversations").update({ status: "done", completed_at: new Date().toISOString(), turn_count: 10, total_latency_ms: 12000, avg_score: avg, scores_by_factor: scoresByFactor as never, total_tokens_in: 1200, total_tokens_out: 800, total_cost_usd: 0.012 }).eq("id", convId);
    await supabase.from("runs").update({ status: "done", completed_at: new Date().toISOString() }).eq("id", runId);
  })();
}
