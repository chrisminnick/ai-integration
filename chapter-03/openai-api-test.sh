#!/bin/bash

# This script sends a request to the OpenAI API to generate a chat completion
# using the GPT-4o-mini model and prints the response.

# Modify the path to your .env file if necessary
source ../.env

# Sending a request to the OpenAI API
curl --verbose https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
    "model": "gpt-4o-mini",
    "store": true,
    "messages": [
      {"role": "user", "content": "write a haiku about ai"}
    ]
  }'
