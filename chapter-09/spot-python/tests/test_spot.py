"""Test SPOT core functionality."""

import pytest
from spot.core.spot import SPOT


class TestSPOT:
    """Test SPOT core functionality."""
    
    @pytest.mark.asyncio
    async def test_health_check(self, test_config):
        """Test health check functionality."""
        spot = SPOT(test_config)
        result = await spot.health_check()
        
        assert "status" in result
        assert "providers" in result
        assert "templates_available" in result
        assert result["status"] in ["healthy", "unhealthy"]
    
    @pytest.mark.asyncio
    async def test_validate_templates(self, test_config):
        """Test template validation."""
        spot = SPOT(test_config)
        results = await spot.validate_templates()
        
        assert isinstance(results, list)
        # Should have at least some templates from the copied files
        if results:
            for result in results:
                assert "templateId" in result
                assert "status" in result
    
    @pytest.mark.asyncio
    async def test_generate_mock(self, test_config):
        """Test content generation with mock provider."""
        spot = SPOT(test_config)
        
        # Test with simple input data
        input_data = {"content": "Test content"}
        
        result = await spot.generate(
            template="draft_scaffold@1.0.0",  # This should exist from copied templates
            input_data=input_data,
            provider="mock"
        )
        
        assert "content" in result
        assert "provider" in result
        assert result["provider"] == "mock"
    
    @pytest.mark.asyncio
    async def test_evaluate(self, test_config):
        """Test evaluation functionality."""
        spot = SPOT(test_config)
        
        result = await spot.evaluate(provider="mock")
        
        assert "template" in result
        assert "provider" in result
        assert "score" in result
        assert isinstance(result["score"], (int, float))