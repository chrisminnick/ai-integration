# Style Pack Enforcement in SPOT Python

SPOT Python now includes comprehensive style pack enforcement functionality, matching the capabilities described in the [Style Pack Enforcement Developer's Guide](../spot-toolkit/docs/STYLE_PACK_ENFORCEMENT.md).

## Features Implemented

### 1. Style Linting Utilities (`spot/utils/style_linter.py`)

- **`lint_style(text, style_pack)`** - Analyze text against style pack rules
- **`flesch_kincaid_grade(text)`** - Calculate reading level
- **`load_style_pack()`** - Load style pack configuration from JSON
- **`format_style_report()`** - Generate formatted console reports
- **`calculate_style_score()`** - Calculate overall compliance score (0.0-1.0)

### 2. Enhanced Core SPOT Functionality

- **Style pack integration in template rendering** - Automatically inject style constraints into AI prompts
- **Style-aware content generation** - Templates receive style pack variables (`must_use`, `must_avoid`, `style_pack_rules`)
- **Post-generation style checking** - Validate generated content against style rules

### 3. CLI Commands

```bash
# Lint a content file
python -m spot.cli lint content.txt

# Check content against style rules
python -m spot.cli style-check --content "Your text here"
python -m spot.cli style-check --file content.txt

# Display current style pack rules
python -m spot.cli style-rules
```

### 4. Web API Endpoints

- **`POST /style/check`** - Check content against style pack rules
- **`GET /style/rules`** - Get current style pack configuration
- **`POST /style/lint-file`** - Lint a file against style rules

### 5. Makefile Integration

```bash
# Lint a specific file
make lint FILE=my_content/article.txt

# Check content inline
make style-check CONTENT="Text to analyze"

# View style rules
make style-rules
```

## Usage Examples

### Python API Usage

```python
from spot.utils.style_linter import lint_style, load_style_pack

# Load style pack
style_pack = load_style_pack()

# Analyze content
content = "This revolutionary AI will disrupt everything!"
result = lint_style(content, style_pack)

print(f"Banned terms found: {result['banned']}")
print(f"Reading level: {result['reading_level']}")
print(f"Compliant: {len(result['banned']) == 0}")
```

### SPOT Integration

```python
from spot.core.spot import SPOT
import asyncio

async def main():
    spot = SPOT()

    # Check style compliance
    result = await spot.check_style("Your content here")
    print(f"Style compliant: {result['compliant']}")
    print(f"Style score: {result['score']:.2f}")

    # Lint a file
    result = await spot.lint_file("article.txt")
    print(f"Violations: {len(result['violations'])}")

asyncio.run(main())
```

### Web API Usage

```bash
# Check content via API
curl -X POST http://localhost:8000/style/check \
  -H "Content-Type: application/json" \
  -d '{"content": "This accessible solution welcomes everyone."}'

# Get style rules
curl http://localhost:8000/style/rules
```

## Style Pack Configuration

The style pack is configured in `style/stylepack.json`:

```json
{
  "brand_voice": "Confident, friendly, concrete; no hype.",
  "reading_level": "Grade 8-10",
  "must_use": ["accessible", "inclusive", "people with disabilities"],
  "must_avoid": ["revolutionary", "disruptive", "AI magic", "guys"],
  "terminology": {
    "user": "person",
    "customers": "people"
  }
}
```

## Enforcement Mechanisms

### 1. Prompt-Time Injection

Style constraints are automatically added to AI prompts during generation:

```
Brand voice: Confident, friendly, concrete; no hype.
Target reading level: Grade 8-10
Must use these terms: accessible, inclusive
Avoid these terms: revolutionary, disruptive
```

### 2. Post-Generation Validation

Generated content is automatically checked for:

- Banned term usage (`must_avoid`)
- Required term presence (`must_use`)
- Reading level compliance (Flesch-Kincaid)
- Overall style score calculation

### 3. Template Integration

Templates can explicitly request style variables:

```json
{
  "inputs": ["content", "style_pack_rules", "must_use", "must_avoid"],
  "user": "Rewrite content following these rules: {style_pack_rules}\nRequired: {must_use}\nAvoid: {must_avoid}"
}
```

## Testing

Test the functionality with the included test files:

```bash
# Test with problematic content (should fail)
python -c "
import sys
sys.path.insert(0, 'spot/utils')
import style_linter, json
with open('./style/stylepack.json', 'r') as f: style_pack = json.load(f)
with open('test_content.txt', 'r') as f: content = f.read()
result = style_linter.lint_style(content, style_pack)
print(style_linter.format_style_report(result, style_pack, 'test_content.txt'))
"

# Test with good content (should pass)
python -c "
import sys
sys.path.insert(0, 'spot/utils')
import style_linter, json
with open('./style/stylepack.json', 'r') as f: style_pack = json.load(f)
with open('good_content.txt', 'r') as f: content = f.read()
result = style_linter.lint_style(content, style_pack)
print(style_linter.format_style_report(result, style_pack, 'good_content.txt'))
"
```

## Architecture

The implementation follows the same architectural patterns as the Node.js version:

1. **Dual Enforcement Strategy** - Prevention (prompt injection) + verification (post-generation linting)
2. **Configurable Rule Engine** - JSON-based style pack configuration
3. **Algorithmic Validation** - Mathematical reading level calculation
4. **Structured Violation Reporting** - Detailed violation objects with remediation guidance
5. **Template Integration** - Style parameters as template inputs

This ensures consistency between the JavaScript and Python implementations while maintaining the flexibility to extend and customize style enforcement rules.
