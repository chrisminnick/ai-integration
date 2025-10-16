"""Test configuration for pytest."""

import pytest
import asyncio
from pathlib import Path

from spot.core.config import Config, set_config


@pytest.fixture
def test_config():
    """Create test configuration."""
    config = Config(
        environment="test",
        log_level="debug",
        provider="mock",
        dev_mock_providers=True,
        dev_skip_health_checks=True,
    )
    set_config(config)
    return config


@pytest.fixture
def event_loop():
    """Create event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()