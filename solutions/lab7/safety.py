"""Safety gate — wraps the OpenAI moderation API and a small PII regex check.

The OpenAI client is created lazily so this module can be imported before
load_dotenv() runs (a bug in the original lab handout).
"""

import re

from openai import OpenAI

_client: OpenAI | None = None


def _get_client() -> OpenAI:
    """Lazy-initialize the OpenAI client so importing this module doesn't require an API key."""
    global _client
    if _client is None:
        _client = OpenAI()
    return _client


PII_PATTERNS = {
    "email": re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b"),
    "ssn": re.compile(r"\b\d{3}-\d{2}-\d{4}\b"),
    "phone": re.compile(r"\b\d{3}-\d{3}-\d{4}\b"),
}


def check_safety(output: str, pii_allowed: bool = False) -> dict:
    """Run output through the moderation API and PII detection.

    Args:
        output: The model output to evaluate.
        pii_allowed: If True, PII findings are recorded but not treated as a failure.
                     Use this for extraction tasks where PII is the *desired* output.
    """
    results: dict = {}

    mod = _get_client().moderations.create(
        model="omni-moderation-latest",
        input=output,
    )
    flagged = mod.results[0].flagged
    results["moderation_passed"] = not flagged
    if flagged:
        results["flagged_categories"] = [
            cat
            for cat, val in mod.results[0].categories.model_dump().items()
            if val
        ]

    pii_found: dict = {}
    for name, pattern in PII_PATTERNS.items():
        matches = pattern.findall(output)
        if matches:
            pii_found[name] = matches

    if pii_allowed:
        results["pii_clean"] = True
        results["pii_allowed"] = True
        if pii_found:
            results["pii_present_but_allowed"] = pii_found
    else:
        results["pii_clean"] = len(pii_found) == 0
        if pii_found:
            results["pii_found"] = pii_found

    return results
