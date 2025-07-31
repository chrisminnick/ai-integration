from openai import OpenAI
from dotenv import load_dotenv
import os
import time

# Load environment variables from the .env file
load_dotenv()

# Initialize OpenAI client with API key
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

compressed_prompt = "How can I reduce GPT-4 latency in production?"

start_time = time.time()
response = client.chat.completions.create(model="gpt-4",
messages=[{"role": "user", "content": compressed_prompt}],
temperature=0.7)
end_time = time.time()
print("Response:")
print(response.choices[0].message.content)
print(f"Response time: {end_time - start_time:.2f} seconds")
print("\n--- Token Usage ---")
print(f"Prompt tokens: {response.usage.prompt_tokens}")
print(f"Completion tokens: {response.usage.completion_tokens}")
print(f"Total tokens: {response.usage.total_tokens}")
