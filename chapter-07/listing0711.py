from openai import OpenAI
from dotenv import load_dotenv
import os
import time
import random

# Load environment variables from the .env file
load_dotenv()

# Initialize OpenAI client with API key
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def call_with_backoff(prompt, max_retries=5):
    for i in range(max_retries):
        try:
            response = client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": prompt}]
            )
            return response.choices[0].message.content
        except client.RateLimitError:
            wait = (2 ** i) + random.uniform(0, 1)
            print(f"Rate limit hit. Retrying in {wait:.2f} seconds...")
            time.sleep(wait)
    raise Exception("Exceeded maximum retry attempts")

response = call_with_backoff("Explain quantum computing simply.")
print(response)
