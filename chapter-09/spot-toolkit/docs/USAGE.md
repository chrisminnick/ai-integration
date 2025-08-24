# Using SPOT

A comprehensive guide to using SPOT for AI-powered content generation.

## Quick Start

```bash
# 1. Setup environment
npm run setup                    # Creates .env from template
# Edit .env to set PROVIDER and API keys

# 2. Verify installation
npm test                         # Runs health check + validation
# Or run individually:
npm run health                   # Check system status
npm run validate                 # Validate templates and configs

# 3. Start generating content
npm start                        # Interactive mode (recommended)
```

## Interactive Mode (Recommended)

The easiest way to get started is with the interactive CLI:

```bash
npm start
```

This launches a menu-driven interface with options for:

1. **Health Check** - Verify system status and provider connectivity
2. **Generate Content** - Use templates to create content from input files
3. **Scaffold Content** - Create structured content outlines interactively
4. **Run Evaluations** - Test system performance across the golden set
5. **Validate Templates** - Check template integrity and configuration
6. **Help** - Detailed usage information

## Content Generation Methods

### Method 1: Template-Based Generation (app.js)

Generate content using versioned JSON templates:

```bash
# Generate using templates and input files
npm run generate draft_scaffold@1.0.0 golden_set/briefs/brief_easy_react_tutorial.json output.json

# Or use the interactive CLI
node app.js generate
# Then select template and input file from the menu

# Available templates:
# - draft_scaffold@1.0.0    - Brief → Content scaffold
# - repurpose_pack@1.0.0    - Content → Multi-channel repurposing
# - summarize_pack@1.0.0    - Transcript → Executive summary
```

### Method 2: Task-Specific CLI (src/cli.js)

Generate content using command-line parameters:

```bash
# Brief → Scaffold (JSON structure)
npm run scaffold -- --asset_type "landing page" --topic "Privacy-first analytics" --audience "startup founders" --tone "confident" --word_count 600

# Section → Expanded prose
npm run expand -- --section_json '{"heading":"Why Privacy Matters","bullets":["Build user trust","Comply with GDPR","Reduce liability"],"context":"Landing page for privacy-focused analytics tool"}'

# Content rewriting/localization
npm run rewrite -- --text "Original content here..." --audience "CFOs" --tone "formal" --grade_level 9 --words 140 --locale "en-GB"

# Transcript → Summary with citations
npm run summarize -- --file golden_set/transcripts/build-ai-applications-1.txt --mode executive

# Content → Multi-channel repurposing
npm run repurpose -- --file golden_set/repurposing/article_medium_remote_teams.md
```

## Working with Different Providers

SPOT supports multiple AI providers with easy switching:

```bash
# Use OpenAI (default)
PROVIDER=openai npm start

# Use Anthropic Claude
PROVIDER=anthropic npm start

# Use Google Gemini
PROVIDER=gemini npm start

# Use mock provider (no API costs, for testing)
PROVIDER=mock npm start
```

### Provider Setup

Set your provider and API keys in `.env`:

```bash
# Provider selection (choose one)
PROVIDER=openai                    # or anthropic, gemini, mock

# API Keys (set for your chosen provider)
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GEMINI_API_KEY=your_gemini_key

# Optional: Override default models
OPENAI_MODEL=gpt-4-turbo
ANTHROPIC_MODEL=claude-3-sonnet-20240229
GEMINI_MODEL=gemini-1.5-pro
```

## File Types and Structure

### Input Files

SPOT works with several file types:

**Brief Files (JSON):**

```json
{
  "asset_type": "landing page",
  "topic": "Privacy-first analytics",
  "audience": "startup founders",
  "tone": "confident",
  "word_count": 600,
  "must_include": ["GDPR compliance", "user trust"],
  "must_avoid": ["complex jargon", "lengthy explanations"]
}
```

**Transcript Files (TXT):**

```
Speaker 1: Welcome to today's discussion on building AI applications...
Speaker 2: Thanks for having me. Let's start with the fundamentals...
[Timestamp: 00:02:15]
Speaker 1: Can you elaborate on the data pipeline architecture?
```

**Article Files (Markdown):**

```markdown
# The Future of Remote Teams

Remote work has fundamentally changed how we collaborate...

## Key Benefits

- Increased flexibility
- Access to global talent
- Reduced overhead costs
```

### Output Files

Generated content can be saved to various formats:

```bash
# JSON output (structured data)
npm run scaffold -- --output scaffold.json --asset_type "blog post"

# Text output (prose content)
npm run expand -- --output expanded.txt --section_json '{"heading":"Introduction"}'

# Markdown output (formatted content)
npm run repurpose -- --file input.md --output repurposed.md
```

## Evaluation and Testing

### Running Evaluations

Test your prompts and provider performance across different scenarios:

```bash
# Run all evaluations
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

### Custom Evaluations

Run evaluations on specific files or directories:

```bash
# Evaluate specific files
node src/eval/runEvaluations.js brief1.json brief2.json

# Evaluate specific directory and operation
node src/eval/runEvaluations.js --directory golden_set/briefs --operation scaffold

# Evaluate edge cases
node src/eval/runEvaluations.js --directory golden_set/edge_cases --operation scaffold

# Get help with evaluation options
node src/eval/runEvaluations.js --help
```

### Understanding Evaluation Results

Evaluations measure several key metrics:

```json
{
  "operation": "scaffold",
  "provider": "openai",
  "count": 5,
  "latency": {
    "p50": 125,
    "p95": 180,
    "average": 142
  },
  "style": {
    "averageViolationsPer1000Words": 0.2,
    "readingLevelCompliance": 100,
    "mustUseTermsFound": 95,
    "mustAvoidTermsFound": 0
  },
  "samples": [
    {
      "brief": "brief_easy_react_tutorial.json",
      "latencyMs": 125,
      "tokens": 450,
      "style": {
        "violations": 0,
        "readingLevel": "appropriate",
        "mustUse": ["React", "tutorial"],
        "mustAvoid": []
      }
    }
  ]
}
```

## Advanced Usage

### Style Linting (Offline)

SPOT includes a standalone style linter that validates content against your style pack rules without making API calls:

```bash
# Lint a specific content file
npm run lint my_content/article.txt
npm run lint golden_set/repurposing/article_easy_api_security.md

# The linter performs offline checks for:
# • Reading level (Flesch-Kincaid grade calculation)
# • Banned terms from style pack must_avoid list
# • Required terms from style pack must_use list
# • Reading level compliance against target range

# Example output:
Style Lint Report for: article.txt
==================================================
Reading Level: 8.2 (Target: Grade 8-10)
Reading Level OK: ✅

✅ No banned terms found
✅ All required terms present

Full Report (JSON):
{
  "banned": [],
  "missingRequired": [],
  "readingLevelOk": true,
  "readingLevel": 8.2
}
```

**Style Pack Configuration:**

Edit `style/stylepack.json` to customize linting rules:

```json
{
  "brand_voice": "Confident, friendly, concrete; no hype.",
  "reading_level": "Grade 8-10",
  "must_use": ["customer", "solution"],
  "must_avoid": ["revolutionary", "disruptive", "AI magic"],
  "terminology": {
    "user": "customer"
  }
}
```

### Batch Processing

Process multiple files using shell scripting:

```bash
# Process all briefs in a directory
for file in golden_set/briefs/*.json; do
  npm run scaffold -- --file "$file" --output "output/$(basename "$file" .json)_scaffold.json"
done

# Process all transcripts
for file in golden_set/transcripts/*.txt; do
  npm run summarize -- --file "$file" --output "summaries/$(basename "$file" .txt)_summary.md"
done
```

### Custom Templates

Create custom prompt templates in the `prompts/` directory:

```json
{
  "name": "custom_brief_to_outline",
  "version": "1.0.0",
  "description": "Convert brief to detailed content outline",
  "prompt": "Create a detailed content outline based on this brief:\n\nAsset Type: {asset_type}\nTopic: {topic}\nAudience: {audience}\nTone: {tone}\nWord Count: {word_count}\n\nGenerate a structured outline with main sections, subsections, and key points to cover.",
  "parameters": ["asset_type", "topic", "audience", "tone", "word_count"]
}
```

### Environment Configuration

Fine-tune system behavior with environment variables:

```bash
# Logging and debugging
LOG_LEVEL=debug              # debug, info, warn, error
LOG_FORMAT=text              # json, text

# Performance tuning
CIRCUIT_BREAKER_THRESHOLD=5  # Number of failures before circuit opens
HEALTH_CHECK_INTERVAL=60000  # Health check frequency (ms)
METRICS_ENABLED=true         # Enable performance metrics

# Development settings
NODE_ENV=development         # development, production
```

## Common Workflows

### 1. Content Creation Workflow

```bash
# 1. Create initial scaffold from brief
npm run scaffold -- --asset_type "blog post" --topic "AI applications" --output scaffold.json

# 2. Expand key sections
npm run expand -- --section_json '$(cat scaffold.json | jq .sections[0])' --output section1.txt

# 3. Rewrite for specific audience
npm run rewrite -- --file section1.txt --audience "executives" --tone "professional" --output final.txt
```

### 2. Content Repurposing Workflow

```bash
# 1. Start with existing content
npm run repurpose -- --file my_article.md --output repurposed.json

# 2. Extract specific formats from the repurposed content
# (The repurpose command generates multiple formats automatically)

# 3. Further customize for specific channels
npm run rewrite -- --text "$(cat repurposed.json | jq .linkedin)" --locale "en-GB" --output linkedin_uk.txt
```

### 3. Quality Assurance Workflow

```bash
# 1. Validate all templates and configuration
npm run validate

# 2. Run health checks
npm run health

# 3. Test with mock provider (no API costs)
PROVIDER=mock npm run eval:all

# 4. Run full evaluation suite
npm run eval:all

# 5. Compare providers
PROVIDER=openai npm run eval:scaffold
PROVIDER=anthropic npm run eval:scaffold
# Compare results
```

## Troubleshooting

### Common Issues

**1. "No such file or directory" when using npm scripts:**

```bash
# Make sure you're in the project root directory
cd spot-toolkit
npm run scaffold -- --help
```

**2. "Template not found" errors:**

```bash
# Validate templates first
npm run validate
# Check available templates
ls prompts/
```

**3. "Provider not configured" errors:**

```bash
# Check your .env file
cat .env | grep PROVIDER
# Ensure API key is set for your provider
echo $OPENAI_API_KEY  # or your chosen provider
```

**4. Passing parameters to npm scripts:**

```bash
# Correct: Use -- to pass parameters
npm run scaffold -- --asset_type "blog post" --topic "AI"

# Incorrect: Parameters go to npm, not the script
npm run scaffold --asset_type "blog post" --topic "AI"
```

### Getting Help

- **Interactive help:** Run `npm start` and select "Help" from the menu
- **Command help:** Add `--help` to any CLI command
- **System status:** Run `npm run health` to check all systems
- **Template validation:** Run `npm run validate` to check configurations
- **Evaluation help:** Run `node src/eval/runEvaluations.js --help`

### Debug Mode

Enable detailed logging for troubleshooting:

```bash
# Enable debug logging
LOG_LEVEL=debug npm start

# Enable debug for specific commands
LOG_LEVEL=debug npm run scaffold -- --asset_type "blog post"

# Check system health in debug mode
LOG_LEVEL=debug npm run health
```

## Best Practices

1. **Start with Interactive Mode** - Use `npm start` to explore features safely
2. **Validate First** - Always run `npm run validate` after making changes
3. **Test with Mock Provider** - Use `PROVIDER=mock` for testing without API costs
4. **Use Evaluations Regularly** - Run `npm run eval:all` to maintain quality
5. **Version Your Prompts** - Keep versioned backups of working prompt templates
6. **Monitor Performance** - Use evaluation metrics to optimize prompt performance
7. **Organize Your Files** - Keep input files organized in logical directories
8. **Check System Health** - Run `npm run health` before important work sessions

This comprehensive guide should help you make the most of SPOT's capabilities while avoiding common pitfalls.
