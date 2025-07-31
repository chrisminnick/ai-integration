from openai import OpenAI
from dotenv import load_dotenv
import os
import time
import hashlib
# Load environment variables from the .env file
load_dotenv()

# Initialize OpenAI client with API key
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

cache = {}
def prompt_hash(prompt):
    return hashlib.sha256(prompt.encode()).hexdigest()
def fetch_answer(prompt):
    key = prompt_hash(prompt)
    if key in cache:
        print("Cache hit! Returning cached response.")
        return cache[key]
    print("Cache miss. Calling API...")
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7
    )
    result = response.choices[0].message.content
    cache[key] = result
    return result

# Test the caching functionality
test_prompt = "What is the capital of France?"

print("First call:")
start_time = time.time()
answer1 = fetch_answer(test_prompt)
print(f"Answer: {answer1}\n")
end_time = time.time()
print(f"Response time: {end_time - start_time:.2f} seconds\n")

print("Second call (should use cache):")
start_time = time.time()
answer2 = fetch_answer(test_prompt)
print(f"Answer: {answer2}\n")
end_time = time.time()
print(f"Response time: {end_time - start_time:.2f} seconds\n")
print("Cache statistics:")
print(f"Cache size: {len(cache)} entries")

