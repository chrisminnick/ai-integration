# Lab 6 — AI Agents with Tool Use (Solution)

A ~150-line ReAct-style agent built on OpenAI function calling.

## Setup

```bash
cd solutions/lab6
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env and set OPENAI_API_KEY=sk-...
```

## Run

```bash
python agent.py "Who is the CEO and when was the company founded?"
python agent.py "What's 1234 * 5678?"
python agent.py "Where is HQ, what time is it, and what's 100 / 7?"

# Destructive tool — prompts for confirmation:
python agent.py "Delete user 42."

# Same thing without the interactive prompt (useful for scripts/tests):
python agent.py --yes "Delete user 42."
```

## Files

- `tools.py` — four tools (`calculator`, `get_time`, `lookup`, `delete_user`), their OpenAI schemas, and `DESTRUCTIVE_TOOLS`.
- `agent.py` — the ReAct loop with guardrails baked in.
- `requirements.txt` — `openai`, `python-dotenv`.

## Guardrails included

| Guardrail | Where | What it does |
| --- | --- | --- |
| Allowlist | `TOOL_REGISTRY` | The agent can only execute functions that are in the registry. |
| Step cap | `MAX_STEPS` (default 8) | Prevents runaway agent loops. |
| Human approval | `DESTRUCTIVE_TOOLS` | `delete_user` requires a `y/N` confirmation before running. |
| Loop break (Extension B) | `recent_calls` window | If the same tool+args fires 3x in a row, the agent is told to stop and answer. |
| Prompt-injection guard (Extension C) | `_wrap_tool_output` | Tool output is wrapped in `[TOOL_OUTPUT_BEGIN]…[TOOL_OUTPUT_END]` plus a reminder that tool content is data, not instructions. |

## What was fixed/improved vs. the lab handout

- `get_time` now uses `datetime.datetime.now(datetime.timezone.utc).isoformat()` instead of the deprecated `utcnow()` (removed in Python 3.12+).
- `load_dotenv()` is called before `OpenAI()` is constructed, so the client always sees `OPENAI_API_KEY` from `.env`.
- The destructive-tool guard, loop-break guard, and prompt-injection guard are all wired in by default rather than left as standalone snippets.
- `--yes` flag added so the destructive path is testable without a TTY.
