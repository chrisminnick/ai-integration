# Content Buddy (POC)

A practical proof-of-concept for a single GenAI application that creates and revises content—fast, on-brand, and grounded in truth.
This POC focuses on **text** generation and shows a pattern you can extend to images, audio, and video later.

## Goals

- Prompt templates in version control
- Style governance (style pack + lint/repair)
- Grounded summarization with citations
- Repurposing to channel presets
- Prompt testing & versioning workflow (tool-agnostic)
- Multi-provider support for different AI models

## Structure

- `prompts/` — JSON prompt templates with metadata
- `style/stylepack.json` — brand voice + constraints
- `configs/channels.json` — channel presets for repurposing
- `configs/providers.json` — AI provider configurations
- `golden_set/` — sample inputs for evaluation
- `src/providers/` — provider implementations (OpenAI, Anthropic, Gemini, Mock)
- `src/` — minimal prompt service, lint, and evaluation harness
- `docs/` — architecture notes
- `.env.example` — environment variables you may need

## Quick start

1. Ensure Node 18+ is installed (global `fetch` available).
2. Copy `.env.example` to `.env` and configure your provider:
   ```bash
   cp .env.example .env
   ```
3. Set your preferred provider and API key:
   ```bash
   # Choose your provider: openai, anthropic, gemini, or mock
   PROVIDER=openai
   OPENAI_API_KEY=your_api_key_here
   ```
4. No additional dependencies required - uses built-in fetch and ES6 modules.
5. Try the CLI:
   ```bash
   node src/cli.js scaffold --asset_type "landing page" --topic "Privacy-first analytics" --audience "startup founders" --tone "confident" --word_count 600
   ```

## Providers

Content Buddy supports multiple AI providers out of the box:

- **OpenAI GPT** (`openai`) - Set `OPENAI_API_KEY`
- **Anthropic Claude** (`anthropic`) - Set `ANTHROPIC_API_KEY`
- **Google Gemini** (`gemini`) - Set `GEMINI_API_KEY`
- **Mock Provider** (`mock`) - No API key needed, returns sample responses

Switch providers by setting the `PROVIDER` environment variable or modifying `configs/providers.json`.

### Provider Configuration

Default settings are in `configs/providers.json`:

```json
{
  "defaultProvider": "openai",
  "providers": {
    "openai": { "model": "gpt-4", "maxTokens": 2000, "temperature": 0.7 },
    "anthropic": {
      "model": "claude-3-sonnet-20240229",
      "maxTokens": 2000,
      "temperature": 0.7
    },
    "gemini": {
      "model": "gemini-1.5-pro",
      "maxTokens": 2000,
      "temperature": 0.7
    }
  }
}
```

## Scripts

- `node src/cli.js scaffold ...` — brief → scaffold (JSON)
- `node src/cli.js expand --section_json '<json>'` — section → draft
- `node src/cli.js rewrite --text '...' --audience '...' --tone '...' --grade_level 8`
- `node src/cli.js summarize --file golden_set/transcripts/example_transcript.txt --mode executive`
- `node src/cli.js repurpose --file golden_set/repurposing/example_article.md`

## Evaluation

Run the evaluation harness against your chosen provider:

```bash
node src/eval/runEvaluations.js
```

This computes:

- Style violations per 1,000 words
- Reading level band compliance
- API latency and cost accounting (with real providers)
- Quality metrics across different prompt templates

## Environment Variables

```bash
# Provider selection
PROVIDER=openai                    # openai, anthropic, gemini, or mock

# API Keys (only needed for respective providers)
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GEMINI_API_KEY=your_gemini_key

# Optional: Override default models
OPENAI_MODEL=gpt-4-turbo
ANTHROPIC_MODEL=claude-3-opus-20240229
GEMINI_MODEL=gemini-1.5-pro-latest
```

## Notes

- **Zero dependencies** - Uses Node.js built-in fetch and ES6 modules
- **Provider abstraction** - Easy to add new AI providers or swap between existing ones
- **Graceful fallback** - Automatically falls back to mock provider if API keys are missing
- **Versioned prompts** - Prompts are plain JSON with `{placeholders}` compatible with most prompt-management tools
- **Production ready patterns** - Includes error handling, configuration management, and evaluation framework

## Development

To add a new provider:

1. Create `src/providers/newProvider.js` extending the base `Provider` class
2. Add provider configuration to `configs/providers.json`
3. Update `providerFactory.js` with the new provider case
4. Add API key handling in the factory's `getApiKey()` method
