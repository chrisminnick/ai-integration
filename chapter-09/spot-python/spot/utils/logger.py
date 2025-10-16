"""Logging utilities for SPOT."""

import logging
import sys
from pathlib import Path
from typing import Optional

import structlog
from structlog.contextvars import clear_contextvars
from structlog.dev import ConsoleRenderer
from structlog.processors import TimeStamper, add_log_level, JSONRenderer


def configure_logging(
    log_level: str = "info",
    log_format: str = "json",
    log_outputs: list = None,
    log_file: Optional[str] = None,
) -> None:
    """Configure structured logging for the application."""
    if log_outputs is None:
        log_outputs = ["console"]
    
    # Configure standard library logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, log_level.upper()),
    )
    
    # Processors for structlog
    processors = [
        add_log_level,
        TimeStamper(fmt="ISO"),
    ]
    
    # Choose renderer based on format
    if log_format.lower() == "json":
        processors.append(JSONRenderer())
    else:
        processors.append(ConsoleRenderer())
    
    # Configure structlog
    structlog.configure(
        processors=processors,
        wrapper_class=structlog.stdlib.BoundLogger,
        logger_factory=structlog.stdlib.LoggerFactory(),
        context_class=dict,
        cache_logger_on_first_use=True,
    )
    
    # Set up file logging if specified
    if "file" in log_outputs and log_file:
        log_path = Path(log_file)
        log_path.parent.mkdir(parents=True, exist_ok=True)
        
        file_handler = logging.FileHandler(log_path)
        file_handler.setLevel(getattr(logging, log_level.upper()))
        
        # Add file handler to root logger
        root_logger = logging.getLogger()
        root_logger.addHandler(file_handler)


def get_logger(name: str = None) -> structlog.BoundLogger:
    """Get a structured logger instance."""
    return structlog.get_logger(name)


class Logger:
    """Logger wrapper for backward compatibility."""
    
    def __init__(self, name: str = None):
        self.logger = get_logger(name)
    
    def info(self, message: str, **kwargs):
        """Log info message."""
        self.logger.info(message, **kwargs)
    
    def error(self, message: str, **kwargs):
        """Log error message."""
        self.logger.error(message, **kwargs)
    
    def warning(self, message: str, **kwargs):
        """Log warning message."""
        self.logger.warning(message, **kwargs)
    
    def debug(self, message: str, **kwargs):
        """Log debug message."""
        self.logger.debug(message, **kwargs)
    
    def clear_context(self):
        """Clear logging context."""
        clear_contextvars()