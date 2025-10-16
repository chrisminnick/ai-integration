"""FastAPI web application for SPOT."""

from typing import Dict, Any, Optional
import asyncio

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field
from typing import List

from ..core.spot import SPOT
from ..core.config import Config


class GenerateRequest(BaseModel):
    """Request model for content generation."""
    template: str = Field(
        description="Template name with version (e.g., 'draft_scaffold@1.0.0')",
        example="draft_scaffold@1.0.0"
    )
    input_data: Dict[str, Any] = Field(
        description="Variables to populate the template",
        example={
            "asset_type": "blog post",
            "topic": "Python programming",
            "audience": "developers",
            "tone": "technical",
            "word_count": "800"
        }
    )
    provider: Optional[str] = Field(
        default=None,
        description="AI provider to use (openai, anthropic, gemini, mock)",
        example="mock"
    )
    max_tokens: Optional[int] = Field(
        default=None,
        description="Maximum tokens to generate",
        example=2000
    )
    temperature: Optional[float] = Field(
        default=None,
        description="Generation temperature (0.0-1.0)",
        example=0.7
    )


class GenerateResponse(BaseModel):
    """Response model for content generation."""
    content: str = Field(description="Generated content", example="Mock response for prompt...")
    provider: str = Field(description="AI provider used", example="mock")
    model: str = Field(description="Model used", example="mock-model")
    usage: Dict[str, Any] = Field(
        description="Token usage statistics",
        example={"prompt_tokens": 10, "completion_tokens": 20, "total_tokens": 30}
    )


class HealthResponse(BaseModel):
    """Response model for health check."""
    status: str = Field(description="Overall health status", example="healthy")
    providers: Dict[str, bool] = Field(
        description="Provider availability",
        example={"mock": True, "openai": False}
    )
    templates_available: bool = Field(description="Template availability", example=True)
    config: Dict[str, Any] = Field(
        description="Current configuration",
        example={"provider": "mock", "log_level": "info"}
    )


class EvaluationResponse(BaseModel):
    """Response model for evaluation."""
    template: str = Field(description="Template evaluated", example="draft_scaffold@1.0.0")
    provider: str = Field(description="Provider evaluated", example="mock")
    score: float = Field(description="Evaluation score (0-1)", example=0.85)
    metrics: Dict[str, Any] = Field(
        description="Detailed metrics",
        example={"latency": 1.2, "token_efficiency": 0.9}
    )


class StyleCheckRequest(BaseModel):
    """Request model for style checking."""
    content: str = Field(
        description="Content to check for style compliance",
        example="This revolutionary AI solution will disrupt the market..."
    )


class StyleViolation(BaseModel):
    """Model for individual style violations."""
    type: str = Field(description="Type of violation", example="must_avoid")
    term: str = Field(description="Violating term", example="revolutionary")
    message: str = Field(description="Violation description", example="Content contains prohibited term: 'revolutionary'")


class StyleCheckResponse(BaseModel):
    """Response model for style checking."""
    violations: List[StyleViolation] = Field(description="List of style violations")
    compliant: bool = Field(description="Whether content is style compliant", example=False)
    score: float = Field(description="Style compliance score (0-1)", example=0.8)
    report: Dict[str, Any] = Field(description="Detailed linting report")
    stylepack: Dict[str, Any] = Field(description="Style pack rules used")


def create_app(config: Config) -> FastAPI:
    """Create FastAPI application."""
    
    app = FastAPI(
        title="SPOT API",
        description="Structured Prompt Output Toolkit - AI-Powered Content Generation",
        version="1.0.0",
    )
    
    # Initialize SPOT
    spot = SPOT(config)
    
    @app.get("/", response_class=HTMLResponse)
    async def root():
        """Root endpoint with basic info."""
        html_content = f"""
        <html>
            <head>
                <title>SPOT - Structured Prompt Output Toolkit</title>
                <style>
                    body {{ font-family: Arial, sans-serif; margin: 40px; }}
                    .header {{ color: #2196F3; }}
                    .section {{ margin: 20px 0; }}
                    .endpoint {{ background: #f5f5f5; padding: 10px; margin: 5px 0; border-radius: 5px; }}
                    code {{ background: #e0e0e0; padding: 2px 4px; border-radius: 3px; }}
                </style>
            </head>
            <body>
                <h1 class="header">🚀 SPOT - Structured Prompt Output Toolkit</h1>
                <p>AI-powered content generation with multi-provider support.</p>
                
                <div class="section">
                    <h2>API Endpoints</h2>
                    <div class="endpoint">
                        <strong>GET /health</strong> - System health check
                    </div>
                    <div class="endpoint">
                        <strong>POST /generate</strong> - Generate content using templates
                    </div>
                    <div class="endpoint">
                        <strong>POST /evaluate</strong> - Run evaluation tests
                    </div>
                    <div class="endpoint">
                        <strong>GET /validate</strong> - Validate templates
                    </div>
                    <div class="endpoint">
                        <strong>GET /providers</strong> - List available providers
                    </div>
                </div>
                
                <div class="section">
                    <h2>Documentation</h2>
                    <p>Visit <a href="/docs">/docs</a> for interactive API documentation.</p>
                    <p>Visit <a href="/redoc">/redoc</a> for alternative documentation.</p>
                </div>
                
                <div class="section">
                    <h2>Configuration</h2>
                    <p>Current provider: <code>{config.provider}</code></p>
                    <p>Environment: <code>{config.environment}</code></p>
                    <p>Log level: <code>{config.log_level}</code></p>
                </div>
            </body>
        </html>
        """
        return html_content
    
    @app.get("/health", response_model=HealthResponse)
    async def health_check():
        """Check system health."""
        try:
            result = await spot.health_check()
            return HealthResponse(**result)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    @app.post("/generate", response_model=GenerateResponse)
    async def generate_content(request: GenerateRequest):
        """Generate content using a template."""
        try:
            kwargs = {}
            if request.max_tokens:
                kwargs['max_tokens'] = request.max_tokens
            if request.temperature:
                kwargs['temperature'] = request.temperature
            
            result = await spot.generate(
                template=request.template,
                input_data=request.input_data,
                provider=request.provider,
                **kwargs
            )
            
            return GenerateResponse(
                content=result["content"],
                provider=result["provider"],
                model=result["model"],
                usage=result["usage"]
            )
        
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    @app.post("/evaluate", response_model=EvaluationResponse)
    async def run_evaluation(
        template: Optional[str] = None,
        provider: Optional[str] = None
    ):
        """Run evaluation tests."""
        try:
            result = await spot.evaluate(template=template, provider=provider)
            return EvaluationResponse(**result)
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    @app.get("/validate")
    async def validate_templates():
        """Validate all templates."""
        try:
            results = await spot.validate_templates()
            return {"validation_results": results}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    @app.get("/providers")
    async def list_providers():
        """List available providers."""
        try:
            providers = spot.provider_manager.list_providers()
            health_status = await spot.provider_manager.health_check_all()
            
            return {
                "providers": providers,
                "health": health_status,
                "current": config.provider
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    @app.get("/templates")
    async def list_templates():
        """List available templates with example usage."""
        try:
            results = await spot.validate_templates()
            
            # Add example input data for each template
            template_examples = {
                "draft_scaffold@1.0.0": {
                    "asset_type": "blog post",
                    "topic": "Machine Learning",
                    "audience": "data scientists",
                    "tone": "informative",
                    "word_count": "1200"
                },
                "section_expand@1.0.0": {
                    "section_json": '{"heading": "Introduction", "bullets": ["Overview", "Key concepts"]}'
                },
                "repurpose_pack@1.0.0": {
                    "content": "Your original content here...",
                    "channels": "social,email,blog"
                },
                "rewrite_localize@1.0.0": {
                    "text": "Original text to rewrite...",
                    "audience": "executives",
                    "tone": "formal",
                    "grade_level": "9"
                },
                "summarize_grounded@1.0.0": {
                    "content": "Long content to summarize...",
                    "mode": "executive"
                }
            }
            
            # Add examples to results
            for result in results:
                template_id = result.get("templateId")
                if template_id in template_examples:
                    result["example_input"] = template_examples[template_id]
            
            return {
                "templates": results,
                "usage": "Use these examples in the input_data field of /generate endpoint"
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    @app.post("/generate/example")
    async def generate_example():
        """Generate content using a predefined example (useful for testing)."""
        try:
            example_request = {
                "template": "draft_scaffold@1.0.0",
                "input_data": {
                    "asset_type": "blog post",
                    "topic": "FastAPI for beginners",
                    "audience": "Python developers",
                    "tone": "friendly",
                    "word_count": "800"
                },
                "provider": "mock"
            }
            
            result = await spot.generate(
                template=example_request["template"],
                input_data=example_request["input_data"],
                provider=example_request["provider"]
            )
            
            return {
                "request_used": example_request,
                "result": GenerateResponse(
                    content=result["content"],
                    provider=result["provider"],
                    model=result["model"],
                    usage=result["usage"]
                )
            }
        
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    @app.post("/style/check", response_model=StyleCheckResponse)
    async def check_style(request: StyleCheckRequest):
        """Check content against style pack rules."""
        try:
            result = await spot.check_style(request.content)
            
            # Convert violations to the response format
            violations = [
                StyleViolation(**violation) for violation in result["violations"]
            ]
            
            return StyleCheckResponse(
                violations=violations,
                compliant=result["compliant"],
                score=result["score"],
                report=result["report"],
                stylepack=result["stylepack"]
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    @app.get("/style/rules")
    async def get_style_rules():
        """Get current style pack rules."""
        try:
            from ..utils.style_linter import load_style_pack
            style_pack = load_style_pack()
            return {"stylepack": style_pack}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    @app.post("/style/lint-file")
    async def lint_file(file_path: str):
        """Lint a file against style pack rules."""
        try:
            result = await spot.lint_file(file_path)
            
            # Convert violations to the response format
            violations = [
                StyleViolation(**violation) for violation in result["violations"]
            ]
            
            return {
                "file_path": result["file_path"],
                "violations": violations,
                "compliant": result["compliant"],
                "score": result["score"],
                "report": result["report"],
                "stylepack": result["stylepack"]
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    return app