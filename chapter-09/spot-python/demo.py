#!/usr/bin/env python3
"""
Demo script showing the Python SPOT toolkit in action
"""

import asyncio
import json
from pathlib import Path

from spot.core.spot import SPOT
from spot.core.config import Config


async def main():
    """Run a quick demonstration of SPOT functionality."""
    
    print("🚀 SPOT Python Toolkit Demo")
    print("=" * 40)
    
    # Initialize SPOT with mock provider for demo
    config = Config(provider="mock", log_level="info")
    spot = SPOT(config)
    
    # 1. Health Check
    print("\n1. Health Check:")
    health = await spot.health_check()
    print(f"   Status: {health['status']}")
    print(f"   Providers available: {len(health['providers'])}")
    
    # 2. Template Validation
    print("\n2. Template Validation:")
    validation_results = await spot.validate_templates()
    valid_count = sum(1 for r in validation_results if r.get('status') == 'valid')
    print(f"   Templates validated: {valid_count}/{len(validation_results)}")
    
    # 3. Content Generation
    print("\n3. Content Generation:")
    input_data = {
        "asset_type": "blog post",
        "topic": "Python SPOT toolkit",
        "audience": "developers",
        "tone": "technical",
        "word_count": "800"
    }
    
    result = await spot.generate(
        template="draft_scaffold@1.0.0",
        input_data=input_data,
        provider="mock"
    )
    
    print(f"   Generated content using {result['provider']} provider")
    print(f"   Model: {result['model']}")
    print(f"   Tokens: {result['usage']['total_tokens']}")
    
    # 4. Evaluation
    print("\n4. Evaluation:")
    eval_result = await spot.evaluate(provider="mock")
    print(f"   Template: {eval_result['template']}")
    print(f"   Score: {eval_result['score']:.1%}")
    
    print("\n✅ Demo completed successfully!")
    print("\nNext steps:")
    print("  - Add real API keys to .env file")
    print("  - Try: python -m spot.cli interactive")
    print("  - Try: python -m spot.cli web")


if __name__ == "__main__":
    asyncio.run(main())