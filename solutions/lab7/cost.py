"""Cost gate — tiktoken-based token counting and price-table projections."""

import tiktoken

# Approximate prices per 1M tokens (October 2025). Update as needed.
PRICING = {
    "gpt-4o-mini": {"input": 0.15, "output": 0.60},
    "gpt-4o": {"input": 2.50, "output": 10.00},
}


def count_tokens(text: str, model: str = "gpt-4o-mini") -> int:
    """Count tokens for a given text and model."""
    try:
        enc = tiktoken.encoding_for_model(model)
    except KeyError:
        enc = tiktoken.get_encoding("cl100k_base")
    return len(enc.encode(text))


def estimate_cost(
    prompt_tokens: int, output_tokens: int, model: str = "gpt-4o-mini"
) -> float:
    """Estimate the dollar cost of one request."""
    p = PRICING.get(model, PRICING["gpt-4o-mini"])
    return (prompt_tokens * p["input"] + output_tokens * p["output"]) / 1_000_000


def project_cost(cost_per_call: float, calls_per_month: int) -> float:
    """If you run this prompt N times a month, what does it cost?"""
    return cost_per_call * calls_per_month
