# Free and Local Model Options for the New Labs

## The short answer

**Yes** — every one of the four new labs can be run without paying OpenAI a cent. The two best paths:

1. **Local: Ollama** — runs models on each student's laptop. Free, offline, private. The only requirement is enough RAM (8GB is fine for small models, 16GB+ for 8B-class models).
2. **Free cloud: Groq** — free API tier with no credit card, very fast inference on Llama/Mistral/Mixtral. Use it when local hardware is insufficient.

Both expose **OpenAI-compatible APIs**, which means the lab code from your books works with a one-line change.

## Why this is easy

Most modern LLM client libraries (OpenAI Python SDK, OpenAI Node SDK) accept a `base_url` parameter. Point that at Ollama or Groq instead of OpenAI's endpoint, and the rest of the code runs unchanged. For example:

```python
# OpenAI (default):
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Ollama (local, free):
client = OpenAI(api_key="ollama", base_url="http://localhost:11434/v1")

# Groq (cloud, free tier):
client = OpenAI(api_key=os.getenv("GROQ_API_KEY"), base_url="https://api.groq.com/openai/v1")
```

The rest of the lab code — `client.chat.completions.create(...)` — works identically. Tool calling, streaming, and embeddings all map.

## Setup — Ollama (recommended for classroom use)

One-time install on each lab VM or student laptop:

```bash
# macOS / Linux
curl -fsSL https://ollama.com/install.sh | sh

# Then pull the models you need
ollama pull llama3.1:8b           # general-purpose, ~5GB
ollama pull nomic-embed-text      # embeddings, ~270MB
ollama pull llama-guard3:1b       # safety classifier (Lab 7), ~1.6GB
```

Ollama runs a local server on `http://localhost:11434`. The first run of a model loads it into RAM and stays warm. Inference speed depends on hardware — Apple Silicon Macs are particularly fast.

## Setup — Groq (recommended when local isn't an option)

1. Sign up at https://console.groq.com (no credit card)
2. Generate an API key
3. Free tier: ~30 req/min, generous daily quota — more than enough for a classroom lab

Available models include Llama 3.3 70B, Llama 3.1 8B, Mixtral 8x7B, Gemma 2. Speed is *very* fast (often 5–10x faster than OpenAI).

## Per-lab guidance

### Lab 5 — RAG

**Verdict: works perfectly with local models.** Probably the cleanest swap of the four.

**Changes needed:**
- Embeddings: swap `text-embedding-3-small` → `nomic-embed-text` (Ollama) or a sentence-transformers model
- Chat: swap `gpt-4o-mini` → `llama3.1:8b` (Ollama) or `llama-3.1-8b-instant` (Groq)

**Code change in Lab 5's `rag.js`:**

```javascript
// Original:
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Ollama:
const client = new OpenAI({
  apiKey: "ollama",
  baseURL: "http://localhost:11434/v1"
});

// Then:
await client.embeddings.create({ model: "nomic-embed-text", input: query });
// and:
await client.chat.completions.create({ model: "llama3.1:8b", messages: [...] });
```

**Quality note:** for the small product dataset in this lab, local 8B models retrieve and answer perfectly. No quality compromise.

**Pure-Python alternative** (no Ollama needed): use the `sentence-transformers` library for embeddings, all running locally with no model server:

```python
from sentence_transformers import SentenceTransformer
model = SentenceTransformer("all-MiniLM-L6-v2")  # 90MB, no API
embeddings = model.encode(texts).tolist()
```

This is actually a *better* pedagogical choice for Lab 5 — students see the embedding model directly, no API curtain.

---

### Lab 6 — AI Agents with Tool Use

**Verdict: works, with a caveat.** Function-calling support varies by model. The OpenAI API's tool-calling is the most polished; local models have caught up but can be flakier.

**Recommended models for tool calling:**

| Provider | Model | Tool-calling quality |
|---|---|---|
| Ollama | `llama3.1:8b` | Good. Best free-local option. |
| Ollama | `qwen2.5:7b` | Very good, often better than Llama. |
| Groq | `llama-3.3-70b-versatile` | Excellent. Closest to GPT-4o quality. |
| Groq | `llama-3.1-8b-instant` | Good, very fast. |

**Code change in Lab 6's `agent.py`:**

```python
# Original:
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
MODEL = "gpt-4o-mini"

# Ollama:
client = OpenAI(api_key="ollama", base_url="http://localhost:11434/v1")
MODEL = "llama3.1:8b"

# Groq:
client = OpenAI(api_key=os.getenv("GROQ_API_KEY"), base_url="https://api.groq.com/openai/v1")
MODEL = "llama-3.3-70b-versatile"
```

**Known issues with local models in this lab:**
- Local 7-8B models occasionally output malformed JSON for tool arguments. The lab's existing `try/except` around `json.loads()` already handles this; just point it out to students as a real-world issue.
- They're more likely to forget to stop and announce a final answer. The `MAX_STEPS = 8` guardrail covers this.
- Groq's Llama 3.3 70B is essentially indistinguishable from GPT-4o-mini for this lab. Free, fast, and reliable.

**Recommendation:** use Groq for Lab 6 if internet is available; use Ollama with `qwen2.5:7b` if offline.

---

### Lab 7 — Evaluation, Safety & Governance

**Verdict: works, but needs the most substitution.** Three pieces depend on OpenAI specifically — let's swap each one.

**Piece 1: Chat completion** → same swap as the other labs.

**Piece 2: OpenAI Moderation API** → replace with **Llama Guard 3** (free, runs in Ollama).

Llama Guard is Meta's open-weight content classifier. It does the same job as the OpenAI moderation API — flags unsafe content across categories like violence, hate, self-harm, sexual content, etc.

```bash
ollama pull llama-guard3:1b
```

Replace the `check_safety` function in `safety.py`:

```python
import re
from openai import OpenAI

# Llama Guard via Ollama
client = OpenAI(api_key="ollama", base_url="http://localhost:11434/v1")

UNSAFE_CATEGORIES = {
    "S1": "Violent Crimes",
    "S2": "Non-Violent Crimes",
    "S3": "Sex Crimes",
    "S4": "Child Sexual Exploitation",
    "S5": "Defamation",
    "S6": "Specialized Advice",
    "S7": "Privacy",
    "S8": "Intellectual Property",
    "S9": "Indiscriminate Weapons",
    "S10": "Hate",
    "S11": "Self-Harm",
    "S12": "Sexual Content",
    "S13": "Elections",
}

PII_PATTERNS = { ... }  # same as before

def check_safety(output: str) -> dict:
    results = {}

    # Llama Guard moderation
    response = client.chat.completions.create(
        model="llama-guard3:1b",
        messages=[{"role": "user", "content": output}],
    )
    guard_output = response.choices[0].message.content.strip()
    # Llama Guard returns either "safe" or "unsafe\nS1,S5,..." with categories
    is_safe = guard_output.lower().startswith("safe")
    results["moderation_passed"] = is_safe
    if not is_safe:
        # Parse out the category codes
        lines = guard_output.split("\n")
        if len(lines) > 1:
            cats = lines[1].split(",")
            results["flagged_categories"] = [UNSAFE_CATEGORIES.get(c.strip(), c.strip()) for c in cats]

    # PII detection (unchanged — no API needed)
    pii_found = {}
    for name, pattern in PII_PATTERNS.items():
        matches = pattern.findall(output)
        if matches:
            pii_found[name] = matches
    results["pii_clean"] = len(pii_found) == 0
    if pii_found:
        results["pii_found"] = pii_found

    return results
```

**Piece 3: tiktoken (cost.py)** → this is fully offline already. No change needed. The pricing table you'll want to switch — if you're running locally, "cost" becomes a function of compute time rather than dollars. Re-frame as:

```python
# For local models, "cost" is wall-clock time and electricity, not API spend.
# Show students that the SAME readiness check can be reused with different
# pricing once they switch to a paid API.
PRICING = {
    "llama3.1:8b": {"input": 0, "output": 0},   # local
    "llama-3.3-70b-versatile": {"input": 0, "output": 0},  # Groq free tier
    "gpt-4o-mini": {"input": 0.15, "output": 0.60},  # for comparison
}
```

This is actually a *more interesting* discussion: when does local become cheaper than API? Roughly at ~50k requests/day for a given workload, depending on hardware.

**Llama Guard quality vs. OpenAI moderation:** comparable for the obvious categories (violence, hate, sexual content). Slightly different category taxonomy. For a teaching lab, it's a perfectly good substitute.

---

### Lab 8 — Production AI Chat App

**Verdict: works perfectly.** Streaming is well-supported by both Ollama and Groq.

**Backend change** (Python Flask):

```python
# Original:
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
# ...
stream = client.chat.completions.create(model="gpt-4o-mini", messages=messages, stream=True)

# Ollama:
client = OpenAI(api_key="ollama", base_url="http://localhost:11434/v1")
stream = client.chat.completions.create(model="llama3.1:8b", messages=messages, stream=True)
```

The rest of the streaming code (frontend included) works identically. Token-by-token streaming over `text/plain` is standard.

**Note on local streaming UX:** local models on consumer laptops typically produce 20-50 tokens/second — slower than OpenAI but still feels responsive. On Apple Silicon it's often faster than you'd expect.

## Recommendation by classroom scenario

| Scenario | Recommended setup |
|---|---|
| Lab VMs with no internet | Ollama, models pre-installed |
| Lab VMs with internet but no API budget | Groq free tier (sign up takes 30 seconds) |
| Students bring own laptops, varied hardware | Groq (works for everyone) — falls back to Ollama for those with capable machines |
| Privacy-sensitive corporate audience | Ollama only — no data leaves the laptop |
| You want OpenAI's quality + tooling without paying | Free tier on Google AI Studio (Gemini 2.0 Flash, very generous quota) — also OpenAI-compatible API style |

## Other free options worth knowing

- **Google AI Studio** (https://aistudio.google.com) — Gemini 2.0 Flash has a generous free tier and supports tool calling, streaming, embeddings. Different API style but excellent quality. Honestly competitive with OpenAI now.
- **Hugging Face Inference API** — free tier exists but rate limits are tight; better for tinkering than for a full lab.
- **Together AI / Fireworks / Replicate** — pay-as-you-go but pennies per million tokens; some offer trial credits.
- **Cohere** — has a free tier with embeddings and a small chat allocation.

## Bottom line

You can absolutely run all four labs free, locally, with no API key. The recommended default for an enterprise developer classroom would be:

- **Lab 5:** Ollama with `nomic-embed-text` + `llama3.1:8b`, OR pure Python with sentence-transformers
- **Lab 6:** Groq with `llama-3.3-70b-versatile` (best balance of quality and zero cost)
- **Lab 7:** Ollama with `llama3.1:8b` for generation + `llama-guard3:1b` for moderation. This is the lab where the model swap creates the *most interesting* learning moment, because students see that "moderation" is just another model.
- **Lab 8:** Ollama with `llama3.1:8b` — streaming feels great locally

Setting up Ollama once per VM image takes about 10 minutes and removes the API-key distribution problem entirely. Strongly recommended.
