
# Connect the local engine to Supabase

Nothing changes in the Lovable app — all wiring is on your engine machine. Below are the exact values to paste and how to verify the round-trip.

## 1. Fill in the engine's `.env`

This file lives next to your Claude Code engine process (NOT in the Lovable repo). Paste:

```
SUPABASE_URL=https://bowhuslxbyzzvfhvrtlu.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<paste from Lovable Cloud → Backend → API keys → service_role>
PORT=8000
LOG_LEVEL=INFO
NGROK_AUTHTOKEN=<your ngrok token from dashboard.ngrok.com>
```

Notes:
- `SUPABASE_URL` is already pinned to this project — use the value above as-is.
- `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS. Never commit it, never paste it into the Lovable app, never expose it in browser code. Only the engine process holds it.
- The publishable/anon key in the repo's `.env` is the wrong key — do not use it for the engine.

## 2. Get the service_role key

In Lovable: open the Cloud/Backend panel → API keys → copy `service_role` (starts with `eyJ...`, different from the anon key). Paste into the engine `.env`.

## 3. Start engine + tunnel

```
python -m your_engine          # binds 127.0.0.1:8000
ngrok http 8000                # prints https://<id>.ngrok-free.app
```

Engine must expose at minimum:
- `GET  /health` → `200 {"ok": true}`
- `POST /runs`   → `202` with body `{ "run_id": "<uuid>" }`

## 4. Point the Lovable app at the tunnel

1. Sign in to the app (you're on `/login` now).
2. Go to **Settings**.
3. Paste the ngrok URL into **Engine endpoint** (e.g. `https://abc123.ngrok-free.app`).
4. Click **Test** → expect green dot + latency.
5. **Save settings**.

Once saved, the amber "Engine offline — mock mode" banner on `/runs/new` disappears, the header badge flips to green, and launching a run will `POST /runs` to your engine instead of running `mockRun`.

## 5. Data flow (so you know what to implement in the engine)

```
Browser ── insert runs (user_id) ──► Supabase
Browser ── POST /runs {run_id} ────► Engine
Engine  ── select run/config (service_role) ─► Supabase
Engine  ── insert conversations / turns / scores / llm_calls ─► Supabase
Supabase ── realtime push ─────────► Browser (live updates)
```

**Critical engine rule:** the engine writes with `service_role` (bypasses RLS), so it MUST stamp the correct `user_id` on every row it inserts. Read `user_id` from the `runs` row, then propagate it to `conversations` (already linked via `run_id`, which the RLS policies traverse) and stamp it on any direct inserts. If you skip this, rows insert fine but the UI won't see them because the browser session reads under RLS.

Tables the engine writes to (already created):
- `runs` — update `status`, `started_at`, `completed_at`, `status_message`, `metrics`
- `conversations` — insert per conversation, then update `status`, `turn_count`, `avg_score`, `scores_by_factor`, totals
- `turns` — insert per turn with `latency_ms`, `tokens_in`, `tokens_out`, `cost_usd`
- `scores` — insert one row per (conversation, judge_prompt, factor)
- `llm_calls` — optional, for token/cost tracking

## 6. Smoke-test stub (optional, before plugging in real loop)

A minimal FastAPI stub to verify the full round-trip:

```python
# engine_stub.py
import os, threading, time, uuid
from fastapi import FastAPI
from supabase import create_client

sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])
app = FastAPI()

@app.get("/health")
def health(): return {"ok": True}

@app.post("/runs")
def runs(body: dict):
    run_id = body["run_id"]
    threading.Thread(target=fake_loop, args=(run_id,), daemon=True).start()
    return {"run_id": run_id}, 202

def fake_loop(run_id):
    run = sb.table("runs").select("*").eq("id", run_id).single().execute().data
    user_id = run["user_id"]
    sb.table("runs").update({"status": "running"}).eq("id", run_id).execute()
    cfg = sb.table("run_configs").select("id").eq("run_id", run_id).limit(1).execute().data[0]
    conv = sb.table("conversations").insert({
        "run_id": run_id, "run_config_id": cfg["id"],
        "bot_system_prompt_resolved": "stub", "lead_prompt_resolved": "stub",
        "status": "running", "started_at": "now()",
    }).execute().data[0]
    for i in range(6):
        time.sleep(0.5)
        sb.table("turns").insert({
            "conversation_id": conv["id"], "turn_index": i,
            "speaker": "bot" if i % 2 == 0 else "lead",
            "content": f"stub turn {i}",
        }).execute()
    sb.table("conversations").update({"status": "done"}).eq("id", conv["id"]).execute()
    sb.table("runs").update({"status": "done"}).eq("id", run_id).execute()
```

Run, tunnel, paste URL, launch a run from `/runs/new` — you should see turns stream into the conversation viewer live via Realtime.

## What I will NOT change

No code edits in the Lovable app are needed — `Settings` already accepts the endpoint, `EngineStatusBadge` already polls `/health`, and `launchRun` already POSTs to `/runs`. If the round-trip fails after you paste the URL, come back with the specific error (badge text, network tab, or engine log) and I'll patch the relevant piece.
