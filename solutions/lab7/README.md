# Lab 7 — Evaluation, Safety, and Governance (Solution)

A small "production readiness" harness that runs each prompt in a golden set through three gates: **eval**, **safety**, and **cost**.

## Setup

```bash
cd solutions/lab7
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env and set OPENAI_API_KEY=sk-...
```

## Run

```bash
python readiness_check.py
# or point at a different golden set:
python readiness_check.py path/to/other_golden_set.json

# Try a different model (cost goes up ~10x with gpt-4o):
MODEL=gpt-4o python readiness_check.py
```

A timestamped JSON report is written to `reports/` after every run. Diffing reports surfaces regressions.

## Files

- `golden_set.json` — five test cases with expectation specs.
- `evals.py` — string-and-pattern based expectation checks.
- `safety.py` — `omni-moderation-latest` + PII regex; supports a `pii_allowed` flag.
- `cost.py` — tiktoken counts + price table + 10k-calls projection.
- `readiness_check.py` — wires it all together and prints the report.

## What was fixed vs. the lab handout

The handout had several issues that prevented it from running as written:

1. **`safety.py` created the OpenAI client at module import time.** Because `readiness_check.py` imported `safety` *before* its own `load_dotenv()` call, the client construction happened before `OPENAI_API_KEY` was in the environment, and the run failed. The solution uses a lazy `_get_client()` and `readiness_check.py` calls `load_dotenv()` before importing anything that touches OpenAI.
2. **`extract_email` always failed the safety gate** because the test case requires PII in the output. Added a per-case `pii_allowed: true` flag and threaded it through `check_safety()`. The handout calls this out as a discussion point but never fixes it; the solution does both — reports the PII *and* marks the gate as passed when the case opts in.
3. **No report persistence.** The handout's Extension B (save reports to disk) is included by default — every run writes `reports/<UTC-timestamp>-readiness.json`.
4. **Exit code.** `readiness_check.py` exits 0 when all cases pass and 1 otherwise, so it can be wired into CI without additional glue.
5. **Configurable model.** `MODEL=gpt-4o python readiness_check.py` flips the model from the command line — the discussion section asks students to do exactly this comparison.
