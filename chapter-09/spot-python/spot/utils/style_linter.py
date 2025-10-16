"""Style linting and readability checking utilities."""

import re
from pathlib import Path
from typing import Dict, List, Any, Tuple
import json


def lint_style(text: str, style_pack: Dict[str, Any]) -> Dict[str, Any]:
    """Lint text against style pack rules.
    
    Args:
        text: Content to analyze
        style_pack: Style pack configuration with must_use, must_avoid, reading_level
        
    Returns:
        Dictionary with linting results including violations and compliance
    """
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
    """Calculate Flesch-Kincaid Grade Level.
    
    Args:
        text: Text to analyze
        
    Returns:
        Reading level as a float (e.g., 8.2 for 8th grade, 2nd month)
    """
    sentences = max(1, len(re.findall(r'[.!?]+', text)))
    words = max(1, len(re.findall(r'\b\w+\b', text)))
    syllables = count_syllables(text)
    
    grade = 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59
    return max(0.0, round(grade, 1))


def count_syllables(text: str) -> int:
    """Naive syllable counting algorithm.
    
    Args:
        text: Text to count syllables in
        
    Returns:
        Estimated syllable count
    """
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


def parse_reading_band(band: str) -> Tuple[int, int]:
    """Parse reading level band like 'Grade 8-10'.
    
    Args:
        band: Reading level specification (e.g., "Grade 8-10", "Grade 6-8")
        
    Returns:
        Tuple of (min_level, max_level)
    """
    match = re.search(r'(\d+)[^\d]+(\d+)', band)
    if not match:
        return (0, 20)
    return (int(match.group(1)), int(match.group(2)))


def load_style_pack(style_pack_path: Path = None) -> Dict[str, Any]:
    """Load style pack configuration from JSON file.
    
    Args:
        style_pack_path: Path to stylepack.json file. If None, uses default location.
        
    Returns:
        Style pack configuration dictionary
        
    Raises:
        FileNotFoundError: If style pack file doesn't exist
        json.JSONDecodeError: If style pack file is invalid JSON
    """
    if style_pack_path is None:
        # Default to style/stylepack.json relative to this file's parent directory
        current_dir = Path(__file__).parent.parent.parent
        style_pack_path = current_dir / "style" / "stylepack.json"
    
    if not style_pack_path.exists():
        raise FileNotFoundError(f"Style pack not found: {style_pack_path}")
    
    with open(style_pack_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def format_style_report(report: Dict[str, Any], style_pack: Dict[str, Any], file_name: str = None) -> str:
    """Format style linting report for console output.
    
    Args:
        report: Style linting report from lint_style()
        style_pack: Original style pack configuration
        file_name: Optional file name for the report header
        
    Returns:
        Formatted string report
    """
    lines = []
    
    # Header
    if file_name:
        lines.append(f"\nStyle Lint Report for: {file_name}")
    else:
        lines.append("\nStyle Lint Report")
    lines.append("=" * 50)
    
    # Reading level
    reading_level = report.get("reading_level", 0)
    target_level = style_pack.get("reading_level", "Grade 8-10")
    status_icon = "✅" if report.get("reading_level_ok", True) else "❌"
    lines.append(f"Reading Level: {reading_level} (Target: {target_level})")
    lines.append(f"Reading Level OK: {status_icon}")
    
    # Banned terms
    banned = report.get("banned", [])
    if banned:
        lines.append(f"\n❌ Banned terms found: {', '.join(banned)}")
    else:
        lines.append("\n✅ No banned terms found")
    
    # Required terms
    missing_required = report.get("missing_required", [])
    required_terms = style_pack.get("must_use", [])
    if missing_required:
        lines.append(f"❌ Missing required terms: {', '.join(missing_required)}")
    elif required_terms:
        lines.append("✅ All required terms present")
    
    return "\n".join(lines)


def calculate_style_score(report: Dict[str, Any]) -> float:
    """Calculate overall style compliance score.
    
    Args:
        report: Style linting report from lint_style()
        
    Returns:
        Score between 0.0 and 1.0 (higher is better)
    """
    score = 1.0
    
    # Deduct for banned terms (severe penalty)
    banned_count = len(report.get("banned", []))
    score -= banned_count * 0.2  # 20% penalty per banned term
    
    # Deduct for missing required terms (moderate penalty)
    missing_count = len(report.get("missing_required", []))
    score -= missing_count * 0.1  # 10% penalty per missing term
    
    # Deduct for reading level violations (minor penalty)
    if not report.get("reading_level_ok", True):
        score -= 0.1  # 10% penalty for reading level violation
    
    return max(0.0, min(1.0, score))