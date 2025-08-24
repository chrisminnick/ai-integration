#!/bin/bash

# Comprehensive Golden Set Evaluation Script
# This script runs evaluations across all test categories and generates detailed reports

set -e

echo "🚀 Starting Comprehensive Golden Set Evaluation"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
PROVIDER=${PROVIDER:-"openai"}
OUTPUT_DIR="evaluation_results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Create output directory
mkdir -p "${OUTPUT_DIR}/${TIMESTAMP}"

echo -e "${BLUE}Provider: ${PROVIDER}${NC}"
echo -e "${BLUE}Results will be saved to: ${OUTPUT_DIR}/${TIMESTAMP}${NC}"
echo ""

# Function to run evaluation and save results
run_evaluation() {
    local test_category="$1"
    local operation="$2"
    local description="$3"
    
    echo -e "${YELLOW}Running $description...${NC}"
    
    local output_file="${OUTPUT_DIR}/${TIMESTAMP}/${test_category}_${operation}.json"
    
    if node src/eval/runEvaluations.js -d "golden_set/${test_category}" -o "$operation" > "$output_file" 2>&1; then
        echo -e "${GREEN}✓ $description completed${NC}"
        
        # Extract key metrics
        local success_count=$(cat "$output_file" | jq -r '.successful // 0')
        local failed_count=$(cat "$output_file" | jq -r '.failed // 0')
        local p50_latency=$(cat "$output_file" | jq -r '.latency.p50 // 0')
        local p95_latency=$(cat "$output_file" | jq -r '.latency.p95 // 0')
        
        echo -e "  Success: $success_count, Failed: $failed_count"
        echo -e "  Latency P50: ${p50_latency}ms, P95: ${p95_latency}ms"
    else
        echo -e "${RED}✗ $description failed${NC}"
        echo "  Check $output_file for details"
    fi
    echo ""
}

# Basic functionality tests
echo -e "${BLUE}=== BASIC FUNCTIONALITY TESTS ===${NC}"
run_evaluation "briefs" "scaffold" "Basic Brief Scaffolding"
run_evaluation "transcripts" "summarize" "Transcript Summarization"
run_evaluation "repurposing" "repurpose" "Content Repurposing"

# Style compliance tests
echo -e "${BLUE}=== STYLE COMPLIANCE TESTS ===${NC}"
run_evaluation "style_compliance" "scaffold" "Style Compliance Check"

# Edge case tests
echo -e "${BLUE}=== EDGE CASE TESTS ===${NC}"
run_evaluation "edge_cases" "scaffold" "Edge Case Handling"

# Performance tests
echo -e "${BLUE}=== PERFORMANCE TESTS ===${NC}"
run_evaluation "performance" "summarize" "Performance - Large Content Summarization"
run_evaluation "performance" "repurpose" "Performance - Large Content Repurposing"

# Domain-specific tests
echo -e "${BLUE}=== DOMAIN-SPECIFIC TESTS ===${NC}"
run_evaluation "domain_specific" "scaffold" "Domain-Specific Content Generation"

# Provider comparison (if multiple providers configured)
echo -e "${BLUE}=== PROVIDER COMPARISON ===${NC}"
run_evaluation "provider_comparison" "scaffold" "Provider Comparison - Scaffolding"

# Generate summary report
echo -e "${BLUE}=== GENERATING SUMMARY REPORT ===${NC}"

summary_file="${OUTPUT_DIR}/${TIMESTAMP}/evaluation_summary.json"

# Combine all results into a summary
{
    echo "{"
    echo "  \"timestamp\": \"$TIMESTAMP\","
    echo "  \"provider\": \"$PROVIDER\","
    echo "  \"test_categories\": ["
    
    first=true
    for file in "${OUTPUT_DIR}/${TIMESTAMP}"/*.json; do
        if [[ "$file" != *"evaluation_summary.json" ]]; then
            if [ "$first" = false ]; then
                echo ","
            fi
            echo -n "    "
            cat "$file"
            first=false
        fi
    done
    
    echo ""
    echo "  ]"
    echo "}"
} > "$summary_file"

echo -e "${GREEN}✓ Summary report generated: $summary_file${NC}"

# Generate human-readable report
report_file="${OUTPUT_DIR}/${TIMESTAMP}/evaluation_report.md"

{
    echo "# Golden Set Evaluation Report"
    echo ""
    echo "**Provider:** $PROVIDER  "
    echo "**Timestamp:** $TIMESTAMP  "
    echo ""
    
    echo "## Test Results Summary"
    echo ""
    echo "| Test Category | Operation | Success | Failed | P50 Latency | P95 Latency |"
    echo "|---------------|-----------|---------|--------|-------------|-------------|"
    
    for file in "${OUTPUT_DIR}/${TIMESTAMP}"/*.json; do
        if [[ "$file" != *"evaluation_summary.json" ]] && [[ "$file" != *"evaluation_report.md" ]]; then
            local category=$(basename "$file" .json | cut -d'_' -f1)
            local operation=$(basename "$file" .json | cut -d'_' -f2)
            local successful=$(cat "$file" | jq -r '.successful // "N/A"')
            local failed=$(cat "$file" | jq -r '.failed // "N/A"')
            local p50=$(cat "$file" | jq -r '.latency.p50 // "N/A"')
            local p95=$(cat "$file" | jq -r '.latency.p95 // "N/A"')
            
            echo "| $category | $operation | $successful | $failed | ${p50}ms | ${p95}ms |"
        fi
    done
    
    echo ""
    echo "## Detailed Results"
    echo ""
    echo "Detailed JSON results are available in the following files:"
    echo ""
    
    for file in "${OUTPUT_DIR}/${TIMESTAMP}"/*.json; do
        if [[ "$file" != *"evaluation_summary.json" ]]; then
            echo "- $(basename "$file")"
        fi
    done
    
} > "$report_file"

echo -e "${GREEN}✓ Human-readable report generated: $report_file${NC}"

echo ""
echo -e "${GREEN}🎉 Comprehensive evaluation completed!${NC}"
echo -e "${BLUE}Results saved to: ${OUTPUT_DIR}/${TIMESTAMP}${NC}"
echo ""
echo "Next steps:"
echo "1. Review the summary report: $report_file"
echo "2. Check individual test results for detailed metrics"
echo "3. Compare results across different providers"
echo "4. Identify areas for improvement in prompts or style packs"
