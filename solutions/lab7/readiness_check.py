"""Production readiness checker — runs each golden-set case through three gates.

Order of imports matters: load_dotenv() runs before any module that may construct
an OpenAI client at import time.
"""

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

from openai import OpenAI

from cost import estimate_cost, project_cost
from evals import evaluate
from safety import check_safety

MODEL = os.getenv("MODEL", "gpt-4o-mini")
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def run_check(test_case: dict) -> dict:
    """Run a single test case through the model and all three gates."""
    prompt = test_case["prompt"]
    expectations = test_case["expectations"]
    pii_allowed = bool(test_case.get("pii_allowed", False))

    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0,
    )
    output = response.choices[0].message.content or ""
    prompt_toks = response.usage.prompt_tokens
    output_toks = response.usage.completion_tokens

    eval_results = evaluate(output, expectations)
    safety_results = check_safety(output, pii_allowed=pii_allowed)
    cost_per_call = estimate_cost(prompt_toks, output_toks, MODEL)
    cost_results = {
        "prompt_tokens": prompt_toks,
        "output_tokens": output_toks,
        "cost_per_call_usd": cost_per_call,
        "projected_10k_calls_usd": project_cost(cost_per_call, 10_000),
    }

    eval_pass = all(eval_results.values()) if eval_results else True
    safety_pass = safety_results["moderation_passed"] and safety_results["pii_clean"]

    return {
        "id": test_case["id"],
        "output": output,
        "eval": {"pass": eval_pass, "details": eval_results},
        "safety": {"pass": safety_pass, "details": safety_results},
        "cost": cost_results,
        "ready_to_ship": eval_pass and safety_pass,
    }


def _format_money(amount: float) -> str:
    if amount < 0.01:
        return f"${amount:.6f}"
    return f"${amount:.4f}"


def main() -> int:
    golden_path = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("golden_set.json")
    with golden_path.open() as f:
        cases = json.load(f)

    results = [run_check(c) for c in cases]

    print(f"\n{'=' * 70}")
    print(f"PRODUCTION READINESS REPORT — {MODEL}")
    print(f"{'=' * 70}\n")

    total_cost = 0.0
    for r in results:
        status = "READY" if r["ready_to_ship"] else "BLOCKED"
        print(f"[{status}]  {r['id']}")
        print(
            f"   Eval:   {'PASS' if r['eval']['pass'] else 'FAIL'} — {r['eval']['details']}"
        )
        print(
            f"   Safety: {'PASS' if r['safety']['pass'] else 'FAIL'} — {r['safety']['details']}"
        )
        print(
            f"   Cost:   {_format_money(r['cost']['cost_per_call_usd'])}/call  "
            f"→ {_format_money(r['cost']['projected_10k_calls_usd'])} per 10k calls"
        )
        snippet = r["output"].replace("\n", " ")
        print(f"   Output: {snippet[:120]}{'...' if len(snippet) > 120 else ''}\n")
        total_cost += r["cost"]["projected_10k_calls_usd"]

    passed = sum(1 for r in results if r["ready_to_ship"])
    print(f"{'=' * 70}")
    print(f"Overall: {passed}/{len(results)} test cases ready to ship")
    print(f"Total projected cost at 10k calls each: {_format_money(total_cost)}")
    print(f"{'=' * 70}\n")

    reports_dir = Path("reports")
    reports_dir.mkdir(exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H-%M-%SZ")
    report_path = reports_dir / f"{stamp}-readiness.json"
    with report_path.open("w") as f:
        json.dump(
            {"model": MODEL, "generated_at": stamp, "results": results},
            f,
            indent=2,
        )
    print(f"Report saved to {report_path}")

    return 0 if passed == len(results) else 1


if __name__ == "__main__":
    sys.exit(main())
