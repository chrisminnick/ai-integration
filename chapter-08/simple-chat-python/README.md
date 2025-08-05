# Simple Chat Python/Flask

A simple chatbot application built with Python and Flask that integrates with OpenAI's GPT API.

## Features

- Simple web-based chat interface
- Integration with OpenAI's GPT-4 model
- Real-time chat responses
- Clean, responsive UI
- Error handling and validation

## Prerequisites

- Python 3.7 or higher
- OpenAI API key

## Installation

1. Install the required dependencies:

   ```bash
   pip install -r requirements.txt
   ```

2. Create a `.env` file in this directory and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

## Usage

1. Run the Flask application:

   ```bash
   python app.py
   ```

2. Open your browser and navigate to `http://localhost:3000`

3. Start chatting with the AI!

## Project Structure

```
simple-chat-python/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── templates/
│   └── simple-chatbot.html  # HTML template
├── static/
│   └── styles.css        # CSS styles
└── README.md             # This file
```

## API Endpoints

- `GET /` - Serves the main chat interface
- `POST /api/chat` - Processes chat messages and returns AI responses

## Configuration

The application uses the following environment variables:

- `OPENAI_API_KEY` - Your OpenAI API key (required)
- `PORT` - Port to run the server on (default: 3000)

## Differences from Node.js Version

This Python/Flask version provides the same functionality as the Node.js version but with:

- Python/Flask backend instead of Node.js/Express
- Flask templating system for HTML
- Python's `openai` library instead of the JavaScript SDK
- Similar API structure and response format

## Error Handling

The application includes error handling for:

- Missing or invalid messages
- OpenAI API errors
- Network connectivity issues
- Invalid API keys
