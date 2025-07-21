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
        "name": "CandidateProfile",
        "schema": {
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "description": "A structured profile of a job candidate",
          "type": "object",
          "properties": {
            "fullName": { "type": "string" },
            "location": { "type": "string" },
            "skills": { "type": "array", "items": { "type": "string" } },
            "experienceYears": { "type": "number" },
            "summary": { "type": "string" }
          },
          "required": ["fullName", "location", "skills", "experienceYears", "summary"]
        }
      }
    },
    "messages": [
      {
        "role": "user",
        "content": "Generate a realistic job candidate profile that matches this schema. Vary the skills and location, and use natural-sounding language for the summary."
      }
    ]
  }'

  