from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
from openai import OpenAI
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize OpenAI client with error handling
def get_openai_client():
    """Initialize and return OpenAI client"""
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable is not set")
    return OpenAI(api_key=api_key)

# Test the client initialization
try:
    client = get_openai_client()
    print("OpenAI client initialized successfully")
except Exception as e:
    print(f"Error initializing OpenAI client: {e}")
    client = None

@app.route('/')
def index():
    """Serve the main HTML page"""
    return render_template('simple-chatbot.html')

@app.route('/api/chat', methods=['POST'])
def chat():
    """Simple chatbot endpoint"""
    try:
        # Check if client is available
        if client is None:
            return jsonify({
                'error': 'OpenAI client not initialized',
                'message': 'Please check your API key and server configuration'
            }), 500

        data = request.json
        message = data.get('message')

        # Validate input
        if not message or not isinstance(message, str):
            return jsonify({
                'error': 'Message is required and must be a string'
            }), 400

        # Call OpenAI API
        response = client.chat.completions.create(
            model='gpt-4',
            messages=[{'role': 'user', 'content': message}],
            max_tokens=150,  # Limit response length for demo
            temperature=0.7  # Add some creativity
        )

        # Return the response
        return jsonify({
            'reply': response.choices[0].message.content
        })

    except Exception as error:
        print(f'Error calling OpenAI API: {error}')
        return jsonify({
            'error': 'Failed to get response from AI service',
            'message': 'Please check your API key and try again'
        }), 500

@app.route('/static/<path:filename>')
def static_files(filename):
    """Serve static files"""
    return send_from_directory('static', filename)

if __name__ == '__main__':
    PORT = int(os.environ.get('PORT', 3000))
    print(f'Chat server running on http://localhost:{PORT}')
    print(f'Open http://localhost:{PORT} in your browser to use the chatbot')
    app.run(host='0.0.0.0', port=PORT, debug=True)
