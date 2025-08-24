# Simple Chatbot Example

A naive and extremely simple chatbot implementation for educational purposes. This example demonstrates the basic concepts of building a chatbot with minimal code.

## Files

- `simple-chatbot.html` - Complete client-side application (HTML, CSS, JavaScript)
- `simple-server.js` - Backend server using Node.js and Express
- `simple-package.json` - Dependencies for the server
- `.env.example` - Environment variables template

## Setup Instructions

### 1. Install Dependencies

```bash
# Copy the package.json file
cp simple-package.json package.json

# Install dependencies
npm install
```

### 2. Configure OpenAI API Key

```bash
# Copy the environment template
cp .env.example .env

# Edit .env and add your OpenAI API key
# OPENAI_API_KEY=your_actual_api_key_here
```

Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys).

### 3. Start the Server

```bash
npm start
```

The server will run on `http://localhost:3000`.

### 4. Open the Client

Open `simple-chatbot.html` in your web browser. You can do this by:
- Double-clicking the file
- Or using a simple HTTP server: `python3 -m http.server 8080`

## How It Works

### Frontend (`simple-chatbot.html`)
The client is a single HTML file containing:
- A chat interface with messages display
- An input field for user messages
- JavaScript function `sendMessage()` that sends POST requests to the server

### Backend (`simple-server.js`)
The server provides:
- `/api/chat` endpoint that accepts user messages
- Integration with OpenAI's GPT-4 API
- Error handling and validation

### Key Code Snippets

**Frontend (JavaScript):**
```javascript
async function sendMessage(message) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message })
  });
  const data = await res.json();
  updateChatLog({ from: "user", text: message });
  updateChatLog({ from: "bot", text: data.reply });
}
```

**Backend (Node.js/Express):**
```javascript
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: message }],
  });
  res.json({ reply: response.choices[0].message.content });
});
```

## Features

- ✅ Simple, readable code
- ✅ Real-time chat interface
- ✅ Error handling
- ✅ Responsive design
- ✅ Keyboard support (Enter to send)
- ✅ No build process required for frontend
- ✅ Minimal dependencies

## Educational Value

This example demonstrates:
1. Basic HTTP API design
2. Asynchronous JavaScript (async/await)
3. DOM manipulation
4. Error handling
5. Environment variable usage
6. CORS configuration
7. JSON data exchange

Perfect for beginners learning web development and AI integration!
