# Modify the path to your .env file if necessary
source ../../.env

curl https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
    "model": "gpt-4o",
    "response_format": {
      "type": "json_schema",
      "json_schema": {
        "name": "CandidateProfileList",
        "schema": {
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "type": "object",
          "description": "A list of candidate profiles wrapped in a result object",
          "properties": {
            "results": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "fullName": { "type": "string" },
                  "location": { "type": "string" },
                  "skills": {
                    "type": "array",
                    "items": { "type": "string" }
                  },
                  "experienceYears": { "type": "number" },
                  "summary": { "type": "string" }
                },
                "required": ["fullName", "location", "skills", "experienceYears", "summary"]
              }
            }
          },
          "required": ["results"]
        }
      }
    },
    "messages": [
      {
        "role": "user",
        "content": "Generate 5 realistic candidate profiles and return them inside a results array. Vary the skills, names, experience levels, and locations. Use natural language in the summaries."
      }
    ]
  }'



  