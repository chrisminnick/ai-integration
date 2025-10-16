"""Provider management for SPOT."""

import asyncio
from typing import Dict, List, Optional, Any
from abc import ABC, abstractmethod

from ..core.config import Config, get_config
from ..utils.logger import get_logger


class Provider(ABC):
    """Abstract base class for AI providers."""
    
    def __init__(self, config: Dict[str, Any], api_key: Optional[str] = None):
        self.config = config
        self.api_key = api_key
        self.logger = get_logger(f"provider.{self.__class__.__name__.lower()}")
    
    @abstractmethod
    async def generate(
        self,
        prompt: str,
        max_tokens: int = None,
        temperature: float = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Generate content using the provider."""
        pass
    
    @abstractmethod
    async def health_check(self) -> bool:
        """Check if the provider is healthy."""
        pass


class MockProvider(Provider):
    """Mock provider for testing."""
    
    async def generate(
        self,
        prompt: str,
        max_tokens: int = None,
        temperature: float = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Generate mock content."""
        return {
            "content": f"Mock response for prompt: {prompt[:50]}...",
            "usage": {"prompt_tokens": 10, "completion_tokens": 20, "total_tokens": 30},
            "model": self.config.get("model", "mock-model"),
            "provider": "mock"
        }
    
    async def health_check(self) -> bool:
        """Mock health check always returns True."""
        return True


class OpenAIProvider(Provider):
    """OpenAI provider implementation."""
    
    def __init__(self, config: Dict[str, Any], api_key: Optional[str] = None):
        super().__init__(config, api_key)
        self.client = None
        if api_key:
            try:
                import openai
                self.client = openai.AsyncOpenAI(api_key=api_key)
            except ImportError:
                self.logger.warning("OpenAI package not installed")
    
    async def generate(
        self,
        prompt: str,
        max_tokens: int = None,
        temperature: float = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Generate content using OpenAI."""
        if not self.client:
            raise ValueError("OpenAI client not available")
        
        try:
            response = await self.client.chat.completions.create(
                model=self.config.get("model", "gpt-4"),
                messages=[{"role": "user", "content": prompt}],
                max_tokens=max_tokens or self.config.get("max_tokens", 2000),
                temperature=temperature or self.config.get("temperature", 0.7),
                **kwargs
            )
            
            return {
                "content": response.choices[0].message.content,
                "usage": response.usage.model_dump(),
                "model": response.model,
                "provider": "openai"
            }
        except Exception as e:
            self.logger.error(f"OpenAI generation failed: {e}")
            raise
    
    async def health_check(self) -> bool:
        """Check OpenAI health."""
        if not self.client:
            return False
        
        try:
            await self.client.models.list()
            return True
        except Exception:
            return False


class AnthropicProvider(Provider):
    """Anthropic provider implementation."""
    
    def __init__(self, config: Dict[str, Any], api_key: Optional[str] = None):
        super().__init__(config, api_key)
        self.client = None
        if api_key:
            try:
                import anthropic
                self.client = anthropic.AsyncAnthropic(api_key=api_key)
            except ImportError:
                self.logger.warning("Anthropic package not installed")
    
    async def generate(
        self,
        prompt: str,
        max_tokens: int = None,
        temperature: float = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Generate content using Anthropic."""
        if not self.client:
            raise ValueError("Anthropic client not available")
        
        try:
            response = await self.client.messages.create(
                model=self.config.get("model", "claude-3-sonnet-20240229"),
                messages=[{"role": "user", "content": prompt}],
                max_tokens=max_tokens or self.config.get("max_tokens", 2000),
                temperature=temperature or self.config.get("temperature", 0.7),
                **kwargs
            )
            
            return {
                "content": response.content[0].text,
                "usage": response.usage.model_dump(),
                "model": response.model,
                "provider": "anthropic"
            }
        except Exception as e:
            self.logger.error(f"Anthropic generation failed: {e}")
            raise
    
    async def health_check(self) -> bool:
        """Check Anthropic health."""
        if not self.client:
            return False
        
        try:
            # Anthropic doesn't have a simple health check endpoint
            # We'll use a minimal message as health check
            await self.client.messages.create(
                model=self.config.get("model", "claude-3-sonnet-20240229"),
                messages=[{"role": "user", "content": "Hello"}],
                max_tokens=1
            )
            return True
        except Exception:
            return False


class GeminiProvider(Provider):
    """Google Gemini provider implementation."""
    
    def __init__(self, config: Dict[str, Any], api_key: Optional[str] = None):
        super().__init__(config, api_key)
        self.model = None
        if api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=api_key)
                self.model = genai.GenerativeModel(
                    model_name=self.config.get("model", "gemini-1.5-pro")
                )
            except ImportError:
                self.logger.warning("Google GenerativeAI package not installed")
    
    async def generate(
        self,
        prompt: str,
        max_tokens: int = None,
        temperature: float = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Generate content using Gemini."""
        if not self.model:
            raise ValueError("Gemini model not available")
        
        try:
            # Configure generation parameters
            generation_config = {
                "max_output_tokens": max_tokens or self.config.get("max_tokens", 2000),
                "temperature": temperature or self.config.get("temperature", 0.7),
            }
            
            response = await asyncio.to_thread(
                self.model.generate_content,
                prompt,
                generation_config=generation_config
            )
            
            return {
                "content": response.text,
                "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},  # Gemini doesn't provide usage stats
                "model": self.config.get("model", "gemini-1.5-pro"),
                "provider": "gemini"
            }
        except Exception as e:
            self.logger.error(f"Gemini generation failed: {e}")
            raise
    
    async def health_check(self) -> bool:
        """Check Gemini health."""
        if not self.model:
            return False
        
        try:
            await asyncio.to_thread(
                self.model.generate_content, "Hello"
            )
            return True
        except Exception:
            return False


class ProviderManager:
    """Manages AI providers with failover support."""
    
    def __init__(self, config: Config = None):
        self.config = config or get_config()
        self.logger = get_logger("provider_manager")
        self.providers: Dict[str, Provider] = {}
        self._initialize_providers()
    
    def _initialize_providers(self):
        """Initialize all available providers."""
        provider_classes = {
            "openai": OpenAIProvider,
            "anthropic": AnthropicProvider,
            "gemini": GeminiProvider,
            "mock": MockProvider,
        }
        
        for name, provider_class in provider_classes.items():
            try:
                provider_config = self.config.get_provider_config(name)
                api_key = self.config.get_api_key(name)
                
                if name == "mock" or api_key:  # Always create mock provider
                    provider = provider_class(
                        config=provider_config.model_dump() if provider_config else {},
                        api_key=api_key
                    )
                    self.providers[name] = provider
                    self.logger.info(f"Initialized {name} provider")
                else:
                    self.logger.warning(f"No API key found for {name} provider")
            
            except Exception as e:
                self.logger.error(f"Failed to initialize {name} provider: {e}")
    
    async def get_provider(self, name: str) -> Provider:
        """Get a provider by name."""
        provider = self.providers.get(name)
        if not provider:
            raise ValueError(f"Provider {name} not available")
        return provider
    
    async def generate(
        self,
        prompt: str,
        provider_name: str = None,
        fallback_providers: List[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Generate content with automatic fallback."""
        provider_name = provider_name or self.config.provider
        fallback_providers = fallback_providers or ["mock"]
        
        # Try primary provider
        try:
            provider = await self.get_provider(provider_name)
            return await provider.generate(prompt, **kwargs)
        except Exception as e:
            self.logger.warning(f"Primary provider {provider_name} failed: {e}")
        
        # Try fallback providers
        for fallback_name in fallback_providers:
            try:
                provider = await self.get_provider(fallback_name)
                result = await provider.generate(prompt, **kwargs)
                self.logger.info(f"Used fallback provider: {fallback_name}")
                return result
            except Exception as e:
                self.logger.warning(f"Fallback provider {fallback_name} failed: {e}")
        
        raise RuntimeError("All providers failed")
    
    async def health_check_all(self) -> Dict[str, bool]:
        """Check health of all providers."""
        results = {}
        for name, provider in self.providers.items():
            try:
                results[name] = await provider.health_check()
            except Exception as e:
                self.logger.error(f"Health check failed for {name}: {e}")
                results[name] = False
        return results
    
    def list_providers(self) -> List[str]:
        """List available providers."""
        return list(self.providers.keys())