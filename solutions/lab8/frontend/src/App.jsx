import { useEffect, useRef, useState } from 'react';
import './App.css';

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || 'http://localhost:5050';

const PERSONAS = {
  default: {
    label: 'Helpful assistant',
    prompt: 'You are a helpful assistant. Be concise.',
  },
  mentor: {
    label: 'Senior engineer mentor',
    prompt:
      'You are a senior software engineer mentoring a junior developer. Always answer technical questions with both the explanation and a small code example. If you don\'t know, say so.',
  },
  support: {
    label: 'Outdoor-gear support',
    prompt:
      'You are a customer support assistant for a company that sells outdoor gear. Be friendly and concise. If asked about anything unrelated to outdoor gear, politely decline.',
  },
};

function systemMessage(personaKey) {
  return { role: 'system', content: PERSONAS[personaKey].prompt };
}

function App() {
  const [persona, setPersona] = useState('default');
  const [messages, setMessages] = useState([systemMessage('default')]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const chatLogRef = useRef(null);

  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [messages]);

  function handlePersonaChange(e) {
    const next = e.target.value;
    setPersona(next);
    setMessages([systemMessage(next)]);
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || streaming) return;

    const userMessage = { role: 'user', content: text };
    const nextMessages = [...messages, userMessage];
    setMessages([...nextMessages, { role: 'assistant', content: '' }]);
    setInput('');
    setStreaming(true);

    try {
      const res = await fetch(`${BACKEND_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`Server responded with ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        assistantContent += chunk;
        setMessages([
          ...nextMessages,
          { role: 'assistant', content: assistantContent },
        ]);
      }
    } catch (err) {
      setMessages([
        ...nextMessages,
        {
          role: 'assistant',
          content: `⚠️ Error: ${err.message}. Please try again.`,
          isError: true,
        },
      ]);
    } finally {
      setStreaming(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const visible = messages.filter((m) => m.role !== 'system');

  return (
    <div id="app">
      <h1>Lab 8 Chat</h1>

      <div className="persona-row">
        <label htmlFor="persona">Persona:</label>
        <select id="persona" value={persona} onChange={handlePersonaChange}>
          {Object.entries(PERSONAS).map(([key, { label }]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <span style={{ fontSize: '0.85rem', color: '#666' }}>
          (changing persona clears the conversation)
        </span>
      </div>

      <div id="chatLog" ref={chatLogRef}>
        {visible.map((msg, i) => (
          <div
            key={i}
            className={`message ${msg.role}${msg.isError ? ' error' : ''}`}
          >
            <strong>{msg.role === 'user' ? 'You' : 'AI'}:</strong>{' '}
            {msg.content}
            {streaming &&
              i === visible.length - 1 &&
              msg.role === 'assistant' && <span className="cursor">▍</span>}
          </div>
        ))}
      </div>

      <div className="input-row">
        <input
          id="messageInput"
          type="text"
          placeholder="Type your message…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={streaming}
        />
        <button
          id="sendButton"
          onClick={sendMessage}
          disabled={streaming || !input.trim()}
        >
          {streaming ? 'Sending…' : 'Send'}
        </button>
      </div>
    </div>
  );
}

export default App;
