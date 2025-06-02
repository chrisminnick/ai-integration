#!/bin/bash

# This script sends a request to the Google Gemini API to generate a chat completion
# using the gemini-2.0-flash model and prints the response.

# Modify the path to your .env file if necessary
source ../.env

curl --verbose "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=$GEMINI_API_KEY" \
  -H 'Content-Type: application/json' \
  -X POST \
  -d '{
    "contents": [
      {
        "parts": [
          {
            "text": "Explain how AI works in a few words"
          }
        ]
      }
    ]
  }'

