# Golden Set - Evaluation Test Data

This directory contains carefully curated test data for evaluating the Content Buddy system across different scenarios, content types, and edge cases.

## Directory Structure

### Core Test Sets

- `briefs/` - Input briefs for scaffold generation testing
- `transcripts/` - Sample transcripts and recordings for summarization
- `repurposing/` - Source content for multi-channel repurposing
- `expected_outputs/` - Reference outputs for comparison testing
- `edge_cases/` - Challenging scenarios and boundary conditions

### Evaluation Categories

- `performance/` - Large files for stress testing and performance benchmarks
- `style_compliance/` - Content designed to test style pack adherence
- `multi_language/` - International content and localization tests
- `domain_specific/` - Specialized content (technical, legal, medical, etc.)

### Quality Assurance

- `regression_tests/` - Known good inputs/outputs for preventing regressions
- `provider_comparison/` - Standardized tests for comparing AI providers
- `template_validation/` - Test cases for each prompt template version

## File Naming Convention

Files follow the pattern: `{category}_{difficulty}_{id}.{ext}`

- **category**: brief, transcript, article, etc.
- **difficulty**: easy, medium, hard, extreme
- **id**: unique identifier
- **ext**: json, txt, md

Examples:

- `brief_easy_landing_page.json`
- `transcript_hard_technical_meeting.txt`
- `article_medium_product_launch.md`

## Expected Outputs

For each test input, corresponding expected outputs are stored in `expected_outputs/` with matching filenames and operation suffixes:

- `brief_easy_landing_page_scaffold.json`
- `transcript_hard_technical_meeting_summary.txt`
- `article_medium_product_launch_repurpose.json`

## Test Categories Explained

### Performance Tests

Files designed to test system limits:

- Very long content (10k+ words)
- Complex nested structures
- High-volume batch processing

### Style Compliance Tests

Content that specifically challenges style rules:

- Violations of must-use/must-avoid terms
- Reading level boundary cases
- Tone and voice consistency

### Edge Cases

Unusual scenarios that might break the system:

- Empty or minimal content
- Special characters and formatting
- Corrupted or malformed inputs
- Mixed languages and character sets

## Usage

Run evaluations with specific test sets:

```bash
# Test all briefs
node src/eval/runEvaluations.js -d golden_set/briefs

# Test edge cases for expand operation
node src/eval/runEvaluations.js -d golden_set/edge_cases -o expand

# Test performance with large files
node src/eval/runEvaluations.js -d golden_set/performance -o summarize

# Compare providers on standardized test set
PROVIDER=openai node src/eval/runEvaluations.js -d golden_set/provider_comparison
PROVIDER=anthropic node src/eval/runEvaluations.js -d golden_set/provider_comparison
```

## Contributing Test Cases

When adding new test cases:

1. Follow the naming convention
2. Add corresponding expected outputs
3. Include metadata about the test purpose
4. Document any special requirements or edge cases
5. Test with multiple providers before committing

## Quality Metrics

Each test case should be designed to validate specific quality dimensions:

- **Accuracy**: Factual correctness and information preservation
- **Coherence**: Logical flow and consistency
- **Style**: Adherence to brand voice and style pack rules
- **Completeness**: All required elements present
- **Efficiency**: Token usage and response time
- **Robustness**: Handling of edge cases and errors
