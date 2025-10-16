#!/usr/bin/env python3
"""
Simple style linter test - minimal dependencies
"""

import sys
import json
from pathlib import Path

# Add the spot package to the path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Import only the linting functions directly
from spot.utils.style_linter import load_style_pack, lint_style, format_style_report


def main():
    """Main linting function."""
    if len(sys.argv) != 2:
        print("Usage: python test_lint.py <file-path>")
        sys.exit(1)
    
    file_path = Path(sys.argv[1])
    
    if not file_path.exists():
        print(f"Error: File not found: {file_path}")
        sys.exit(1)
    
    try:
        # Load style pack
        style_pack = load_style_pack()
        
        # Read content
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Run style analysis
        result = lint_style(content, style_pack)
        
        # Display formatted report
        report_text = format_style_report(result, style_pack, file_path.name)
        print(report_text)
        
        # Display JSON report
        print("\nFull Report (JSON):")
        print(json.dumps(result, indent=2))
        
        # Exit with appropriate code
        violations = len(result.get("banned", [])) + len(result.get("missing_required", []))
        reading_level_ok = result.get("reading_level_ok", True)
        
        if violations > 0 or not reading_level_ok:
            sys.exit(1)
        
    except Exception as error:
        print(f"Error: {error}")
        sys.exit(1)


if __name__ == "__main__":
    main()