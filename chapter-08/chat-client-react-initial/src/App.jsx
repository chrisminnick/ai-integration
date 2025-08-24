import { useState } from 'react';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const handleSend = async () => {
    const textToSend = input.trim();
    if (!textToSend) return;

    setMessages([...messages, { role: 'user', content: textToSend }]);
    setInput('');
    try {
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend }),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      setMessages([
        ...messages,
        { role: 'user', content: input },
        { role: 'assistant', content: data.reply },
      ]);
    } catch (err) {
      console.log('Failed to fetch response from server');
    }
  };

  return (
    <div id="app">
      <h1>SimpleBot</h1>
      <div id="chatLog">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            <strong>{msg.role === 'user' ? 'You' : 'AI'}:</strong> {msg.content}
          </div>
        ))}
      </div>
      <div>
        <input
          type="text"
          placeholder="Type your message..."
          value={input}
          id="messageInput"
          onChange={(e) => setInput(e.target.value)}
        />
        <button id="sendButton" onClick={() => handleSend()}>
          Send
        </button>
      </div>
    </div>
  );
}

export default App;
