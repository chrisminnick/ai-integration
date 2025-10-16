"""
SPOT - Structured Prompt Output Toolkit

A Python implementation of the AI-powered content generation toolkit.
"""

__version__ = "1.0.0"
__author__ = "Chris Minnick"
__email__ = "chris@minnick.com"

from .core.spot import SPOT
from .core.config import Config
from .providers.manager import ProviderManager
from .utils.logger import get_logger

__all__ = ["SPOT", "Config", "ProviderManager", "get_logger"]