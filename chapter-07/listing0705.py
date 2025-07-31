from openai import OpenAI
from dotenv import load_dotenv
import os
import time

# Load environment variables
load_dotenv()

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Simple in-memory cache
cache = {}

def get_cached_completion(prompt):
    """Get completion with caching - returns response and time taken."""
    start_time = time.time()
    
    # Check cache first
    if prompt in cache:
        print(f"Cache HIT: {time.time() - start_time:.4f}s")
        return cache[prompt], time.time() - start_time
    
    # Cache miss - make API call
    print("Cache MISS - making API call...")
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=50
    )
    
    result = response.choices[0].message.content
    cache[prompt] = result  # Store in cache
    
    elapsed = time.time() - start_time
    print(f"API call completed: {elapsed:.4f}s")
    return result, elapsed

# Demo: Show caching benefits
print("=== CACHING DEMO ===")

prompt = "What is the capital of France?"

# First call - cache miss
print("\n1st call:")
response1, time1 = get_cached_completion(prompt)
print(f"Response: {response1}")

# Second call - cache hit  
print("\n2nd call (same prompt):")
response2, time2 = get_cached_completion(prompt)
print(f"Response: {response2}")

# Show the difference
print(f"\nSpeedup: {time1/time2:.0f}x faster with cache!")
print(f"Cache contains {len(cache)} entries")
