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

1. Ensure Node 18+ is installed.
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

The evaluation system allows you to test and benchmark your prompts and AI provider performance across different scenarios.

### Running Evaluations

**Evaluate all brief files (default):**

```bash
node src/eval/runEvaluations.js
```

**Evaluate specific brief files:**

```bash
# Single file
node src/eval/runEvaluations.js brief1.json

# Multiple files
node src/eval/runEvaluations.js brief1.json brief2.json

# Using the --files flag
node src/eval/runEvaluations.js --files brief1.json brief2.json

# Without .json extension (auto-added)
node src/eval/runEvaluations.js brief1 brief2
```

**Get help:**

```bash
node src/eval/runEvaluations.js --help
```

### What the Evaluation Measures

The evaluation harness computes several key metrics:

- **Style violations per 1,000 words** - Checks adherence to your style pack rules
- **Reading level band compliance** - Ensures content matches target audience
- **API latency** - Response times for performance benchmarking
- **Quality metrics** - Across different prompt templates and providers

### Sample Output

```json
{
  "count": 2,
  "latency": {
    "p50": 125,
    "p95": 180
  },
  "samples": [
    {
      "brief": "brief1.json",
      "latencyMs": 125,
      "style": {
        "violations": 0,
        "readingLevel": "appropriate",
        "mustUse": ["privacy", "startup"],
        "mustAvoid": []
      }
    }
  ]
}
```

### Golden Set Structure

The evaluation system uses a comprehensive test suite in the `golden_set/` directory organized by test purpose:

**Core Test Categories:**

- `golden_set/briefs/` - Sample input briefs for testing scaffold generation (includes easy, medium, hard, and extreme complexity levels)
- `golden_set/transcripts/` - Sample transcripts for summarization testing
- `golden_set/repurposing/` - Sample content for repurposing evaluation

**Quality Assurance Categories:**

- `golden_set/edge_cases/` - Boundary conditions and unusual inputs (empty fields, special characters, extreme complexity)
- `golden_set/style_compliance/` - Content designed to test style pack rule adherence (must_use/must_avoid terms, terminology)
- `golden_set/performance/` - Large files and stress test scenarios
- `golden_set/provider_comparison/` - Standardized tests for comparing AI provider outputs
- `golden_set/domain_specific/` - Specialized content requiring domain expertise (technical, legal, medical)
- `golden_set/expected_outputs/` - Reference outputs for validation and regression testing

**File Naming Convention:**
Files follow the pattern: `{type}_{difficulty}_{description}.{ext}`

- `brief_easy_react_tutorial.json` - Simple tutorial brief
- `transcript_hard_technical_meeting.txt` - Complex technical meeting transcript
- `article_medium_remote_teams.md` - Medium complexity repurposing content

### Advanced Evaluation

**Comprehensive Test Suite:**

```bash
# Run the full evaluation suite across all test categories
./scripts/run_comprehensive_evaluation.sh

# Validate golden set integrity before running evaluations
node scripts/validate_golden_set.js

# Test specific categories
node src/eval/runEvaluations.js -d golden_set/edge_cases -o scaffold
node src/eval/runEvaluations.js -d golden_set/performance -o summarize
node src/eval/runEvaluations.js -d golden_set/style_compliance -o scaffold
```

**Test Categories Explained:**

- **Edge Cases**: Tests system robustness with empty fields, special characters, and extreme complexity
- **Performance**: Stress tests with large content to measure latency and token usage
- **Style Compliance**: Validates adherence to style pack rules and terminology
- **Provider Comparison**: Standardized tests for comparing different AI providers
- **Domain Specific**: Tests requiring specialized knowledge (technical, legal, etc.)

**Quality Metrics:**
The improved golden set measures:

- Content accuracy and completeness
- Style pack rule compliance
- Response time and token efficiency
- Error handling and edge case robustness
- Cross-provider consistency

### Comparing Providers

You can compare different AI providers by switching the `PROVIDER` environment variable and running the same evaluation:

```bash
# Test with OpenAI
PROVIDER=openai node src/eval/runEvaluations.js

# Test with Claude
PROVIDER=anthropic node src/eval/runEvaluations.js

# Test with mock provider (no API costs)
PROVIDER=mock node src/eval/runEvaluations.js
```

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
