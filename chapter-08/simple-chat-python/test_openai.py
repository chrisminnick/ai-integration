#!/usr/bin/env python3
"""
Test script to verify OpenAI client initialization
"""
import os
from dotenv import load_dotenv
from openai import OpenAI

def test_openai_client():
    """Test OpenAI client initialization"""
    load_dotenv()
    
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        print("❌ OPENAI_API_KEY environment variable is not set")
        return False
    
    print(f"✅ API key found: {api_key[:10]}...")
    
    try:
        client = OpenAI(api_key=api_key)
        print("✅ OpenAI client initialized successfully")
        
        # Test a simple API call
        response = client.chat.completions.create(
            model='gpt-3.5-turbo',  # Using cheaper model for testing
            messages=[{'role': 'user', 'content': 'Say "Hello, test successful!"'}],
            max_tokens=10
        )
        
        print(f"✅ API call successful: {response.choices[0].message.content}")
        return True
        
    except Exception as e:
        print(f"❌ Error initializing OpenAI client: {e}")
        return False

if __name__ == '__main__':
    print("Testing OpenAI client...")
    success = test_openai_client()
    if success:
        print("\n🎉 All tests passed! You can now run the Flask app.")
    else:
        print("\n💥 Tests failed. Please check your configuration.")
