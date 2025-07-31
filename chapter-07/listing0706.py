import asyncio
import time
import os
from openai import OpenAI
from openai import AsyncOpenAI
from dotenv import load_dotenv

# Load environment variables from the .env file
load_dotenv()

# Initialize OpenAI client with API key
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Create async client with API key
async_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Sample prompts to process in parallel
prompts = [
    "Explain machine learning in one sentence.",
    "What is the capital of Japan?",
    "Define artificial intelligence briefly.",
    "How does photosynthesis work in simple terms?",
    "What is the speed of light?"
]

async def fetch_completion(prompt):
    """Fetch a single completion asynchronously"""
    response = await async_client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=50
    )
    return response.choices[0].message.content

async def parallel_requests(prompts):
    """Process multiple prompts in parallel"""
    tasks = [fetch_completion(prompt) for prompt in prompts]
    return await asyncio.gather(*tasks)

def sequential_requests(prompts):
    """Process prompts sequentially for comparison"""
    results = []
    for prompt in prompts:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=50
        )
        results.append(response.choices[0].message.content)
    return results

async def main():
    # Compare sequential vs parallel processing
    print("Testing 5 API calls...")
    
    print("\n--- Sequential Processing ---")
    start_time = time.time()
    sequential_results = sequential_requests(prompts)
    sequential_time = time.time() - start_time
    print(f"Sequential time: {sequential_time:.2f} seconds")

    print("\n--- Parallel Processing ---")
    start_time = time.time()
    parallel_results = await parallel_requests(prompts)
    parallel_time = time.time() - start_time
    print(f"Parallel time: {parallel_time:.2f} seconds")

    print(f"\nSpeedup: {sequential_time/parallel_time:.2f}x faster")
    # Display results
    print("\n--- Results ---")
    for i, (prompt, result) in enumerate(zip(prompts, parallel_results)):
        print(f"{i+1}. Q: {prompt}")
        print(f"   A: {result}\n")
  

# Run the main function
if __name__ == "__main__":
    asyncio.run(main())