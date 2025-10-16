# SPOT Python - Structured Prompt Output Toolkit

![SPOT Logo](../docs/spot-logo.png)

A Python implementation of the AI-powered content generation toolkit, focused on reliability, monitoring, and evaluation capabilities with async support and FastAPI web interface.

## About This Project

SPOT was created by Chris Minnick as a demo project for his book, "A Developer's Guide to Integrating Generative AI into Applications" (Wiley Publishing, 2026, ISBN: 9781394373130).

## � Available Versions

- **Node.js Version** - Full-featured implementation with comprehensive evaluation framework
- **Python Version** (this repository) - [spot-python](https://github.com/chrisminnick/spot-python) - Python implementation with the same core functionality

## 🚀 Features

- **Multi-Provider AI Support** - OpenAI, Anthropic, Gemini with automatic failover
- **Async Architecture** - Full async/await support for high performance
- **FastAPI Web Interface** - REST API and interactive web UI
- **Production-Ready Architecture** - Error handling, circuit breakers, health monitoring
- **Comprehensive Evaluation** - Golden set testing with 9 test categories
- **Template Management** - Versioned JSON templates with A/B testing
- **Style Governance** - Brand voice enforcement and content validation
- **Observability** - Structured logging, metrics, and monitoring
- **CLI Interface** - Complete command-line interface for all operations

## 📋 Requirements

- Python 3.9+
- At least one AI provider API key (OpenAI, Anthropic, or Gemini)

## ⚡ Quick Start

### 1. Setup Environment

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create environment configuration
cp .env.example .env

# Edit .env with your API keys
# Required: Set at least one provider API key
PROVIDER=openai
OPENAI_API_KEY=your_api_key_here
```

### 2. Verify Installation

```bash
# Check system health and validate templates
python -m spot.cli health
python -m spot.cli validate

# Or run comprehensive tests
python -m pytest tests/
```

### 3. Generate Content

```bash
# Start interactive mode (recommended)
python -m spot.cli

# Generate content using a template
python -m spot.cli generate repurpose_pack@1.0.0 my-content/input.json output.json

# Start web server
python -m spot.web
```

## 🏗️ Architecture

### Core Components

- **`spot/cli.py`** - Command-line interface
- **`spot/core/`** - Core SPOT functionality
- **`spot/providers/`** - AI provider implementations
- **`spot/utils/`** - Production utilities
- **`spot/web/`** - FastAPI web application
- **`templates/`** - Versioned JSON prompt templates
- **`golden_set/`** - Comprehensive test data
- **`configs/`** - Configuration files
- **`style/`** - Style pack governance rules

## 🤖 Usage

### CLI Interface

```bash
# Interactive mode
python -m spot.cli

# Direct commands
python -m spot.cli health
python -m spot.cli generate template_name input.json output.json
python -m spot.cli evaluate
```

### Web Interface

```bash
# Start web server
python -m spot.web

# Access web interface at http://localhost:8000
# API docs at http://localhost:8000/docs
```

### Python API

```python
from spot.core import SPOT
from spot.providers import ProviderManager

# Initialize SPOT
spot = SPOT()

# Generate content
result = await spot.generate(
    template="repurpose_pack@1.0.0",
    input_data={"content": "Your content here"},
    provider="openai"
)
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
