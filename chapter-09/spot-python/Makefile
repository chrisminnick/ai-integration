# SPOT Python Makefile

.PHONY: help install test clean demo health validate web

help: ## Show this help message
	@echo "Available commands:"
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z_-]+:.*##/ { printf "  %-15s %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

install: ## Install dependencies
	python -m venv venv
	source venv/bin/activate && pip install -e .

test: ## Run tests
	source venv/bin/activate && python -m pytest tests/ -v

demo: ## Run demo script
	source venv/bin/activate && python demo.py

health: ## Run health check
	source venv/bin/activate && python -m spot.cli health

validate: ## Validate templates
	source venv/bin/activate && python -m spot.cli validate

web: ## Start web server
	source venv/bin/activate && python -m spot.cli web

interactive: ## Start interactive mode
	source venv/bin/activate && python -m spot.cli interactive

lint: ## Lint content file (usage: make lint FILE=path/to/file.txt)
	source venv/bin/activate && python scripts/lint_content.py $(FILE)

style-check: ## Check content against style rules (usage: make style-check CONTENT="text to check")
	source venv/bin/activate && python -m spot.cli style-check --content "$(CONTENT)"

style-rules: ## Display current style pack rules
	source venv/bin/activate && python -m spot.cli style-rules

clean: ## Clean up temporary files
	rm -rf build/ dist/ *.egg-info/
	rm -rf .pytest_cache/ htmlcov/ .coverage
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete