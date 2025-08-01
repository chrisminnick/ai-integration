from openai import OpenAI
from scipy.spatial.distance import cosine
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Cache with embeddings for similar prompts
cache = []

def get_embedding(text):
    """Get embedding for text."""
    response = client.embeddings.create(input=text, model="text-embedding-ada-002")
    return response.data[0].embedding

def find_similar_response(prompt, threshold=0.9):
    """Find cached response for similar prompts."""
    prompt_embedding = get_embedding(prompt)
    
    for entry in cache:
        similarity = 1 - cosine(prompt_embedding, entry["embedding"])
        if similarity > threshold:
            print(f"Found similar (similarity: {similarity:.3f})")
            return entry["response"]
    
    return None

def cached_completion(prompt):
    """Get completion with embedding-based caching."""
    # Check for similar cached responses
    cached_response = find_similar_response(prompt)
    if cached_response:
        return cached_response
    
    # No similar response found - make API call
    print("Making new API call...")
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=50
    )
    
    result = response.choices[0].message.content
    
    # Cache the new response with its embedding
    cache.append({
        "prompt": prompt,
        "embedding": get_embedding(prompt),
        "response": result
    })
    
    return result

# Demo: Similar prompts reuse responses
print("=== EMBEDDING CACHE DEMO ===")

# First prompt
prompt1 = "What are some good names for cats?"
print(f"\n1. {prompt1}")
response1 = cached_completion(prompt1)
print(f"Response: {response1[:60]}...")

# Similar prompt - should reuse cached response
prompt2 = "Give me some good names for cats."
print(f"\n2. {prompt2}")
response2 = cached_completion(prompt2)
print(f"Response: {response2[:60]}...")

print(f"\nCache size: {len(cache)} entries")
