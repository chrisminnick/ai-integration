# SPOT Web API

A RESTful API for the SPOT (Structured Prompt Output Toolkit) content generation system.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start the API server
npm run api

# Or start in development mode with auto-reload
npm run api:dev

# Production mode
npm run api:prod
```

The API server will be available at `http://localhost:8000` by default.

## 🔧 Configuration

Set these environment variables in your `.env` file:

```bash
# API Server Configuration
PORT=8000
NODE_ENV=development
CORS_ORIGINS=http://localhost:3000,http://localhost:8080
RATE_LIMIT_MAX=100

# SPOT Configuration (same as CLI)
PROVIDER=openai
OPENAI_API_KEY=your_api_key_here
LOG_LEVEL=info
LOG_OUTPUTS=console,file
LOG_FILE=logs/spot.log
```

## 📡 API Endpoints

### Health & Info

#### `GET /health`

Check system health status.

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2025-10-02T10:30:00.000Z",
  "checks": [
    {
      "name": "system",
      "status": "healthy",
      "duration": 0,
      "details": { "status": "ok", "uptime": 3600.5 }
    }
  ]
}
```

#### `GET /api/v1/info`

Get API information and available features.

**Response:**

```json
{
  "name": "spot-toolkit",
  "version": "0.4.0",
  "description": "AI-powered content generation toolkit",
  "environment": "development",
  "provider": "openai",
  "features": [
    "Multi-Provider AI Support",
    "Template Management",
    "Content Generation",
    "Style Governance",
    "Evaluation Framework"
  ],
  "endpoints": {
    "health": "/health",
    "templates": "/api/v1/templates",
    "providers": "/api/v1/providers",
    "generate": "/api/v1/generate",
    "evaluate": "/api/v1/evaluate"
  }
}
```

### Templates

#### `GET /api/v1/templates`

List all available templates.

**Response:**

```json
{
  "templates": [
    "draft_scaffold@1.0.0",
    "section_expand@1.0.0",
    "repurpose_pack@1.0.0",
    "rewrite_localize@1.0.0",
    "summarize_grounded@1.0.0"
  ]
}
```

#### `GET /api/v1/templates/{templateId}`

Get specific template details.

**Response:**

```json
{
  "template": {
    "id": "draft_scaffold@1.0.0",
    "version": "1.0.0",
    "description": "Create content scaffolds from briefs",
    "parameters": ["asset_type", "topic", "audience", "tone", "word_count"]
  }
}
```

#### `POST /api/v1/templates/validate`

Validate all templates.

**Response:**

```json
{
  "validation": [{ "templateId": "draft_scaffold@1.0.0", "status": "valid" }],
  "summary": {
    "total": 5,
    "valid": 5,
    "invalid": 0
  }
}
```

### Providers

#### `GET /api/v1/providers`

List available AI providers.

**Response:**

```json
{
  "providers": [
    {
      "id": "openai",
      "name": "OpenAI",
      "models": ["gpt-4", "gpt-3.5-turbo"],
      "available": true
    },
    {
      "id": "anthropic",
      "name": "Anthropic",
      "models": ["claude-3-sonnet-20240229"],
      "available": true
    }
  ]
}
```

#### `GET /api/v1/providers/{providerId}/health`

Check specific provider health.

**Response:**

```json
{
  "provider": "openai",
  "status": "healthy",
  "latency": 125,
  "timestamp": "2025-10-02T10:30:00.000Z"
}
```

### Content Generation

#### `POST /api/v1/generate`

Generate content using any template.

**Request Body:**

```json
{
  "template": "draft_scaffold@1.0.0",
  "content": {
    "asset_type": "blog post",
    "topic": "AI applications",
    "audience": "developers",
    "tone": "technical"
  },
  "provider": "openai",
  "options": {
    "temperature": 0.7,
    "max_tokens": 2000
  }
}
```

**Response:**

```json
{
  "result": {
    "content": "Generated content here...",
    "metadata": {
      "template": "draft_scaffold@1.0.0",
      "provider": "openai",
      "latency": 1250,
      "tokens": 456
    }
  }
}
```

#### `POST /api/v1/scaffold`

Create content scaffolds from briefs.

**Request Body:**

```json
{
  "asset_type": "blog post",
  "topic": "Privacy-first analytics",
  "audience": "startup founders",
  "tone": "confident",
  "word_count": 800
}
```

**Response:**

```json
{
  "scaffold": {
    "title": "Building Privacy-First Analytics for Your Startup",
    "sections": [
      {
        "heading": "Why Privacy Matters",
        "bullets": ["Build customer trust", "Comply with regulations"]
      }
    ]
  }
}
```

#### `POST /api/v1/expand`

Expand content sections into full prose.

**Request Body:**

```json
{
  "section_json": "{\"heading\":\"Why Privacy Matters\",\"bullets\":[\"Build trust\",\"Comply with regulations\"]}"
}
```

**Response:**

```json
{
  "expanded": {
    "heading": "Why Privacy Matters",
    "content": "Privacy-first analytics builds customer trust by...",
    "word_count": 285
  }
}
```

#### `POST /api/v1/rewrite`

Rewrite content for different audiences.

**Request Body:**

```json
{
  "text": "Original content to rewrite...",
  "audience": "CFOs",
  "tone": "formal",
  "grade_level": 9,
  "words": 140,
  "locale": "en-GB"
}
```

**Response:**

```json
{
  "rewritten": {
    "text": "Rewritten content for CFOs...",
    "changes": ["Simplified technical terms", "Added ROI focus"],
    "word_count": 138
  }
}
```

#### `POST /api/v1/summarize`

Summarize content with citations.

**Request Body:**

```json
{
  "content": "Long transcript or article content...",
  "mode": "executive"
}
```

**Response:**

```json
{
  "summary": {
    "executive_summary": "Key points summary...",
    "key_points": [
      "Point 1 with citation [00:12:34]",
      "Point 2 with citation [00:18:45]"
    ],
    "word_count": 250
  }
}
```

#### `POST /api/v1/repurpose`

Repurpose content for multiple channels.

**Request Body:**

```json
{
  "content": "Original article content...",
  "channels": ["email", "social", "blog"]
}
```

**Response:**

```json
{
  "repurposed": {
    "email": {
      "subject": "Email subject line",
      "body": "Email version of content..."
    },
    "social": {
      "twitter": "Twitter-friendly version...",
      "linkedin": "LinkedIn post version..."
    },
    "blog": {
      "title": "Blog post title",
      "excerpt": "Blog post excerpt..."
    }
  }
}
```

### Evaluation

#### `POST /api/v1/evaluate`

Run evaluation tests.

**Request Body:**

```json
{
  "template": "draft_scaffold@1.0.0",
  "options": {
    "provider": "openai",
    "test_files": ["golden_set/briefs/brief1.json"]
  }
}
```

**Response:**

```json
{
  "evaluation": {
    "template": "draft_scaffold@1.0.0",
    "results": {
      "count": 1,
      "latency": { "p50": 1250, "p95": 1800 },
      "style_violations": 0,
      "success_rate": 1.0
    }
  }
}
```

#### `POST /api/v1/evaluate/file`

Evaluate a specific file.

**Request Body:**

```json
{
  "filePath": "my_content/article.txt",
  "operation": "scaffold"
}
```

### Style Checking

#### `POST /api/v1/style/check`

Check content against style rules.

**Request Body:**

```json
{
  "content": "Content to check for style compliance..."
}
```

**Response:**

```json
{
  "violations": [
    {
      "type": "must_avoid",
      "term": "revolutionary",
      "message": "Content contains prohibited term: 'revolutionary'"
    }
  ],
  "compliant": false,
  "stylepack": {
    "brand_voice": "Confident, friendly, concrete; no hype.",
    "must_avoid": ["revolutionary", "disruptive"]
  }
}
```

#### `GET /api/v1/style/rules`

Get current style rules.

**Response:**

```json
{
  "stylepack": {
    "brand_voice": "Confident, friendly, concrete; no hype.",
    "reading_level": "Grade 8-10",
    "must_use": ["accessible", "inclusive"],
    "must_avoid": ["revolutionary", "disruptive"],
    "terminology": {
      "user": "person"
    }
  }
}
```

### File Management

#### `GET /api/v1/files?directory=my_content`

List files in a directory.

**Response:**

```json
{
  "files": [
    {
      "name": "article.txt",
      "path": "my_content/article.txt",
      "size": 1024,
      "modified": "2025-10-02T10:30:00.000Z"
    }
  ]
}
```

#### `POST /api/v1/files/upload`

Upload a file.

**Request Body:**

```json
{
  "filename": "new-article.txt",
  "content": "Article content here...",
  "directory": "my_content"
}
```

**Response:**

```json
{
  "message": "File uploaded successfully",
  "path": "my_content/new-article.txt",
  "size": 256
}
```

## 🔒 Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS**: Configurable allowed origins
- **Helmet**: Security headers
- **Input Validation**: Request body validation
- **Error Handling**: Sanitized error messages

## 🚀 Usage Examples

### JavaScript/Node.js

```javascript
const response = await fetch('http://localhost:8000/api/v1/scaffold', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    asset_type: 'blog post',
    topic: 'AI applications',
    audience: 'developers',
    tone: 'technical',
    word_count: 600,
  }),
});

const { scaffold } = await response.json();
console.log(scaffold);
```

### Python

```python
import requests

response = requests.post('http://localhost:8000/api/v1/scaffold', json={
    'asset_type': 'blog post',
    'topic': 'AI applications',
    'audience': 'developers',
    'tone': 'technical',
    'word_count': 600
})

scaffold = response.json()['scaffold']
print(scaffold)
```

### cURL

```bash
curl -X POST http://localhost:8000/api/v1/scaffold \
  -H "Content-Type: application/json" \
  -d '{
    "asset_type": "blog post",
    "topic": "AI applications",
    "audience": "developers",
    "tone": "technical",
    "word_count": 600
  }'
```

## 🐛 Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message description",
  "timestamp": "2025-10-02T10:30:00.000Z",
  "path": "/api/v1/scaffold"
}
```

Common HTTP status codes:

- `200` - Success
- `400` - Bad Request (missing required fields)
- `404` - Not Found (template/provider not found)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error
- `503` - Service Unavailable (provider health check failed)

## 🔧 Development

To extend the API:

1. Add new route handlers to `src/api/server.js`
2. Update this documentation
3. Add corresponding tests
4. Update the OpenAPI specification (if using)

## 📊 Monitoring

The API includes built-in monitoring:

- Health checks at `/health`
- Request logging
- Error tracking
- Performance metrics

All logs are written according to your `LOG_OUTPUTS` configuration.
