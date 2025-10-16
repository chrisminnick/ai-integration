# Where to Put This in a Real Application

SPOT is designed as a backend service that can be integrated into larger applications. With both Node.js and Python implementations available, SPOT can be embedded into web applications, CMSs, APIs, or other tools using your preferred technology stack.

## Integration Options

### Node.js Integration

- **Node.js API**: Import the SPOT class for programmatic access
- **CLI integration**: Shell out to SPOT's npm scripts from your application
- **Style linting**: Use the offline linter for content validation
- **Template system**: Customize prompts for your specific use cases

### Python Integration

- **Python API**: Import the SPOT class for programmatic access in Python applications
- **CLI integration**: Shell out to SPOT's Python CLI from any application
- **FastAPI web service**: Deploy as a microservice with REST APIs
- **Style linting**: Use the offline Python linter for content validation
- **Template system**: Customize prompts using Jinja2 templates
- **Async support**: Full asyncio integration for high-performance applications

## Application UI Features

Once integrated into an application, SPOT could enable UI features such as:

- **Sidebar assist**: Call rewrite/summarize/expand functions from rich text editors
- **Pre-publish checks**: Run style linting before content goes live
- **Content workflows**: Chain SPOT scaffold, expand, and rewrite operations and implement an approval process to require signoff between steps
- **Multi-channel publishing**: Use repurpose functionality for social media variants
- **Brand compliance**: Integrate style pack validation into content approval flows

## Integration Examples

### Node.js Integration

```javascript
import { SPOT } from './src/SPOT.js';
import { ProviderManager } from './src/utils/providerManager.js';

const spot = new SPOT({
  providerManager: new ProviderManager(),
  // ... other dependencies
});

// Generate content programmatically
const result = await spot.generate({
  template: 'rewrite_localize@1.0.0',
  inputFile: 'content.txt',
  provider: 'openai',
});

// Style validation
const styleResult = await spot.checkStyle(result.content);
if (!styleResult.compliant) {
  console.log(`Style violations: ${styleResult.violations.length}`);
}
```

### Python Integration

```python
import asyncio
from spot.core.spot import SPOT
from spot.utils.style_linter import lint_style, load_style_pack

async def main():
    # Initialize SPOT
    spot = SPOT()

    # Generate content programmatically
    result = await spot.generate(
        template='rewrite_localize@1.0.0',
        input_file='content.txt',
        provider='openai'
    )

    # Style validation
    style_pack = load_style_pack()
    style_result = lint_style(result['content'], style_pack)

    if style_result['banned'] or style_result['missing_required']:
        print(f"Style violations found: {len(style_result['banned'])} banned terms")

    # Check style compliance
    compliance_result = await spot.check_style(result['content'])
    print(f"Style compliant: {compliance_result['compliant']}")
    print(f"Style score: {compliance_result['score']:.2f}")

asyncio.run(main())
```

### FastAPI Web Service Integration

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from spot.core.spot import SPOT
from spot.utils.style_linter import lint_style, load_style_pack

app = FastAPI(title="Content Generation API")
spot = SPOT()

class GenerateRequest(BaseModel):
    template: str
    content: str
    provider: str = "openai"

class GenerateResponse(BaseModel):
    content: str
    style_compliant: bool
    style_score: float
    violations: list

@app.post("/generate", response_model=GenerateResponse)
async def generate_content(request: GenerateRequest):
    try:
        # Generate content
        result = await spot.generate(
            template=request.template,
            content=request.content,
            provider=request.provider
        )

        # Check style compliance
        style_result = await spot.check_style(result['content'])

        return GenerateResponse(
            content=result['content'],
            style_compliant=style_result['compliant'],
            style_score=style_result['score'],
            violations=style_result['violations']
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/style/check")
async def check_style(content: str):
    """Check content against style pack rules"""
    style_result = await spot.check_style(content)
    return style_result
```

### Django Integration

```python
# views.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
import asyncio
from spot.core.spot import SPOT

spot = SPOT()

@csrf_exempt
@require_http_methods(["POST"])
def generate_content(request):
    """Generate content via SPOT"""
    try:
        data = json.loads(request.body)

        # Run async function in sync context
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        result = loop.run_until_complete(spot.generate(
            template=data.get('template'),
            content=data.get('content'),
            provider=data.get('provider', 'openai')
        ))

        loop.close()

        return JsonResponse({
            'success': True,
            'content': result['content']
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def validate_style(request):
    """Validate content against style pack"""
    try:
        data = json.loads(request.body)

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        result = loop.run_until_complete(spot.check_style(data.get('content')))

        loop.close()

        return JsonResponse(result)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)
```

### Flask Integration

```python
from flask import Flask, request, jsonify
import asyncio
from spot.core.spot import SPOT

app = Flask(__name__)
spot = SPOT()

def run_async(coro):
    """Helper to run async functions in Flask"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()

@app.route('/generate', methods=['POST'])
def generate_content():
    """Generate content endpoint"""
    try:
        data = request.get_json()

        result = run_async(spot.generate(
            template=data.get('template'),
            content=data.get('content'),
            provider=data.get('provider', 'openai')
        ))

        return jsonify({
            'success': True,
            'content': result['content']
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/style/check', methods=['POST'])
def check_style():
    """Style validation endpoint"""
    try:
        data = request.get_json()

        result = run_async(spot.check_style(data.get('content')))

        return jsonify(result)
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
```

### CLI Integration from External Applications

#### From Node.js/JavaScript applications:

```javascript
const { exec } = require('child_process');

// Generate content via CLI
exec(
  'python -m spot.cli generate --template rewrite_localize@1.0.0 --content "text"',
  (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error}`);
      return;
    }
    const result = JSON.parse(stdout);
    console.log('Generated:', result.content);
  }
);

// Style validation via CLI
exec(
  'python -m spot.cli style-check --content "text" --format json',
  (error, stdout, stderr) => {
    if (error) {
      console.error(`Style check failed: ${error}`);
      return;
    }
    const styleResult = JSON.parse(stdout);
    console.log('Style compliant:', styleResult.compliant);
  }
);
```

#### From Shell scripts:

```bash
#!/bin/bash

# Generate content
CONTENT="This is sample content to rewrite"
RESULT=$(python -m spot.cli generate \
  --template "rewrite_localize@1.0.0" \
  --content "$CONTENT" \
  --format json)

# Extract generated content
GENERATED=$(echo "$RESULT" | jq -r '.content')

# Validate style
STYLE_CHECK=$(python -m spot.cli style-check \
  --content "$GENERATED" \
  --format json)

# Check if compliant
COMPLIANT=$(echo "$STYLE_CHECK" | jq -r '.compliant')

if [ "$COMPLIANT" = "true" ]; then
  echo "Content passed style validation"
  echo "$GENERATED"
else
  echo "Content failed style validation"
  echo "$STYLE_CHECK" | jq '.violations'
fi
```

## Content Workflow Examples

### Multi-Step Content Pipeline (Python)

```python
import asyncio
from spot.core.spot import SPOT

async def content_pipeline(raw_content: str):
    """Complete content processing pipeline"""
    spot = SPOT()

    # Step 1: Generate initial scaffold
    scaffold = await spot.generate(
        template='draft_scaffold@1.0.0',
        content=raw_content,
        provider='openai'
    )

    # Step 2: Expand sections
    expanded = await spot.generate(
        template='section_expand@1.0.0',
        content=scaffold['content'],
        provider='openai'
    )

    # Step 3: Style validation
    style_result = await spot.check_style(expanded['content'])

    # Step 4: Rewrite if needed
    if not style_result['compliant']:
        rewritten = await spot.generate(
            template='rewrite_localize@1.0.0',
            content=expanded['content'],
            provider='openai'
        )
        final_content = rewritten['content']

        # Re-validate
        final_style_result = await spot.check_style(final_content)
    else:
        final_content = expanded['content']
        final_style_result = style_result

    # Step 5: Generate social media variants
    social_variants = {}
    for platform in ['twitter', 'linkedin', 'facebook']:
        variant = await spot.generate(
            template='repurpose_pack@1.0.0',
            content=final_content,
            variables={'platform': platform},
            provider='openai'
        )
        social_variants[platform] = variant['content']

    return {
        'final_content': final_content,
        'style_compliant': final_style_result['compliant'],
        'style_score': final_style_result['score'],
        'social_variants': social_variants
    }

# Usage
async def main():
    result = await content_pipeline("Raw article content here...")
    print(f"Style compliant: {result['style_compliant']}")
    print(f"Style score: {result['style_score']:.2f}")
    print(f"Twitter variant: {result['social_variants']['twitter']}")

asyncio.run(main())
```

## Deployment Patterns

### Microservice Architecture

Deploy SPOT Python as a standalone microservice:

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "spot.web.app:app", "--host", "0.0.0.0", "--port", "8000"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  spot-api:
    build: .
    ports:
      - '8000:8000'
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    volumes:
      - ./style:/app/style
      - ./prompts:/app/prompts
```

### Serverless Deployment

Deploy SPOT functions individually:

```python
# AWS Lambda handler
import json
import asyncio
from spot.core.spot import SPOT

spot = SPOT()

def lambda_handler(event, context):
    """AWS Lambda handler for content generation"""

    async def generate():
        return await spot.generate(
            template=event.get('template'),
            content=event.get('content'),
            provider=event.get('provider', 'openai')
        )

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        result = loop.run_until_complete(generate())
        return {
            'statusCode': 200,
            'body': json.dumps(result)
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
    finally:
        loop.close()
```

## Composable Architecture

Each pattern is designed to be composable. You can start with basic generation, then add style validation, multi-channel repurposing, or custom workflows as needed:

1. **Start Simple**: Basic content generation with templates
2. **Add Validation**: Integrate style pack checking
3. **Scale Up**: Add multi-channel repurposing
4. **Customize**: Build custom workflows and approval processes
5. **Deploy**: Choose between embedded, microservice, or serverless patterns

The dual Node.js/Python implementation ensures you can integrate SPOT into any technology stack while maintaining consistent functionality and style enforcement across your entire content pipeline.
