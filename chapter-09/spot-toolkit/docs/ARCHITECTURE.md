# SPOT Architecture

A comprehensive overview of SPOT's production-ready architecture, design patterns, and implementation details.

## System Overview

SPOT is designed as a modular, production-ready system for AI-powered content generation with the following key characteristics:

- **Zero external dependencies** (except `dotenv` for environment management)
- **Multi-provider AI support** with automatic failover
- **Comprehensive evaluation framework** for quality assurance
- **Production-ready patterns** including error handling, logging, and monitoring
- **Template-driven architecture** with versioning and A/B testing support

## Core Architecture

### High-Level Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CLI Layer     │    │  Evaluation     │    │  Template       │
│   (app.js,      │    │  Framework      │    │  Management     │
│    cli.js)      │    │  (src/eval/)    │    │  (prompts/)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
            ┌─────────────────────────────────────────┐
            │         SPOT Core                       │
            │       (src/SPOT.js)                     │
            └─────────────────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Provider      │    │   Utilities     │    │  Configuration  │
│   Management    │    │   (src/utils/)  │    │   (configs/)    │
│ (src/providers/)│    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Component Details

#### 1. CLI Layer

- **`app.js`** - Main application entry point with interactive menu system
- **`src/cli.js`** - Task-specific command-line interface for direct operations
- **Purpose:** User interaction, parameter handling, command routing

#### 2. SPOT Core (`src/SPOT.js`)

- **Central orchestrator** for all content generation operations
- **Template processing** and parameter substitution
- **Provider coordination** and fallback handling
- **Response formatting** and validation

#### 3. Provider Management (`src/providers/`)

- **Abstract provider interface** for consistent AI provider integration
- **Multi-provider support:** OpenAI, Anthropic, Gemini, Mock
- **Automatic failover** and circuit breaker patterns
- **Provider-specific optimizations** and error handling

#### 4. Production Utilities (`src/utils/`)

- **Error handling** with custom error types and retry logic
- **Configuration management** with environment-aware loading
- **Logging system** with structured output and multiple formats
- **Monitoring and health checks** for system reliability

#### 5. Evaluation Framework (`src/eval/`)

- **Comprehensive testing** across multiple quality dimensions
- **Golden set management** with categorized test data
- **Performance benchmarking** and provider comparison
- **Quality metrics** including style compliance and readability

## Data Flow Architecture

### Content Generation Flow

```
Input (Brief/Content)
        │
        ▼
┌─────────────────┐
│  Parameter      │ ──── Template Selection
│  Validation     │      (prompts/*.json)
└─────────────────┘
        │
        ▼
┌─────────────────┐
│  Template       │ ──── Style Pack Rules
│  Processing     │      (style/*.json)
└─────────────────┘
        │
        ▼
┌─────────────────┐
│  Provider       │ ──── Circuit Breaker
│  Selection      │      Health Monitoring
└─────────────────┘
        │
        ▼
┌─────────────────┐
│  AI Provider    │ ──── OpenAI/Anthropic/
│  API Call       │      Gemini/Mock
└─────────────────┘
        │
        ▼
┌─────────────────┐
│  Response       │ ──── Style Validation
│  Processing     │      Quality Checks
└─────────────────┘
        │
        ▼
Output (Generated Content)
```

### Evaluation Flow

```
Golden Set Input
        │
        ▼
┌─────────────────┐
│  Test Case      │
│  Discovery      │
└─────────────────┘
        │
        ▼
┌─────────────────┐
│  Batch          │ ──── Parallel Processing
│  Processing     │      Rate Limiting
└─────────────────┘
        │
        ▼
┌─────────────────┐
│  Quality        │ ──── Style Violations
│  Analysis       │      Reading Level
└─────────────────┘      Performance Metrics
        │
        ▼
┌─────────────────┐
│  Results        │
│  Aggregation    │
└─────────────────┘
        │
        ▼
Evaluation Report (JSON)
```

## Design Patterns

### 1. Provider Pattern

**Purpose:** Abstract AI provider differences behind a common interface

```javascript
// Base provider interface
class Provider {
  async generate(prompt, options = {}) {
    throw new Error('Must implement generate method');
  }

  validateConfig() {
    throw new Error('Must implement validateConfig method');
  }
}

// Concrete implementations
class OpenAIProvider extends Provider { ... }
class AnthropicProvider extends Provider { ... }
class GeminiProvider extends Provider { ... }
class MockProvider extends Provider { ... }
```

**Benefits:**

- Easy to add new providers
- Consistent error handling across providers
- Simplified testing with mock provider
- Runtime provider switching

### 2. Template Management Pattern

**Purpose:** Version-controlled, parameterized prompt templates

```javascript
// Template structure
{
  "name": "draft_scaffold",
  "version": "1.0.0",
  "description": "Convert brief to content scaffold",
  "prompt": "Create a scaffold for {asset_type} about {topic}...",
  "parameters": ["asset_type", "topic", "audience", "tone"],
  "metadata": {
    "category": "scaffolding",
    "complexity": "medium"
  }
}
```

**Benefits:**

- A/B testing of different prompt versions
- Parameter validation and type checking
- Template caching and optimization
- Version rollback capabilities

### 3. Circuit Breaker Pattern

**Purpose:** Prevent cascade failures and provide graceful degradation

```javascript
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.threshold = threshold;
    this.timeout = timeout;
    this.failureCount = 0;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  }

  async execute(operation) {
    if (this.state === 'OPEN') {
      throw new Error('Circuit breaker is OPEN');
    }
    // ... implementation
  }
}
```

**Benefits:**

- Prevents overwhelming failed services
- Automatic recovery detection
- Configurable failure thresholds
- Monitoring and alerting integration

### 4. Factory Pattern

**Purpose:** Create provider instances based on configuration

```javascript
class ProviderFactory {
  static createProvider(providerName, config) {
    switch (providerName) {
      case 'openai':
        return new OpenAIProvider(config);
      case 'anthropic':
        return new AnthropicProvider(config);
      case 'gemini':
        return new GeminiProvider(config);
      case 'mock':
        return new MockProvider(config);
      default:
        throw new Error(`Unknown provider: ${providerName}`);
    }
  }
}
```

**Benefits:**

- Centralized provider creation logic
- Easy configuration management
- Runtime provider switching
- Dependency injection support

## File System Architecture

### Directory Structure

```
spot-toolkit/
├── app.js                      # Main CLI entry point
├── package.json               # Dependencies and scripts
├── .env.template              # Environment template
│
├── src/                       # Core application code
│   ├── SPOT.js       # Main orchestrator
│   ├── cli.js                # Task-specific CLI
│   │
│   ├── providers/            # AI provider implementations
│   │   ├── Provider.js       # Abstract base class
│   │   ├── OpenAIProvider.js # OpenAI integration
│   │   ├── AnthropicProvider.js # Anthropic integration
│   │   ├── GeminiProvider.js # Google Gemini integration
│   │   └── MockProvider.js   # Testing/development mock
│   │
│   ├── utils/                # Production utilities
│   │   ├── config.js         # Configuration management
│   │   ├── logger.js         # Structured logging
│   │   ├── errors.js         # Custom error types
│   │   ├── monitoring.js     # Health checks and metrics
│   │   └── providerManager.js # Provider lifecycle management
│   │
│   └── eval/                 # Evaluation framework
│       ├── runEvaluations.js # Main evaluation runner
│       ├── evaluator.js      # Core evaluation logic
│       ├── metrics.js        # Quality metrics calculation
│       └── reporter.js       # Results formatting
│
├── prompts/                  # Template management
│   ├── draft_scaffold@1.0.0.json
│   ├── repurpose_pack@1.0.0.json
│   ├── summarize_pack@1.0.0.json
│   └── template-schema.json  # Template validation schema
│
├── golden_set/              # Comprehensive test data
│   ├── README.md           # Golden set documentation
│   ├── briefs/            # Input briefs for testing
│   ├── transcripts/       # Meeting/interview transcripts
│   ├── repurposing/       # Content for repurposing tests
│   ├── edge_cases/        # Boundary condition tests
│   ├── style_compliance/  # Style rule validation tests
│   ├── performance/       # Large content stress tests
│   ├── provider_comparison/ # Cross-provider comparison
│   ├── domain_specific/   # Specialized content tests
│   └── expected_outputs/  # Reference outputs for validation
│
├── configs/                # System configuration
│   ├── providers.json     # Provider settings and models
│   ├── channels.json      # Output channel configurations
│   └── environments.json  # Environment-specific settings
│
├── style/                  # Style governance
│   ├── style_pack.json    # Brand voice and style rules
│   ├── terminology.json   # Must-use/must-avoid terms
│   └── readability.json   # Reading level guidelines
│
├── docs/                   # Documentation
│   ├── USAGE.md           # Comprehensive usage guide
│   ├── ARCHITECTURE.md    # This document
│   ├── API.md             # API documentation
│   └── CONTRIBUTING.md    # Development guidelines
│
└── scripts/               # Automation and utilities
    ├── setup.sh          # Initial setup script
    ├── validate.sh       # Template validation
    └── benchmark.sh      # Performance benchmarking
```

### File Naming Conventions

#### Template Files

- **Format:** `{name}@{version}.json`
- **Examples:**
  - `draft_scaffold@1.0.0.json`
  - `repurpose_pack@2.1.0.json`

#### Golden Set Files

- **Format:** `{type}_{difficulty}_{description}.{ext}`
- **Examples:**
  - `brief_easy_react_tutorial.json`
  - `transcript_hard_technical_meeting.txt`
  - `article_medium_remote_teams.md`

#### Configuration Files

- **Format:** `{purpose}.json`
- **Examples:**
  - `providers.json` - AI provider settings
  - `channels.json` - Output channel configurations
  - `style_pack.json` - Style governance rules

## Configuration Architecture

### Hierarchical Configuration

SPOT uses a layered configuration approach:

1. **Default values** (hardcoded in source)
2. **Config files** (`configs/*.json`)
3. **Environment variables** (`.env`)
4. **Runtime parameters** (CLI arguments)

Later layers override earlier ones, providing maximum flexibility.

### Environment Configuration

```bash
# Core settings
NODE_ENV=development|production
LOG_LEVEL=debug|info|warn|error
LOG_FORMAT=json|text

# Provider settings
PROVIDER=openai|anthropic|gemini|mock
OPENAI_API_KEY=your_key
ANTHROPIC_API_KEY=your_key
GEMINI_API_KEY=your_key

# Performance tuning
CIRCUIT_BREAKER_THRESHOLD=5
HEALTH_CHECK_INTERVAL=60000
METRICS_ENABLED=true|false
```

### Provider Configuration

Each provider has specific configuration in `configs/providers.json`:

```json
{
  "defaultProvider": "openai",
  "providers": {
    "openai": {
      "model": "gpt-4",
      "maxTokens": 2000,
      "temperature": 0.7,
      "timeout": 30000,
      "retryAttempts": 3
    },
    "anthropic": {
      "model": "claude-3-sonnet-20240229",
      "maxTokens": 2000,
      "temperature": 0.7,
      "timeout": 30000,
      "retryAttempts": 3
    }
  }
}
```

## Error Handling Architecture

### Error Hierarchy

```
SPOTError (base)
├── ValidationError
│   ├── TemplateValidationError
│   ├── ParameterValidationError
│   └── ConfigValidationError
├── ProviderError
│   ├── ProviderNotFoundError
│   ├── APIKeyError
│   ├── RateLimitError
│   └── APIError
├── ProcessingError
│   ├── TemplateProcessingError
│   ├── ResponseProcessingError
│   └── StyleValidationError
└── SystemError
    ├── FileSystemError
    ├── NetworkError
    └── CircuitBreakerError
```

### Error Recovery Strategies

1. **Automatic Retry** - Transient failures (network, rate limits)
2. **Provider Fallback** - Switch to backup provider on failure
3. **Circuit Breaking** - Prevent cascade failures
4. **Graceful Degradation** - Return partial results when possible
5. **User Notification** - Clear error messages with actionable guidance

## Monitoring and Observability

### Logging Strategy

**Structured Logging** with contextual information:

```javascript
logger.info('Content generation started', {
  operation: 'scaffold',
  provider: 'openai',
  template: 'draft_scaffold@1.0.0',
  inputFile: 'brief1.json',
  requestId: 'req-123',
});
```

**Log Levels:**

- **DEBUG** - Detailed tracing for development
- **INFO** - Normal operational messages
- **WARN** - Recoverable errors and degraded performance
- **ERROR** - Serious problems requiring attention

### Health Monitoring

**System Health Checks:**

- Provider connectivity and authentication
- Template validation and loading
- Configuration integrity
- File system accessibility
- Performance metrics

**Health Check Endpoints:**

```javascript
{
  "status": "healthy|degraded|unhealthy",
  "timestamp": "2023-08-19T10:30:00Z",
  "checks": {
    "providers": {
      "openai": "healthy",
      "anthropic": "healthy",
      "gemini": "degraded"
    },
    "templates": "healthy",
    "config": "healthy"
  },
  "metrics": {
    "uptime": 3600,
    "requestCount": 150,
    "errorRate": 0.02
  }
}
```

### Performance Metrics

**Key Performance Indicators:**

- **Latency** - Response times (p50, p95, p99)
- **Throughput** - Requests per second
- **Error Rate** - Percentage of failed requests
- **Token Usage** - Cost tracking and optimization
- **Quality Metrics** - Style compliance, readability scores

## Security Architecture

### API Key Management

- **Environment-based storage** - Never commit keys to source control
- **Provider-specific keys** - Separate keys for each AI provider
- **Key rotation support** - Easy key updates without code changes
- **Fallback mechanisms** - Graceful handling of invalid/expired keys

### Input Validation

- **Parameter sanitization** - Prevent injection attacks
- **File type validation** - Restrict input file types
- **Size limits** - Prevent resource exhaustion
- **Content filtering** - Basic safety checks on generated content

### Output Security

- **Content sanitization** - Remove potentially harmful generated content
- **Rate limiting** - Prevent abuse and cost overruns
- **Audit logging** - Track all generation requests
- **Data privacy** - No persistent storage of input/output content

## Scalability Considerations

### Horizontal Scaling

- **Stateless design** - No server-side state storage
- **Provider load balancing** - Distribute requests across multiple providers
- **Batch processing** - Efficient handling of multiple requests
- **Caching strategies** - Template and configuration caching

### Performance Optimization

- **Template compilation** - Pre-process templates for faster execution
- **Connection pooling** - Reuse HTTP connections to AI providers
- **Parallel processing** - Concurrent request handling where possible
- **Memory management** - Efficient handling of large content files

### Cost Management

- **Token usage tracking** - Monitor API costs per provider
- **Request optimization** - Minimize unnecessary API calls
- **Provider cost comparison** - Choose most cost-effective provider per task
- **Budget controls** - Configurable spending limits and alerts

## Testing Architecture

### Golden Set Testing

**Comprehensive test coverage** across multiple dimensions:

- **Functional testing** - Core operations work correctly
- **Quality testing** - Style compliance and readability
- **Performance testing** - Latency and throughput benchmarks
- **Edge case testing** - Boundary conditions and error scenarios
- **Provider comparison** - Consistent behavior across providers

### Test Categories

1. **Briefs** - Input briefs ranging from easy to extreme complexity
2. **Transcripts** - Meeting recordings and interview transcripts
3. **Repurposing** - Existing content for multi-channel adaptation
4. **Edge Cases** - Empty fields, special characters, extreme inputs
5. **Style Compliance** - Must-use/must-avoid term validation
6. **Performance** - Large files and stress testing
7. **Provider Comparison** - Standardized tests across providers
8. **Domain Specific** - Technical, legal, and specialized content
9. **Expected Outputs** - Reference outputs for regression testing

### Evaluation Metrics

**Quality Metrics:**

- Style violations per 1,000 words
- Reading level compliance
- Terminology adherence (must-use/must-avoid)
- Content completeness and accuracy

**Performance Metrics:**

- API response latency (p50, p95)
- Token consumption per operation
- Success/failure rates
- Provider reliability scores

This architecture ensures SPOT remains maintainable, scalable, and production-ready while providing comprehensive content generation capabilities across multiple AI providers and use cases.
