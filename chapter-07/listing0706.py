from openai import OpenAI
from dotenv import load_dotenv
import os
import time
import hashlib

# Load environment variables
load_dotenv()

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Simple in-memory cache
cache = {}

def get_cached_completion(prompt):
    """Get completion with caching - returns response and time taken."""
    start_time = time.time()
    
    # Hash the prompt for cache key
    prompt_hash = hashlib.sha256(prompt.encode()).hexdigest()

    # Check cache first
    if prompt_hash in cache:
        print(f"Cache HIT: {time.time() - start_time:.4f}s")
        return cache[prompt_hash], time.time() - start_time
    
    # Cache miss - make API call
    print("Cache MISS - making API call...")
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=256
    )
    
    result = response.choices[0].message.content
    cache[prompt_hash] = result  # Store in cache with hash as key
    
    elapsed = time.time() - start_time
    print(f"API call completed: {elapsed:.4f}s")
    return result, elapsed

# Demo: Show caching benefits
print("=== CACHING DEMO ===")

prompt = "Who were the original members of The Ramones?"

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
