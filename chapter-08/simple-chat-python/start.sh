#!/bin/bash

# Simple startup script for the Python/Flask chat server

echo "Starting Python/Flask Chat Server..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Warning: .env file not found!"
    echo "Please copy .env.example to .env and add your OpenAI API key"
    echo "cp .env.example .env"
    exit 1
fi

# Start the server
echo "Starting Flask server..."
python app.py
