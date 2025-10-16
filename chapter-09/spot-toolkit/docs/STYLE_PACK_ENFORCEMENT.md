# How SPOT Enforces Style Pack Rules: A Developer's Guide

Behind the scenes, SPOT's style pack enforcement operates through a multi-layered system that combines **prompt injection** during generation and **post-generation validation** through automated linting. Here's how the code implements these "behind the scenes" mechanisms that developers can leverage in their own applications.

## The Style Pack Architecture

SPOT's style governance is centralized in `style/stylepack.json`, which defines four key enforcement mechanisms:

**Node.js (spot-toolkit):**

```javascript
{
  "brand_voice": "Confident, friendly, concrete; no hype.",
  "reading_level": "Grade 8-10",
  "must_use": ["accessible", "inclusive", "people with disabilities"],
  "must_avoid": ["revolutionary", "disruptive", "AI magic", "guys"]
}
```

**Python (spot-python):**

```python
{
  "brand_voice": "Confident, friendly, concrete; no hype.",
  "reading_level": "Grade 8-10",
  "must_use": ["accessible", "inclusive", "people with disabilities"],
  "must_avoid": ["revolutionary", "disruptive", "AI magic", "guys"]
}
```

## 1. Prompt-Time Injection (Generation Phase)

During content generation, SPOT automatically injects style constraints directly into the AI prompts.

**Node.js Implementation:**

```javascript
// From src/SPOT.js - executeGeneration method
const stylePack = await loadStylePack();
const compiledPrompt = compilePrompt(templateConfig, inputData, stylePack);

// The compiled prompt includes style instructions
if (compiledPrompt.stylePack && compiledPrompt.stylePack.brand_voice) {
  promptText += `\n\nBrand voice: ${compiledPrompt.stylePack.brand_voice}`;
}
if (compiledPrompt.stylePack && compiledPrompt.stylePack.reading_level) {
  promptText += `\nTarget reading level: ${compiledPrompt.stylePack.reading_level}`;
}
```

**Python Implementation:**

```python
# From spot/core/spot.py - TemplateManager.render_template method
async def render_template(self, template: Dict[str, Any], variables: Dict[str, Any]) -> str:
    """Render template with variables."""
    # Get the prompt content - handle both old and new formats
    if "prompt" in template:
        prompt = template["prompt"]
    elif "user" in template:
        # For SPOT templates, combine system and user prompts
        system_prompt = template.get("system", "")
        user_prompt = template["user"]
        if system_prompt:
            prompt = f"{system_prompt}\n\n{user_prompt}"
        else:
            prompt = user_prompt

    # Simple variable substitution including style pack rules
    for key, value in variables.items():
        placeholder = f"{{{key}}}"
        prompt = prompt.replace(placeholder, str(value))

    return prompt
```

Templates explicitly accept style parameters:

**Node.js Template:**

```json
{
  "inputs": ["section_json", "style_pack_rules", "must_use", "must_avoid"],
  "user": "Input JSON: {section_json}\nHouse style rules: {style_pack_rules}\nRequired terms: {must_use}; Banned terms: {must_avoid}"
}
```

**Python Template:**

```json
{
  "inputs": ["section_json", "style_pack_rules", "must_use", "must_avoid"],
  "user": "Input JSON: {section_json}\nHouse style rules: {style_pack_rules}\nRequired terms: {must_use}; Banned terms: {must_avoid}"
}
```

This approach **prevents** style violations at the source rather than just catching them afterward.

## 2. Post-Generation Validation (Linting Phase)

**Node.js Implementation:**

```javascript
// From src/lint/styleLinter.js
export function lintStyle(text, stylePack) {
  const report = {
    banned: [],
    missingRequired: [],
    readingLevelOk: true,
    readingLevel: null,
  };

  // Banned Terms Detection
  const banned = stylePack.must_avoid || [];
  const lower = text.toLowerCase();
  for (const b of banned) {
    if (lower.includes(b.toLowerCase())) report.banned.push(b);
  }

  // Required Terms Validation
  const required = stylePack.must_use || [];
  for (const r of required) {
    if (!lower.includes(r.toLowerCase())) report.missingRequired.push(r);
  }

  // Reading Level Calculation
  report.readingLevel = fleschKincaidGrade(text);
  const [minLvl, maxLvl] = parseReadingBand(
    stylePack.reading_level || 'Grade 8-10'
  );
  report.readingLevelOk =
    report.readingLevel >= minLvl && report.readingLevel <= maxLvl;

  return report;
}

// Flesch-Kincaid Grade approximation
export function fleschKincaidGrade(text) {
  const sentences = Math.max(1, (text.match(/[.!?]+/g) || []).length);
  const words = Math.max(1, (text.match(/\b\w+\b/g) || []).length);
  const syllables = countSyllables(text);
  const grade = 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59;
  return Math.max(0, Math.round(grade * 10) / 10);
}
```

**Python Implementation:**

```python
# Equivalent Python implementation (would be in spot/utils/style_linter.py)
import re
from typing import Dict, List, Any

def lint_style(text: str, style_pack: Dict[str, Any]) -> Dict[str, Any]:
    """Lint text against style pack rules."""
    report = {
        "banned": [],
        "missing_required": [],
        "reading_level_ok": True,
        "reading_level": None,
    }

    # Banned Terms Detection
    banned = style_pack.get("must_avoid", [])
    lower_text = text.lower()
    for term in banned:
        if term.lower() in lower_text:
            report["banned"].append(term)

    # Required Terms Validation
    required = style_pack.get("must_use", [])
    for term in required:
        if term.lower() not in lower_text:
            report["missing_required"].append(term)

    # Reading Level Calculation
    report["reading_level"] = flesch_kincaid_grade(text)
    min_level, max_level = parse_reading_band(style_pack.get("reading_level", "Grade 8-10"))
    report["reading_level_ok"] = min_level <= report["reading_level"] <= max_level

    return report

def flesch_kincaid_grade(text: str) -> float:
    """Calculate Flesch-Kincaid Grade Level."""
    sentences = max(1, len(re.findall(r'[.!?]+', text)))
    words = max(1, len(re.findall(r'\b\w+\b', text)))
    syllables = count_syllables(text)

    grade = 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59
    return max(0.0, round(grade, 1))

def count_syllables(text: str) -> int:
    """Naive syllable counting algorithm."""
    words = re.findall(r'[a-z]+', text.lower())
    count = 0

    for word in words:
        # Remove common silent endings
        syllable_word = re.sub(r'(?:[^laeiouy]es|ed|[^laeiouy]e)$', '', word)
        syllable_word = re.sub(r'^y', '', syllable_word)

        # Count vowel groups
        vowel_matches = re.findall(r'[aeiouy]{1,2}', syllable_word)
        count += len(vowel_matches) if vowel_matches else 1

    return count

def parse_reading_band(band: str) -> tuple[int, int]:
    """Parse reading level band like 'Grade 8-10'."""
    match = re.search(r'(\d+)[^\d]+(\d+)', band)
    if not match:
        return (0, 20)
    return (int(match.group(1)), int(match.group(2)))
```

## 3. API-Based Real-Time Checking

**Node.js API Implementation:**

```javascript
// From src/api/server.js
async handleStyleCheck(req, res) {
  const { content } = req.body;
  const stylePack = JSON.parse(await fs.readFile('style/stylepack.json', 'utf8'));

  const violations = [];
  const mustAvoid = stylePack.must_avoid || [];

  for (const term of mustAvoid) {
    if (content.toLowerCase().includes(term.toLowerCase())) {
      violations.push({
        type: 'must_avoid',
        term,
        message: `Content contains prohibited term: "${term}"`
      });
    }
  }

  res.json({
    violations,
    compliant: violations.length === 0,
    stylepack: stylePack
  });
}
```

**Python API Implementation:**

```python
# From spot/web/app.py (enhanced version)
from pydantic import BaseModel
from typing import List, Dict, Any

class StyleCheckRequest(BaseModel):
    content: str

class StyleViolation(BaseModel):
    type: str
    term: str
    message: str

class StyleCheckResponse(BaseModel):
    violations: List[StyleViolation]
    compliant: bool
    stylepack: Dict[str, Any]

@app.post("/style/check", response_model=StyleCheckResponse)
async def check_style(request: StyleCheckRequest):
    """Check content against style rules."""
    try:
        # Load style pack
        style_pack_path = Path(__file__).parent.parent.parent / "style" / "stylepack.json"
        with open(style_pack_path, 'r', encoding='utf-8') as f:
            style_pack = json.load(f)

        violations = []
        must_avoid = style_pack.get("must_avoid", [])

        for term in must_avoid:
            if term.lower() in request.content.lower():
                violations.append(StyleViolation(
                    type="must_avoid",
                    term=term,
                    message=f'Content contains prohibited term: "{term}"'
                ))

        return StyleCheckResponse(
            violations=violations,
            compliant=len(violations) == 0,
            stylepack=style_pack
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

## 4. Evaluation and Testing Integration

**Node.js Evaluation:**

```javascript
// From src/eval/runEvaluations.js
const result = await provider.generateText(promptText);
const styleReport = lintStyle(result, stylePack);

return {
  content: result,
  styleViolations: styleReport.banned.length,
  readingLevelCompliant: styleReport.readingLevelOk,
  metadata: { template, provider, timestamp },
};
```

**Python Evaluation:**

```python
# From spot/core/spot.py (EvaluationManager)
async def run_evaluation(self, template_name: str, provider_name: str) -> Dict[str, Any]:
    """Run evaluation for a template and provider."""
    # Generate content using the template
    result = await self.provider_manager.generate(
        prompt=rendered_prompt,
        provider_name=provider_name
    )

    # Apply style checking
    style_report = lint_style(result["content"], style_pack)

    return {
        "template": template_name,
        "provider": provider_name,
        "score": calculate_score(style_report),
        "metrics": {
            "latency": result.get("latency", 0),
            "style_violations": len(style_report["banned"]),
            "reading_level_compliant": style_report["reading_level_ok"],
            "style_compliance": 1.0 - (len(style_report["banned"]) / 1000)  # violations per 1000 words
        }
    }
```

## Implementation Patterns for Your Own Apps

**1. Dual Enforcement Strategy:** Like SPOT, implement both prompt-time constraints (prevention) and post-generation validation (verification).

**2. Configurable Rule Engine:** Store style rules in JSON configuration files that can be loaded dynamically rather than hard-coding them.

**3. Algorithmic Validation:** Use mathematical approaches (like Flesch-Kincaid) for objective metrics rather than relying solely on AI judgment.

**4. Violation Reporting:** Return structured violation objects that include the specific term, violation type, and suggested remediation.

**5. Template Integration:** Design your prompt templates to explicitly accept style parameters as inputs, enabling consistent application across different content types.

This architecture enables SPOT to maintain brand consistency across all generated content while providing developers with granular control over style enforcement mechanisms in both JavaScript and Python environments.

## Key Takeaways

- **Prevention over Correction**: Inject style constraints into prompts to prevent violations rather than just detecting them afterward
- **Multi-Layer Validation**: Use both AI-guided generation and algorithmic post-processing for comprehensive coverage
- **Language Agnostic**: The same architectural patterns work effectively in both JavaScript and Python implementations
- **Measurable Quality**: Implement quantifiable metrics (reading level, violation counts) for consistent evaluation
- **Developer Experience**: Provide clear APIs and structured responses that developers can easily integrate into their applications

This technical implementation guide demonstrates how SPOT's "behind the scenes" style enforcement can be understood, extended, and adapted for other AI content generation systems.
