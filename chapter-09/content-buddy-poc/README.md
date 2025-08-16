# Content Buddy POC

A production-ready proof-of-concept for AI-powered content generation with enterprise-grade reliability, monitoring, and evaluation capabilities. This system demonstrates a complete workflow from content generation to quality assurance using multiple AI providers.

## 🚀 Features

- **Multi-Provider AI Support** - OpenAI, Anthropic, Gemini with automatic failover
- **Production-Ready Architecture** - Error handling, circuit breakers, health monitoring
- **Comprehensive Evaluation** - Golden set testing with 9 test categories
- **Template Management** - Versioned JSON templates with A/B testing
- **Style Governance** - Brand voice enforcement and content validation
- **Observability** - Structured logging, metrics, and monitoring
- **CLI Interface** - Complete command-line interface for all operations

## 📋 Requirements

- Node.js 18+
- At least one AI provider API key (OpenAI, Anthropic, or Gemini)

## ⚡ Quick Start

### 1. Setup Environment

```bash
# Clone and navigate to project
cd content-buddy-poc

# Create environment configuration
npm run setup

# Edit .env with your API keys
# Required: Set at least one provider API key
PROVIDER=openai
OPENAI_API_KEY=your_api_key_here
```

### 2. Verify Installation

```bash
# Check system health
npm run health

# Validate templates and configuration
npm run validate
```

### 3. Generate Content

```bash
# Generate content using a template
npm run generate repurpose_pack@1.0.0 my-content/build-ai-applications.json output.json

# Or use the CLI directly
node app.js generate repurpose_pack@1.0.0 input.json output.json
```

### 4. Run Evaluations

```bash
# Run comprehensive evaluation suite
npm run eval:comprehensive

# Run specific evaluations
npm run evaluate
```

## 🏗️ Architecture

### Core Components

- **`app.js`** - Main application entry point with integrated CLI
- **`src/ContentBuddy.js`** - Core content generation orchestrator
- **`src/utils/`** - Production utilities (error handling, monitoring, etc.)
- **`prompts/`** - Versioned JSON prompt templates
- **`golden_set/`** - Comprehensive test data across 9 categories
- **`configs/`** - Provider and channel configurations
- **`style/`** - Style pack governance rules

### Production Utilities

- **Error Handling** - Custom error types, retry logic, circuit breakers
- **Configuration Management** - Environment-aware config with validation
- **Observability** - Structured logging with multiple output formats
- **Monitoring** - Health checks, metrics collection, system monitoring
- **Provider Management** - Multi-provider support with intelligent failover
- **Template Management** - A/B testing, caching, version management

## 🔧 Configuration

### Environment Variables

Key configuration options in `.env`:

```bash
# Core Settings
NODE_ENV=development          # development/production
LOG_LEVEL=info               # debug/info/warn/error
PROVIDER=openai              # openai/anthropic/gemini

# AI Provider Keys (set at least one)
OPENAI_API_KEY=your_key
ANTHROPIC_API_KEY=your_key
GEMINI_API_KEY=your_key

# Performance & Reliability
CIRCUIT_BREAKER_THRESHOLD=5
HEALTH_CHECK_INTERVAL=60000
METRICS_ENABLED=true
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
