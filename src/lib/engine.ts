// One call out to the Claude Code engine. Everything else flows via Supabase Realtime.
export async function pingEngine(baseUrl: string, timeoutMs = 4000): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  if (!baseUrl) return { ok: false, latencyMs: 0, error: "No engine URL configured" };
  const url = baseUrl.replace(/\/$/, "") + "/health";
  const t0 = performance.now();
  try {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(id);
    return { ok: res.ok, latencyMs: Math.round(performance.now() - t0) };
  } catch (e: unknown) {
    return { ok: false, latencyMs: Math.round(performance.now() - t0), error: e instanceof Error ? e.message : String(e) };
  }
}

export async function launchRun(baseUrl: string, runId: string): Promise<void> {
  const url = baseUrl.replace(/\/$/, "") + "/runs";
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ run_id: runId }),
  });
  if (!res.ok && res.status !== 202) {
    throw new Error(`Engine returned ${res.status}: ${await res.text().catch(() => "")}`);
  }
}

export function exportCsvUrl(baseUrl: string, runId: string): string {
  return baseUrl.replace(/\/$/, "") + `/runs/${runId}/export.csv`;
}
