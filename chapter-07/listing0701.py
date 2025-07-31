from openai import OpenAI
from dotenv import load_dotenv
import os

# Load environment variables from the .env file
load_dotenv()
import time

# Initialize OpenAI client with API key
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

verbose_prompt = '''
You're an intelligent and helpful assistant. Please help me answer this question in a clear, concise, and professional manner.
The question is: How can I reduce the latency of my GPT-4 application in production?
'''

start_time = time.time()
response = client.chat.completions.create(model="gpt-4",
messages=[{"role": "user", "content": verbose_prompt}],
temperature=0.7)
end_time = time.time()
print("Response:")
print(response.choices[0].message.content)
print(f"Response time: {end_time - start_time:.2f} seconds")
print("\n--- Token Usage ---")
print(f"Prompt tokens: {response.usage.prompt_tokens}")
print(f"Completion tokens: {response.usage.completion_tokens}")
print(f"Total tokens: {response.usage.total_tokens}")
