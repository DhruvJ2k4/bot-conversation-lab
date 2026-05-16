import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MODEL_OPTIONS, getCurrentUserId } from "@/lib/app";
import { pingEngine } from "@/lib/engine";

export const Route = createFileRoute("/_authenticated/settings")({ component: SettingsPage });

type Settings = {
  id?: string;
  cc_api_base_url: string | null;
  openai_api_key: string | null;
  anthropic_api_key: string | null;
  google_api_key: string | null;
  openrouter_api_key: string | null;
  default_bot_model: string;
  default_lead_model: string;
  default_judge_model: string;
  caching_enabled: boolean;
  token_tracker_enabled: boolean;
  cost_tracker_enabled: boolean;
};

const KEYS = ["openai_api_key", "anthropic_api_key", "google_api_key", "openrouter_api_key"] as const;
const KEY_LABELS: Record<(typeof KEYS)[number], string> = {
  openai_api_key: "OpenAI",
  anthropic_api_key: "Anthropic",
  google_api_key: "Google",
  openrouter_api_key: "OpenRouter",
};

function SettingsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["settings-full"],
    queryFn: async (): Promise<Settings | null> => {
      const { data } = await supabase.from("settings").select("*").maybeSingle();
      return data as Settings | null;
    },
  });

  const [form, setForm] = useState<Settings | null>(null);
  const [keyInputs, setKeyInputs] = useState<Record<string, string>>({});
  const [health, setHealth] = useState<{ ok: boolean; latencyMs: number; error?: string; at: number } | null>(null);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  if (isLoading || !form) return <Loading />;

  function set<K extends keyof Settings>(k: K, v: Settings[K]) {
    setForm((f) => (f ? { ...f, [k]: v } : f));
  }

  async function save() {
    try {
      const userId = await getCurrentUserId();
      const patch: Partial<Settings> & { user_id: string; updated_at: string } = {
        user_id: userId,
        cc_api_base_url: form!.cc_api_base_url,
        default_bot_model: form!.default_bot_model,
        default_lead_model: form!.default_lead_model,
        default_judge_model: form!.default_judge_model,
        caching_enabled: form!.caching_enabled,
        token_tracker_enabled: form!.token_tracker_enabled,
        cost_tracker_enabled: form!.cost_tracker_enabled,
        updated_at: new Date().toISOString(),
      };
      for (const k of KEYS) {
        const newVal = keyInputs[k];
        if (newVal && newVal.trim()) (patch as Record<string, unknown>)[k] = newVal.trim();
      }
      const { error } = await supabase.from("settings").upsert(patch, { onConflict: "user_id" });
      if (error) throw error;
      setKeyInputs({});
      toast.success("Settings saved");
      qc.invalidateQueries({ queryKey: ["settings"] });
      qc.invalidateQueries({ queryKey: ["settings-full"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  }

  async function testEngine() {
    const r = await pingEngine(form!.cc_api_base_url ?? "");
    setHealth({ ...r, at: Date.now() });
    if (r.ok) toast.success(`Connected (${r.latencyMs}ms)`);
    else toast.error(`Unreachable${r.error ? `: ${r.error}` : ""}`);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-8">
      <header>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Single-tenant configuration. API keys are stored encrypted at rest.</p>
      </header>

      <Section title="Engine endpoint" desc="URL of your local Claude Code engine (tunneled).">
        <div className="flex gap-2">
          <Input
            placeholder="https://your-tunnel.example.com"
            value={form.cc_api_base_url ?? ""}
            onChange={(e) => set("cc_api_base_url", e.target.value)}
            className="font-mono"
          />
          <Button variant="secondary" onClick={testEngine} type="button">Test</Button>
        </div>
        {health && (
          <p className="mt-2 text-xs text-muted-foreground">
            {health.ok ? `Connected · ${health.latencyMs}ms` : `Unreachable${health.error ? ` · ${health.error}` : ""}`}
            {" · "}{new Date(health.at).toLocaleTimeString()}
          </p>
        )}
      </Section>

      <Section title="API keys" desc="Used by the engine; written to the database, never displayed after save.">
        <div className="space-y-3">
          {KEYS.map((k) => {
            const stored = form[k];
            return (
              <div key={k} className="grid grid-cols-[120px,1fr] items-center gap-3">
                <Label className="text-sm">{KEY_LABELS[k]}</Label>
                {stored ? (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">••••• (saved)</span>
                    <Input
                      placeholder="Replace…"
                      value={keyInputs[k] ?? ""}
                      onChange={(e) => setKeyInputs((s) => ({ ...s, [k]: e.target.value }))}
                      className="font-mono text-xs"
                    />
                  </div>
                ) : (
                  <Input
                    placeholder={`${KEY_LABELS[k]} key`}
                    value={keyInputs[k] ?? ""}
                    onChange={(e) => setKeyInputs((s) => ({ ...s, [k]: e.target.value }))}
                    className="font-mono text-xs"
                  />
                )}
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Default models">
        <div className="grid grid-cols-3 gap-3">
          {(["default_bot_model", "default_lead_model", "default_judge_model"] as const).map((k) => (
            <div key={k}>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">{k.replace("default_", "").replace("_model", "")}</Label>
              <Select value={form[k]} onValueChange={(v) => set(k, v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(MODEL_OPTIONS).map(([prov, ms]) => (
                    <div key={prov}>
                      <div className="px-2 py-1 text-[10px] uppercase text-muted-foreground">{prov}</div>
                      {ms.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Toggles">
        <div className="space-y-2">
          <Toggle label="Caching" desc="Reuse engine LLM responses for identical inputs." value={form.caching_enabled} onChange={(v) => set("caching_enabled", v)} />
          <Toggle label="Token tracker" desc="Log input/output tokens per turn." value={form.token_tracker_enabled} onChange={(v) => set("token_tracker_enabled", v)} />
          <Toggle label="Cost tracker" desc="Compute USD cost per turn from provider pricing." value={form.cost_tracker_enabled} onChange={(v) => set("cost_tracker_enabled", v)} />
        </div>
      </Section>

      <div className="flex justify-end">
        <Button onClick={save}>Save settings</Button>
      </div>
    </div>
  );
}

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-lg border bg-card p-5">
      <div>
        <h2 className="text-sm font-medium">{title}</h2>
        {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
      </div>
      {children}
    </section>
  );
}

function Toggle({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between rounded border bg-background px-3 py-2">
      <div>
        <div className="text-sm">{label}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}

function Loading() {
  return <div className="p-8 text-sm text-muted-foreground">Loading…</div>;
}
