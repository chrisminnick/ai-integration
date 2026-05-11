# Lab 8 — Production AI Chat App (Capstone)

**Module:** Capstone — pulls together Modules 2, 4, and 7
**Time:** 75 minutes
**Language:** JavaScript (React + Node.js, or React + Python Flask)
**Prerequisites:** Node.js 18+, an OpenAI API key, a working browser

## Why this lab matters

A streaming chat app is the "Hello World" of production LLM features — it's the first thing every team ships. But the gap between a Lab 3 prompt-engineering exercise and a real chat app is large: you need conversation memory, streaming responses, error handling, and a frontend that doesn't fall over. In 75 minutes you'll build a working chat client that does all of those things. It's a clean capstone that demonstrates everything from earlier modules in one artifact you can actually demo.

## What you're building

A two-piece app:

- **Backend**: a small server that proxies requests to the OpenAI API, manages session state, and supports streaming responses.
- **Frontend**: a React UI that sends messages, displays the conversation, and streams responses token-by-token.

The starter code is a working-but-minimal version. You'll add:

1. **Message history** so the model remembers the conversation
2. **Streaming responses** so the UI updates as the model types
3. **Error handling** so failures don't break the UI
4. **A system prompt** that shapes the assistant's behavior (calling back to Module 4)

## Source material

The starter code is in your AI integration book:

- React frontend (initial): `ai-integration/chapter-08/chat-client-react-initial/`
- React frontend (final reference): `ai-integration/chapter-08/chat-client-react-final/`
- Python Flask backend: `ai-integration/chapter-08/simple-chat-python/`
- Node.js backend (initial + final): `ai-integration/chapter-08/simple-chat-server-initial/` and `-final/`

This lab uses the **React frontend + Python Flask backend** combination because most students will have Python set up from earlier labs. If you prefer all-JavaScript, swap in the Node.js backend.

## Setup

```bash
# Copy starter code
cp -r ~/code/src/github.com/chrisminnick/ai-integration/chapter-08/simple-chat-python ~/lab8/backend
cp -r ~/code/src/github.com/chrisminnick/ai-integration/chapter-08/chat-client-react-initial ~/lab8/frontend

# Backend
cd ~/lab8/backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add OPENAI_API_KEY

# Frontend (in a new terminal)
cd ~/lab8/frontend
npm install
```

Start both:

```bash
# Terminal 1
cd ~/lab8/backend
./start.sh          # or: python app.py

# Terminal 2
cd ~/lab8/frontend
npm run dev
```

Open the URL shown by Vite (usually `http://localhost:5173`). You should see a basic chat input. Type a message — you should get a response.

## Part 1 — Verify the starter works (5 min)

The starter chat works, but every message is a fresh conversation — the model has no memory.

Try this:
1. Send: "My name is Alex."
2. Send: "What's my name?"

The model says it doesn't know. **That's the bug we'll fix first.**

## Part 2 — Add conversation memory (15 min)

The fix is to send the *full conversation history* with every request, not just the latest message.

### Backend changes

Open `backend/app.py`. The current handler probably looks something like:

```python
@app.route("/chat", methods=["POST"])
def chat():
    user_message = request.json["message"]
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": user_message}]
    )
    return jsonify({"reply": response.choices[0].message.content})
```

Change it to accept and forward the full message array:

```python
@app.route("/chat", methods=["POST"])
def chat():
    messages = request.json["messages"]   # array of {role, content}
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
    )
    return jsonify({"reply": response.choices[0].message.content})
```

### Frontend changes

Open `frontend/src/App.jsx`. Currently, only the latest message is sent. Change the state to hold the full conversation, append to it on each send, and send the whole array.

The pattern:

```jsx
const [messages, setMessages] = useState([
  { role: "system", content: "You are a helpful assistant. Be concise." }
]);
const [input, setInput] = useState("");

async function sendMessage() {
  const newMessages = [...messages, { role: "user", content: input }];
  setMessages(newMessages);
  setInput("");

  const res = await fetch("http://localhost:5000/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: newMessages }),
  });
  const data = await res.json();

  setMessages([...newMessages, { role: "assistant", content: data.reply }]);
}
```

In the JSX, render `messages.filter(m => m.role !== "system")` so the system prompt stays hidden.

**Test it.** Now "What's my name?" should work after "My name is Alex."

## Part 3 — Add streaming (25 min)

Right now there's a noticeable delay before the response appears. With streaming, you'll see the reply appear token-by-token. This is how ChatGPT, Claude, and every modern chat product feels responsive.

### Backend: switch to streaming

```python
from flask import Response, stream_with_context

@app.route("/chat", methods=["POST"])
def chat():
    messages = request.json["messages"]

    def generate():
        stream = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            stream=True,
        )
        for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta

    return Response(stream_with_context(generate()), mimetype="text/plain")
```

### Frontend: consume the stream

Replace the `await res.json()` block:

```jsx
const res = await fetch("http://localhost:5000/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ messages: newMessages }),
});

const reader = res.body.getReader();
const decoder = new TextDecoder();

// Add a placeholder assistant message we'll update as chunks arrive
let assistantContent = "";
setMessages([...newMessages, { role: "assistant", content: "" }]);

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const chunk = decoder.decode(value);
  assistantContent += chunk;
  setMessages([...newMessages, { role: "assistant", content: assistantContent }]);
}
```

Now type a long question ("Explain quantum entanglement in three paragraphs") and watch the response appear progressively.

## Part 4 — Error handling (10 min)

What happens if the API key is bad, the network drops, or OpenAI is down? Right now the UI just hangs.

Add error handling around the fetch:

```jsx
try {
  // ... the streaming code above
} catch (err) {
  setMessages([...newMessages, {
    role: "assistant",
    content: `⚠️ Error: ${err.message}. Please try again.`,
    isError: true,
  }]);
}
```

Style error messages differently in CSS (red border, warning icon). Test it by:

1. Stopping the backend mid-conversation — does the UI recover when you restart it?
2. Setting an invalid API key in `.env` and restarting the backend.

## Part 5 — Shape behavior with the system prompt (10 min)

The system prompt you set in Part 2 was generic. Now make it specific.

Try changing it to:

```
You are a senior software engineer mentoring a junior developer. Always answer technical questions with both the explanation and a small code example. If you don't know, say so.
```

Or:

```
You are a customer support assistant for a company that sells outdoor gear. Be friendly and concise. If asked about anything unrelated to outdoor gear, politely decline.
```

Restart and notice how the *same questions* produce different responses. This is Module 4's prompt engineering applied to a real product — the system prompt is the most important part of your application code.

## Part 6 — Extensions (10 min if time)

### Extension A: Token usage display

Show a running total of tokens used and estimated cost (use the cost.py from Lab 7). Update it after each response.

### Extension B: Conversation persistence

Save messages to localStorage so the conversation survives a page refresh.

### Extension C: Multiple personalities

Add a dropdown in the UI to switch between different system prompts (mentor, customer-support, code-reviewer). Switching clears the conversation.

### Extension D: Add RAG (combines with Lab 5)

If you completed Lab 5, plug your RAG retrieval into the chat backend: before each model call, retrieve relevant docs and add them to the system message as context. You now have a working "chat with your docs" product — the most common enterprise LLM feature in 2026.

## What you should walk away with

- A working production-pattern chat app you can show off
- Concrete experience with streaming responses (the difference is dramatic — try the streaming vs. non-streaming version back-to-back)
- The conversation-history pattern that every chat product uses
- Direct experience with how a system prompt shapes product behavior — the single highest-leverage piece of code in any LLM application
- A codebase you can extend: add RAG (Lab 5), add tools (Lab 6), add the readiness checker (Lab 7). All four labs compose into a real product.

## Common issues

- **CORS errors** — the backend needs to allow requests from `http://localhost:5173`. The starter code includes Flask-CORS but verify it's configured.
- **Stream hangs** — older versions of the OpenAI Python SDK had streaming bugs. Use `openai>=1.0`.
- **TypeError reading res.body** — make sure your fetch response is a stream, not awaited as JSON. The error happens when you accidentally call `.json()` on a streaming response.
- **Messages appear out of order** — React state updates are async. Use the functional form `setMessages(prev => [...prev, newMsg])` if you see ordering issues.

## How this lab connects to everything else

This is the capstone because it demonstrates, in one running app, the patterns from every other lab:

- **Module 2 (LLMs)** — you're calling a chat-completion API
- **Module 4 (Prompt engineering)** — the system prompt shapes everything
- **Lab 3 (Temperature, top-p)** — easy to add controls in the UI
- **Lab 5 (RAG)** — extension D plugs it in
- **Lab 6 (Agents)** — extension via function-calling tools
- **Lab 7 (Eval/safety)** — the readiness checker validates any prompt you ship to this app

A student leaving this lab has the skeleton of a real product, plus the mental models to make every piece of it production-ready.
