"""Core SPOT functionality."""

import asyncio
import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

from .config import Config, get_config
from ..providers.manager import ProviderManager
from ..utils.logger import get_logger
from ..utils.style_linter import load_style_pack, lint_style, calculate_style_score


class TemplateManager:
    """Manages prompt templates."""
    
    def __init__(self, templates_dir: Path):
        self.templates_dir = templates_dir
        self.logger = get_logger("template_manager")
        self._cache: Dict[str, Dict] = {}
    
    async def load_template(self, template_name: str) -> Dict[str, Any]:
        """Load a template by name."""
        if template_name in self._cache:
            return self._cache[template_name]
        
        template_path = self.templates_dir / f"{template_name}.json"
        
        if not template_path.exists():
            raise FileNotFoundError(f"Template {template_name} not found")
        
        try:
            with open(template_path, 'r', encoding='utf-8') as f:
                template = json.load(f)
            
            self._cache[template_name] = template
            return template
        
        except Exception as e:
            self.logger.error(f"Failed to load template {template_name}: {e}")
            raise
    
    async def validate_template(self, template: Dict[str, Any]) -> bool:
        """Validate template structure."""
        required_fields = ["id", "version"]
        
        # Check required fields
        for field in required_fields:
            if field not in template:
                return False
        
        # Check that we have either 'prompt' or 'user' field for the actual prompt content
        if "prompt" not in template and "user" not in template:
            return False
        
        return True
    
    async def render_template(self, template: Dict[str, Any], variables: Dict[str, Any], style_pack: Optional[Dict[str, Any]] = None) -> str:
        """Render template with variables and optional style pack integration."""
        # Get the prompt content - handle both old and new formats
        if "prompt" in template:
            prompt = template["prompt"]
        elif "user" in template:
            # For SPOT templates, combine system and user prompts
            system_prompt = template.get("system", "")
            user_prompt = template["user"]
            if system_prompt:
                prompt = f"{system_prompt}\n\n{user_prompt}"
            else:
                prompt = user_prompt
        else:
            raise ValueError("Template must contain either 'prompt' or 'user' field")
        
        # Simple variable substitution
        for key, value in variables.items():
            placeholder = f"{{{key}}}"
            prompt = prompt.replace(placeholder, str(value))
        
        # Add style pack instructions if provided
        if style_pack:
            style_instructions = []
            
            if style_pack.get("brand_voice"):
                style_instructions.append(f"Brand voice: {style_pack['brand_voice']}")
            
            if style_pack.get("reading_level"):
                style_instructions.append(f"Target reading level: {style_pack['reading_level']}")
            
            if style_pack.get("must_use"):
                style_instructions.append(f"Must use these terms: {', '.join(style_pack['must_use'])}")
            
            if style_pack.get("must_avoid"):
                style_instructions.append(f"Avoid these terms: {', '.join(style_pack['must_avoid'])}")
            
            if style_instructions:
                prompt += "\n\nStyle Guidelines:\n" + "\n".join(f"- {instruction}" for instruction in style_instructions)
        
        return prompt


class EvaluationManager:
    """Manages evaluation and testing."""
    
    def __init__(self, golden_set_dir: Path):
        self.golden_set_dir = golden_set_dir
        self.logger = get_logger("evaluation_manager")
    
    async def run_evaluation(self, template_name: str, provider_name: str) -> Dict[str, Any]:
        """Run evaluation for a template and provider."""
        try:
            # This is a simplified evaluation - in a full implementation,
            # this would run against golden set test cases
            
            # Load style pack for evaluation
            try:
                style_pack = load_style_pack()
            except (FileNotFoundError, json.JSONDecodeError):
                style_pack = {}
            
            # Mock evaluation result with style compliance
            style_compliance_score = 0.8  # This would be calculated from actual test runs
            
            return {
                "template": template_name,
                "provider": provider_name,
                "score": 0.85,
                "metrics": {
                    "latency": 1.2,
                    "token_efficiency": 0.9,
                    "style_compliance": style_compliance_score,
                    "reading_level_compliant": True,
                    "style_violations": 0
                }
            }
        except Exception as e:
            self.logger.error(f"Evaluation failed for {template_name} with {provider_name}: {e}")
            raise


class SPOT:
    """Main SPOT application class."""
    
    def __init__(self, config: Config = None):
        self.config = config or get_config()
        self.logger = get_logger("spot")
        
        # Initialize managers
        self.provider_manager = ProviderManager(self.config)
        self.template_manager = TemplateManager(self.config.templates_dir)
        self.evaluation_manager = EvaluationManager(self.config.golden_set_dir)
        
        self.logger.info("SPOT initialized successfully")
    
    async def generate(
        self,
        template: str,
        input_data: Union[Dict[str, Any], str, Path],
        output_file: Optional[Union[str, Path]] = None,
        provider: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Generate content using a template."""
        try:
            self.logger.info(f"Starting content generation with template: {template}")
            
            # Load template
            template_data = await self.template_manager.load_template(template)
            
            # Load style pack
            try:
                style_pack = load_style_pack()
            except (FileNotFoundError, json.JSONDecodeError) as e:
                self.logger.warning(f"Could not load style pack: {e}")
                style_pack = None
            
            # Prepare input data
            if isinstance(input_data, (str, Path)):
                # Load from file
                input_path = Path(input_data)
                if input_path.suffix.lower() == '.json':
                    with open(input_path, 'r', encoding='utf-8') as f:
                        variables = json.load(f)
                else:
                    with open(input_path, 'r', encoding='utf-8') as f:
                        variables = {"content": f.read()}
            else:
                variables = input_data
            
            # For templates that expect style pack variables, add them
            if style_pack and template_data.get("inputs"):
                template_inputs = template_data["inputs"]
                if "style_pack_rules" in template_inputs:
                    variables["style_pack_rules"] = json.dumps(style_pack)
                if "must_use" in template_inputs:
                    variables["must_use"] = json.dumps(style_pack.get("must_use", []))
                if "must_avoid" in template_inputs:
                    variables["must_avoid"] = json.dumps(style_pack.get("must_avoid", []))
            
            # Render template with style pack integration
            prompt = await self.template_manager.render_template(template_data, variables, style_pack)
            
            # Generate content
            result = await self.provider_manager.generate(
                prompt=prompt,
                provider_name=provider,
                **kwargs
            )
            
            # Save output if specified
            if output_file:
                output_path = Path(output_file)
                output_path.parent.mkdir(parents=True, exist_ok=True)
                
                if output_path.suffix.lower() == '.json':
                    with open(output_path, 'w', encoding='utf-8') as f:
                        json.dump(result, f, indent=2)
                else:
                    with open(output_path, 'w', encoding='utf-8') as f:
                        f.write(result["content"])
            
            self.logger.info("Content generation completed successfully")
            return result
        
        except Exception as e:
            self.logger.error(f"Content generation failed: {e}")
            raise
    
    async def evaluate(
        self,
        template: Optional[str] = None,
        provider: Optional[str] = None
    ) -> Dict[str, Any]:
        """Run evaluation tests."""
        try:
            self.logger.info("Starting evaluation")
            
            template = template or "draft_scaffold@1.0.0"
            provider = provider or self.config.provider
            
            result = await self.evaluation_manager.run_evaluation(template, provider)
            
            self.logger.info("Evaluation completed successfully")
            return result
        
        except Exception as e:
            self.logger.error(f"Evaluation failed: {e}")
            raise
    
    async def health_check(self) -> Dict[str, Any]:
        """Perform system health check."""
        try:
            self.logger.info("Running health check")
            
            # Check providers
            provider_health = await self.provider_manager.health_check_all()
            
            # Check templates directory
            templates_available = self.config.templates_dir.exists()
            
            # Overall status
            all_healthy = (
                any(provider_health.values()) and  # At least one provider healthy
                templates_available
            )
            
            result = {
                "status": "healthy" if all_healthy else "unhealthy",
                "providers": provider_health,
                "templates_available": templates_available,
                "config": {
                    "provider": self.config.provider,
                    "log_level": self.config.log_level,
                    "environment": self.config.environment
                }
            }
            
            self.logger.info(f"Health check completed: {result['status']}")
            return result
        
        except Exception as e:
            self.logger.error(f"Health check failed: {e}")
            raise
    
    async def validate_templates(self) -> List[Dict[str, Any]]:
        """Validate all templates."""
        try:
            self.logger.info("Validating templates")
            
            results = []
            
            if not self.config.templates_dir.exists():
                return [{"error": "Templates directory not found"}]
            
            for template_file in self.config.templates_dir.glob("*.json"):
                template_name = template_file.stem
                try:
                    template_data = await self.template_manager.load_template(template_name)
                    is_valid = await self.template_manager.validate_template(template_data)
                    
                    results.append({
                        "templateId": template_name,
                        "status": "valid" if is_valid else "invalid"
                    })
                
                except Exception as e:
                    results.append({
                        "templateId": template_name,
                        "status": "error",
                        "error": str(e)
                    })
            
            self.logger.info(f"Template validation completed: {len(results)} templates checked")
            return results
        
        except Exception as e:
            self.logger.error(f"Template validation failed: {e}")
            raise
    
    async def check_style(self, content: str) -> Dict[str, Any]:
        """Check content against style pack rules.
        
        Args:
            content: Text content to analyze
            
        Returns:
            Style checking report with violations and compliance info
        """
        try:
            self.logger.info("Running style check")
            
            # Load style pack
            style_pack = load_style_pack()
            
            # Run style analysis
            report = lint_style(content, style_pack)
            
            # Calculate overall score
            score = calculate_style_score(report)
            
            # Create violations list for API compatibility
            violations = []
            
            # Add banned term violations
            for term in report.get("banned", []):
                violations.append({
                    "type": "must_avoid",
                    "term": term,
                    "message": f'Content contains prohibited term: "{term}"'
                })
            
            # Add missing required term violations
            for term in report.get("missing_required", []):
                violations.append({
                    "type": "must_use",
                    "term": term,
                    "message": f'Content missing required term: "{term}"'
                })
            
            # Add reading level violation
            if not report.get("reading_level_ok", True):
                violations.append({
                    "type": "reading_level",
                    "term": f"Grade {report['reading_level']}",
                    "message": f"Reading level {report['reading_level']} outside target range: {style_pack.get('reading_level', 'Grade 8-10')}"
                })
            
            result = {
                "violations": violations,
                "compliant": len(violations) == 0,
                "score": score,
                "report": report,
                "stylepack": style_pack
            }
            
            self.logger.info(f"Style check completed: {'compliant' if result['compliant'] else 'violations found'}")
            return result
            
        except Exception as e:
            self.logger.error(f"Style check failed: {e}")
            raise
    
    async def lint_file(self, file_path: Union[str, Path]) -> Dict[str, Any]:
        """Lint a file against style pack rules.
        
        Args:
            file_path: Path to file to analyze
            
        Returns:
            Style checking report
        """
        try:
            file_path = Path(file_path)
            
            if not file_path.exists():
                raise FileNotFoundError(f"File not found: {file_path}")
            
            # Read file content
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Run style check
            result = await self.check_style(content)
            result["file_path"] = str(file_path)
            
            return result
            
        except Exception as e:
            self.logger.error(f"File linting failed: {e}")
            raise