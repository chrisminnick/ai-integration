"""Configuration management for SPOT."""

import os
from pathlib import Path
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class ProviderConfig(BaseModel):
    """Configuration for AI providers."""
    
    model: str
    max_tokens: int = 2000
    temperature: float = 0.7
    timeout: float = 30.0
    retry_attempts: int = 3


class CircuitBreakerConfig(BaseModel):
    """Configuration for circuit breaker."""
    
    threshold: int = 5
    timeout: float = 60.0
    reset_timeout: float = 30.0


class HealthCheckConfig(BaseModel):
    """Configuration for health checks."""
    
    interval: float = 60.0
    timeout: float = 5.0


class EvaluationConfig(BaseModel):
    """Configuration for evaluation system."""
    
    timeout: float = 120.0
    max_concurrent: int = 3


class MetricsConfig(BaseModel):
    """Configuration for metrics collection."""
    
    enabled: bool = True
    collection_interval: float = 30.0


class TemplateConfig(BaseModel):
    """Configuration for template management."""
    
    cache_ttl: float = 3600.0
    validation_on_load: bool = True


class WebConfig(BaseModel):
    """Configuration for web server."""
    
    host: str = "0.0.0.0"
    port: int = 8000
    reload: bool = False


class Config(BaseSettings):
    """Main configuration class using Pydantic settings."""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="allow"
    )
    
    # Core settings
    environment: str = Field(default="development", alias="ENVIRONMENT")
    log_level: str = Field(default="info", alias="LOG_LEVEL")
    log_format: str = Field(default="json", alias="LOG_FORMAT")
    log_outputs: str = Field(default="console", alias="LOG_OUTPUTS")
    log_file: Optional[str] = Field(default=None, alias="LOG_FILE")
    
    # AI Provider settings
    provider: str = Field(default="openai", alias="PROVIDER")
    openai_api_key: Optional[str] = Field(default=None, alias="OPENAI_API_KEY")
    anthropic_api_key: Optional[str] = Field(default=None, alias="ANTHROPIC_API_KEY")
    gemini_api_key: Optional[str] = Field(default=None, alias="GEMINI_API_KEY")
    
    # Circuit breaker settings
    circuit_breaker_threshold: int = Field(default=5, alias="CIRCUIT_BREAKER_THRESHOLD")
    circuit_breaker_timeout: float = Field(default=60.0, alias="CIRCUIT_BREAKER_TIMEOUT")
    circuit_breaker_reset_timeout: float = Field(default=30.0, alias="CIRCUIT_BREAKER_RESET_TIMEOUT")
    
    # Health check settings
    health_check_interval: float = Field(default=60.0, alias="HEALTH_CHECK_INTERVAL")
    health_check_timeout: float = Field(default=5.0, alias="HEALTH_CHECK_TIMEOUT")
    
    # Evaluation settings
    eval_timeout: float = Field(default=120.0, alias="EVAL_TIMEOUT")
    eval_max_concurrent: int = Field(default=3, alias="EVAL_MAX_CONCURRENT")
    
    # Metrics settings
    metrics_enabled: bool = Field(default=True, alias="METRICS_ENABLED")
    metrics_collection_interval: float = Field(default=30.0, alias="METRICS_COLLECTION_INTERVAL")
    
    # Template settings
    template_cache_ttl: float = Field(default=3600.0, alias="TEMPLATE_CACHE_TTL")
    template_validation_on_load: bool = Field(default=True, alias="TEMPLATE_VALIDATION_ON_LOAD")
    
    # Web server settings
    web_host: str = Field(default="0.0.0.0", alias="WEB_HOST")
    web_port: int = Field(default=8000, alias="WEB_PORT")
    web_reload: bool = Field(default=False, alias="WEB_RELOAD")
    
    # Development settings
    dev_mock_providers: bool = Field(default=False, alias="DEV_MOCK_PROVIDERS")
    dev_enable_debug_logs: bool = Field(default=False, alias="DEV_ENABLE_DEBUG_LOGS")
    dev_skip_health_checks: bool = Field(default=False, alias="DEV_SKIP_HEALTH_CHECKS")
    
    @property
    def project_root(self) -> Path:
        """Get the project root directory."""
        return Path(__file__).parent.parent.parent
    
    @property
    def templates_dir(self) -> Path:
        """Get the templates directory."""
        return self.project_root / "templates"
    
    @property
    def golden_set_dir(self) -> Path:
        """Get the golden set directory."""
        return self.project_root / "golden_set"
    
    @property
    def configs_dir(self) -> Path:
        """Get the configs directory."""
        return self.project_root / "configs"
    
    @property
    def style_dir(self) -> Path:
        """Get the style directory."""
        return self.project_root / "style"
    
    @property
    def logs_dir(self) -> Path:
        """Get the logs directory."""
        logs_dir = self.project_root / "logs"
        logs_dir.mkdir(exist_ok=True)
        return logs_dir
    
    @property
    def log_outputs_list(self) -> List[str]:
        """Get log outputs as a list."""
        return [output.strip() for output in self.log_outputs.split(",")]
    
    @property
    def circuit_breaker(self) -> CircuitBreakerConfig:
        """Get circuit breaker configuration."""
        return CircuitBreakerConfig(
            threshold=self.circuit_breaker_threshold,
            timeout=self.circuit_breaker_timeout,
            reset_timeout=self.circuit_breaker_reset_timeout,
        )
    
    @property
    def health_check(self) -> HealthCheckConfig:
        """Get health check configuration."""
        return HealthCheckConfig(
            interval=self.health_check_interval,
            timeout=self.health_check_timeout,
        )
    
    @property
    def evaluation(self) -> EvaluationConfig:
        """Get evaluation configuration."""
        return EvaluationConfig(
            timeout=self.eval_timeout,
            max_concurrent=self.eval_max_concurrent,
        )
    
    @property
    def metrics(self) -> MetricsConfig:
        """Get metrics configuration."""
        return MetricsConfig(
            enabled=self.metrics_enabled,
            collection_interval=self.metrics_collection_interval,
        )
    
    @property
    def templates(self) -> TemplateConfig:
        """Get template configuration."""
        return TemplateConfig(
            cache_ttl=self.template_cache_ttl,
            validation_on_load=self.template_validation_on_load,
        )
    
    @property
    def web(self) -> WebConfig:
        """Get web configuration."""
        return WebConfig(
            host=self.web_host,
            port=self.web_port,
            reload=self.web_reload,
        )
    
    def get_provider_config(self, provider_name: str) -> Optional[ProviderConfig]:
        """Get configuration for a specific provider."""
        # This would load from configs/providers.json in a real implementation
        # For now, return default configuration
        default_configs = {
            "openai": ProviderConfig(model="gpt-4"),
            "anthropic": ProviderConfig(model="claude-3-sonnet-20240229"),
            "gemini": ProviderConfig(model="gemini-1.5-pro"),
            "mock": ProviderConfig(model="mock-model"),
        }
        return default_configs.get(provider_name)
    
    def get_api_key(self, provider_name: str) -> Optional[str]:
        """Get API key for a specific provider."""
        key_mapping = {
            "openai": self.openai_api_key,
            "anthropic": self.anthropic_api_key,
            "gemini": self.gemini_api_key,
        }
        return key_mapping.get(provider_name)


# Global configuration instance
_config: Optional[Config] = None


def get_config() -> Config:
    """Get the global configuration instance."""
    global _config
    if _config is None:
        _config = Config()
    return _config


def set_config(config: Config) -> None:
    """Set the global configuration instance."""
    global _config
    _config = config