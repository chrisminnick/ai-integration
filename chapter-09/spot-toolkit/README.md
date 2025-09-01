# Structured Prompt Output Toolkit (SPOT)

![SPOT Logo](docs/spot-logo-v2.png)

An AI-powered content generation tool, focused on reliability, monitoring, and evaluation capabilities. This system demonstrates a complete workflow from content generation to quality assurance using multiple AI providers.

## About This Project

SPOT was created by Chris Minnick as a demo project for his book, "A Developer's Guide to Integrating Generative AI into Applications" (Wiley Publishing, 2026, ISBN: 9781394373130).

## 🚀 Features

- **Multi-Provider AI Support** - OpenAI, Anthropic, Gemini with automatic failover
- **Production-Ready Architecture** - Error handling, circuit breakers, health monitoring
- **Comprehensive Evaluation** - Golden set testing with 9 test categories
- **Template Management** - Versioned JSON templates with A/B testing
- **Style Governance** - Brand voice enforcement and content validation
- **Offline Style Linting** - Check content compliance without API calls
- **Observability** - Structured logging, metrics, and monitoring
- **CLI Interface** - Complete command-line interface for all operations

## 📋 Requirements

- Node.js 18+
- At least one AI provider API key (OpenAI, Anthropic, or Gemini)

## ⚡ Quick Start

### 1. Setup Environment

```bash
# Clone and navigate to project
git clone https://github.com/chrisminnick/spot-toolkit.git
cd spot-toolkit

# Install dependencies
npm install

# Create environment configuration
npm run setup

# Edit .env with your API keys
# Required: Set at least one provider API key
PROVIDER=openai
OPENAI_API_KEY=your_api_key_here
```

### 2. Verify Installation

```bash
# Check system health and validate templates
npm test

# Or run individual checks
npm run health
npm run validate
```

### 3. Generate Content

```bash
# Start interactive mode (recommended)
npm start

# Generate content using a template
npm run generate repurpose_pack@1.0.0 my-content/build-ai-applications.json output.json

# Use task-specific commands
npm run scaffold -- --asset_type "blog post" --topic "AI applications" --audience "developers" --tone "technical" --word_count 800
```

### 4. Run Evaluations

```bash
# Run all evaluations
npm run eval:all

# Run specific operation evaluations
npm run eval:scaffold
npm run eval:expand
npm run eval:rewrite
npm run eval:summarize
npm run eval:repurpose

# Or run comprehensive evaluation
npm run eval
```

## 🏗️ Architecture

### Core Components

- **[`app.js`](app.js)** - Main application entry point with integrated CLI
- **[`src/SPOT.js`](src/SPOT.js)** - Core content generation orchestrator
- **[`src/utils/`](src/utils/)** - Production utilities (error handling, monitoring, etc.)
- **[`prompts/`](prompts/)** - Versioned JSON prompt templates
- **[`golden_set/`](golden_set/)** - Comprehensive test data across 9 categories
- **[`configs/`](configs/)** - Provider and channel configurations
- **[`style/`](style/)** - Style pack governance rules

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
PROVIDER=openai              # openai/anthropic/gemini/mock

# AI Provider Keys (set at least one)
OPENAI_API_KEY=your_key
ANTHROPIC_API_KEY=your_key
GEMINI_API_KEY=your_key

# Performance & Reliability
CIRCUIT_BREAKER_THRESHOLD=5
HEALTH_CHECK_INTERVAL=60000
METRICS_ENABLED=true
```

## 🤖 Providers

SPOT supports multiple AI providers out of the box:

- **OpenAI GPT** (`openai`) - Set `OPENAI_API_KEY`
- **Anthropic Claude** (`anthropic`) - Set `ANTHROPIC_API_KEY`
- **Google Gemini** (`gemini`) - Set `GEMINI_API_KEY`
- **Mock Provider** (`mock`) - No API key needed, returns sample responses

Switch providers by setting the `PROVIDER` environment variable or modifying [`configs/providers.json`](configs/providers.json).

### Provider Configuration

Default settings are in [`configs/providers.json`](configs/providers.json):

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

## 📜 Available Scripts

### Main Application Scripts

```bash
npm start                     # Start interactive mode (node app.js)
npm run dev                   # Start in development mode
npm run generate             # Generate content using templates
npm run health               # Check system health
npm run validate             # Validate templates and configuration
npm test                     # Run health check + validation
```

### Content Generation Scripts

```bash
# Task-specific content generation
npm run scaffold             # Brief → Scaffold (JSON structure)
npm run expand               # Section → Expanded prose
npm run rewrite              # Rewrite/localize content
npm run summarize            # Summarize with citations
npm run repurpose            # Repurpose to multiple channels
```

### Evaluation Scripts

```bash
npm run eval                 # Run basic evaluation
npm run eval:scaffold        # Evaluate scaffolding operation
npm run eval:expand          # Evaluate expand operation
npm run eval:rewrite         # Evaluate rewrite operation
npm run eval:summarize       # Evaluate summarize operation
npm run eval:repurpose       # Evaluate repurpose operation
npm run eval:all             # Run all evaluation operations
```

### Utility Scripts

```bash
npm run setup                # Copy .env template and prompt for configuration
npm run clean                # Remove temporary files and logs
npm run lint                 # Check content style compliance (offline)
npm run lint:content         # Explicit content style linting
```

### Style Linting

SPOT includes an offline style linter that validates content against your style pack rules:

```bash
# Lint a specific content file
npm run lint my_content/article.txt

# The linter checks:
# ✅ Reading level (Flesch-Kincaid grade)
# ✅ Banned terms (must_avoid list)
# ✅ Required terms (must_use list)
# ✅ Reading level compliance

# Example output:
# Style Lint Report for: article.txt
# Reading Level: 8.2 (Target: Grade 8-10)
# Reading Level OK: ✅
# ✅ No banned terms found
# ✅ All required terms present
```

## 📝 Usage Examples

### Using npm Scripts

```bash
# Setup and validate
npm run setup
npm test

# Generate content interactively
npm start

# Task-specific generation with parameters
npm run scaffold -- --asset_type "landing page" --topic "Privacy-first analytics" --audience "startup founders" --tone "confident" --word_count 600

npm run expand -- --section_json '{"heading":"Why Privacy Matters","bullets":["Build trust","Comply with regulations"]}'

npm run rewrite -- --text "Original content..." --audience "CFOs" --tone "formal" --grade_level 9 --words 140 --locale "en-GB"

npm run summarize -- --file golden_set/transcripts/build-ai-applications-1.txt --mode executive

npm run repurpose -- --file golden_set/repurposing/example_article.md
```

### Direct CLI Usage

```bash
# Interactive mode
node app.js

# Direct commands
node app.js health
node app.js generate repurpose_pack@1.0.0 input.json output.json
node app.js evaluate

# Task-specific CLI
node src/cli.js scaffold --asset_type "blog post" --topic "AI applications"
node src/cli.js expand --section_json '{"heading":"Title","bullets":["Point 1"]}'
```

## 🧪 Evaluation

The evaluation system allows you to test and benchmark your prompts and AI provider performance across different scenarios.

### Running Evaluations with npm Scripts

```bash
# Run all evaluation operations
npm run eval:all

# Run specific operation evaluations
npm run eval:scaffold        # Test brief → scaffold generation
npm run eval:expand          # Test section expansion
npm run eval:rewrite         # Test content rewriting
npm run eval:summarize       # Test transcript summarization
npm run eval:repurpose       # Test content repurposing

# Basic evaluation
npm run eval
```

### Running Evaluations Directly

```bash
# Evaluate all brief files (default)
node src/eval/runEvaluations.js

# Evaluate specific files
node src/eval/runEvaluations.js brief1.json brief2.json

# Evaluate specific directory and operation
node src/eval/runEvaluations.js --directory golden_set/briefs --operation scaffold

# Get help
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

The evaluation system uses a comprehensive test suite in the [`golden_set/`](golden_set/) directory organized by test purpose:

**Core Test Categories:**

- [`golden_set/briefs/`](golden_set/briefs/) - Sample input briefs for testing scaffold generation (includes easy, medium, hard, and extreme complexity levels)
- [`golden_set/transcripts/`](golden_set/transcripts/) - Sample transcripts for summarization testing
- [`golden_set/repurposing/`](golden_set/repurposing/) - Sample content for repurposing evaluation

**Quality Assurance Categories:**

- [`golden_set/edge_cases/`](golden_set/edge_cases/) - Boundary conditions and unusual inputs (empty fields, special characters, extreme complexity)
- [`golden_set/style_compliance/`](golden_set/style_compliance/) - Content designed to test style pack rule adherence (must_use/must_avoid terms, terminology)
- [`golden_set/performance/`](golden_set/performance/) - Large files and stress test scenarios
- [`golden_set/provider_comparison/`](golden_set/provider_comparison/) - Standardized tests for comparing AI provider outputs
- [`golden_set/domain_specific/`](golden_set/domain_specific/) - Specialized content requiring domain expertise (technical, legal, medical)
- [`golden_set/expected_outputs/`](golden_set/expected_outputs/) - Reference outputs for validation and regression testing

**File Naming Convention:**
Files follow the pattern: `{type}_{difficulty}_{description}.{ext}`

- `brief_easy_react_tutorial.json` - Simple tutorial brief
- `transcript_hard_technical_meeting.txt` - Complex technical meeting transcript
- `article_medium_remote_teams.md` - Medium complexity repurposing content

### Comparing Providers

You can compare different AI providers by switching the `PROVIDER` environment variable and running the same evaluation:

```bash
# Test with OpenAI
PROVIDER=openai npm run eval:all

# Test with Claude
PROVIDER=anthropic npm run eval:all

# Test with mock provider (no API costs)
PROVIDER=mock npm run eval:all
```

## 🌍 Environment Variables

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

# System settings
NODE_ENV=development               # development/production
LOG_LEVEL=info                    # debug/info/warn/error
LOG_FORMAT=json                   # json/text

# Performance tuning
CIRCUIT_BREAKER_THRESHOLD=5
HEALTH_CHECK_INTERVAL=60000
METRICS_ENABLED=true
```

## 📁 Project Structure

```
spot-toolkit/
├── app.js                    # Main CLI application
├── src/
│   ├── SPOT.js               # Core orchestrator
│   ├── cli.js               # Task-specific CLI
│   ├── providers/           # AI provider implementations
│   ├── utils/               # Production utilities
│   └── eval/                # Evaluation system
├── prompts/                 # Versioned JSON templates
├── golden_set/              # Test data and evaluation
├── configs/                 # Configuration files
├── style/                   # Style governance
├── docs/                    # Additional documentation
└── scripts/                 # Automation scripts
```

## 🔧 Troubleshooting

### Common Issues

**1. "Provider not found" error:**

```bash
# Check your .env file has the correct PROVIDER value
echo $PROVIDER
# Should be one of: openai, anthropic, gemini, mock
```

**2. "API key not found" error:**

```bash
# Ensure you've set the appropriate API key
echo $OPENAI_API_KEY  # or $ANTHROPIC_API_KEY, $GEMINI_API_KEY
```

**3. "Template not found" error:**

```bash
# Validate all templates
npm run validate
```

**4. npm script parameters:**

```bash
# Use -- to pass parameters to npm run scripts
npm run scaffold -- --asset_type "blog post" --topic "AI"
# Not: npm run scaffold --asset_type "blog post" --topic "AI"
```

### Getting Help

- Run `npm start` for interactive mode (recommended for beginners)
- Run `npm run validate` to check templates and configuration
- Run `npm run health` to verify system status
- Check the [docs/](docs/) directory for detailed guides
- Review the [golden_set/README.md](golden_set/README.md) for evaluation help

## 🚀 Notes

- **Minimal dependencies** - Only uses `dotenv` for environment variable loading
- **Provider abstraction** - Easy to add new AI providers or swap between existing ones
- **Graceful fallback** - Automatically falls back to mock provider if API keys are missing
- **Versioned prompts** - Prompts are plain JSON with `{placeholders}` compatible with most prompt-management tools
- **Production ready patterns** - Includes error handling, configuration management, and evaluation framework

## 🛠️ Development

### Adding a New Provider

1. Create `src/providers/newProvider.js` extending the base [`Provider`](src/providers/Provider.js) class
2. Add provider configuration to [`configs/providers.json`](configs/providers.json)
3. Update [`src/utils/providerManager.js`](src/utils/providerManager.js) with the new provider case
4. Add API key handling in the provider factory's `getApiKey()` method

### Contributing

1. Follow the existing code structure and patterns
2. Add appropriate tests in the [`golden_set/`](golden_set/) directory
3. Validate changes with `npm run validate`
4. Run comprehensive evaluation: `npm run eval:all`
5. Test with `npm test` before submitting

## 📄 Copyright

© 2025 Chris Minnick. All rights reserved.

This software and associated documentation files (the "Software") are protected by copyright and other intellectual property laws. The Software is licensed, not sold.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
