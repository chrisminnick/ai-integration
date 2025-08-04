from openai import OpenAI
import os
import time
import random
from dotenv import load_dotenv

# Custom exception for demonstration
class SimulatedRateLimitError(Exception):
    pass

# Load environment variables
load_dotenv()

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def exponential_backoff_with_jitter(prompt, max_retries=3):
    """Demonstrates exponential backoff with jitter for API rate limiting."""
    
    for attempt in range(max_retries):
        try:
            # Simulate rate limiting for demonstration (80% chance of rate limit)
            if random.random() < 0.8:
                raise SimulatedRateLimitError("Simulated rate limit for demonstration")
            
            response = client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": prompt}]
            )
            return response.choices[0].message.content
            
        except SimulatedRateLimitError:
            # Exponential backoff: 2^attempt seconds
            base_wait = 2 ** attempt
            # Add jitter: random value between 0-1 seconds
            jitter = random.uniform(0, 1)
            wait_time = base_wait + jitter
            
            print(f"Rate limited. Waiting {wait_time:.2f}s (attempt {attempt + 1})")
            time.sleep(wait_time)
    
    raise Exception(f"Failed after {max_retries} attempts")

try:
    result = exponential_backoff_with_jitter("What is a porcupine?")
    print(f"Response: {result}")
except Exception as e:
    print(f"Error: {e}")