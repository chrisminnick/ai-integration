#!/bin/bash

# PACE Startup Script
echo "🚀 Starting PACE - Prompt-Augmented Coding Environment"
echo "======================================================"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  Creating .env file from template..."
    cp .env.example .env
    echo "📝 Please edit .env file and add your OpenAI API key before continuing."
    echo "   You can get an API key from: https://platform.openai.com/api-keys"
    echo ""
    echo "   Then run this script again to start the server."
    exit 1
fi

# Check if API key is set
if grep -q "your_openai_api_key_here" .env; then
    echo "⚠️  Please set your OpenAI API key in the .env file"
    echo "   Edit .env and replace 'your_openai_api_key_here' with your actual API key"
    exit 1
fi

echo "✅ Configuration looks good!"
echo "🌐 Starting server on http://localhost:3000"
echo "💡 Press Ctrl+C to stop the server"
echo ""

npm start
