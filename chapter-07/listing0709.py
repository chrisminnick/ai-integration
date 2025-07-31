from openai import OpenAI
from dotenv import load_dotenv
import os
import time
# Load environment variables from the .env file
load_dotenv()

# Initialize OpenAI client with API key
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

print("--- Non-streaming Response ---")
start_time = time.time()
response = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "Explain quantum computing simply."}],
    temperature=0.7,
    stream=False
)
non_streaming_time = time.time() - start_time
print(response.choices[0].message.content)
print(f"\nTotal time to first output: {non_streaming_time:.2f} seconds")

print("\n\n--- Streaming Response ---")
start_time = time.time()
first_chunk_time = None

response = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": "Explain quantum computing simply."}],
    temperature=0.7,
    stream=True
)

for chunk in response:
    if chunk.choices[0].delta.content is not None:
        if first_chunk_time is None:
            first_chunk_time = time.time() - start_time
        print(chunk.choices[0].delta.content, end="", flush=True)

print(f"\n\nTime to first chunk: {first_chunk_time:.2f} seconds")
print(f"Perceived latency improvement: {((non_streaming_time - first_chunk_time) / non_streaming_time * 100):.1f}%")