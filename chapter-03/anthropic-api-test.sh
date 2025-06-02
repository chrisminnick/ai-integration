#!/bin/bash

# This script sends a request to the Anthropic API to generate a chat completion
# using the claude-3-5-sonnet model and prints the response.

# Modify the path to your .env file if necessary
source ../.env

curl --verbose https://api.anthropic.com/v1/messages \
        --header "x-api-key: $ANTHROPIC_API_KEY" \
        --header "anthropic-version: 2023-06-01" \
        --header "content-type: application/json" \
        --data \
    '{
        "model": "claude-3-5-sonnet-20241022",
        "max_tokens": 1024,
        "messages": [
            {"role": "user", "content": "Hello, world"}
        ]
    }'

