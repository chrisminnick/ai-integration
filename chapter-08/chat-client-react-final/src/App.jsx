import { useState, useRef, useEffect } from 'react';

import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestedReplies, setSuggestedReplies] = useState([]);
  const [userName, setUserName] = useState('');
  const [tempUserName, setTempUserName] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const chatLogRef = useRef(null);
  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [messages, streamingMessage, loading]);

  const handleSend = async (messageText = null) => {
    const textToSend = messageText || input.trim();
    if (!textToSend) return;
    if (textToSend.split(' ').length < 3) {
      setMessages((prev) => [
        ...prev,
        { role: 'user', content: textToSend },
        {
          role: 'assistant',
          content:
            'Can you tell me a bit more? Are you asking about setup, cleaning, or something else?',
        },
      ]);
      if (!messageText) {
        setInput('');
      }
      return;
    }

    const backchannelMessage = {
      role: 'assistant',
      content: 'Got it. Let me check on that...',
    };
    const systemPrompt = {
      role: 'system',
      content: `
You are a helpful and friendly customer support assistant for the SimpleToast 1000 toaster.

You should only answer questions about the SimpleToast 1000, and politely decline to answer anything unrelated.

The SimpleToast 1000 is a stainless steel two-slice toaster with extra-wide slots (fits bagels and English muffins), a lever that lowers the bread into the toaster, and a browning dial that controls how light or dark the toast comes out. It plugs into a standard 120v outlet. When the toast is finished, it pops up automatically. There's also a removable crumb tray for easy cleaning.

The price is $129 and it's available in fine stores everywhere.

If a user asks a question outside this scope (like about other appliances, recipes, or general trivia), respond with: "I'm here to help with the SimpleToast 1000. Can I answer a question about that?"

The user's name is ${userName}. Address them by name when appropriate.
  `,
    };

    const updatedMessages = [
      ...messages,
      { role: 'user', content: textToSend },
      backchannelMessage,
    ];
    setMessages(updatedMessages);
    // Prepare messages for API (with system prompt)
    const fullMessages = [systemPrompt, ...updatedMessages];

    setSuggestedReplies([]);
    setInput('');
    setLoading(true);
    setError('');
    setIsStreaming(true);
    setStreamingMessage('');

    try {
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({ messages: fullMessages, stream: true }),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedResponse = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              break;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                accumulatedResponse += parsed.content;
                setStreamingMessage(accumulatedResponse);
              }
            } catch (e) {
              // Skip malformed JSON
              console.warn('Skipping malformed JSON:', data);
            }
          }
        }
      }

      // Finalize the message
      const finalMessages = [
        ...updatedMessages,
        { role: 'assistant', content: accumulatedResponse },
      ];
      setMessages(finalMessages);

      setSuggestedReplies([
        'Tell me more',
        'Try something else',
        'Summarize that',
      ]);
    } catch (err) {
      console.log('Failed to fetch response from server');
      setError('Failed to fetch response from server');
    } finally {
      setLoading(false);
      setIsStreaming(false);
      setStreamingMessage('');
    }
  };
  const handleSuggestedReply = (text) => {
    handleSend(text);
  };
  const addWelcomeMessage = (newUserName) => {
    const welcomeMessage = {
      role: 'assistant',
      content: `Hello ${newUserName}! Welcome to SimpleToasterBot! I'm here to help you with any questions about the SimpleToast 1000 toaster. Feel free to ask me about its features, pricing, or how to use it!`,
    };

    setMessages([welcomeMessage]);

    // Set initial suggested replies
    setSuggestedReplies([
      'Tell me about the SimpleToast 1000',
      'What are the features?',
      'How much does it cost?',
    ]);
  };

  return (
    <div id="app">
      <h1>SimpleBot</h1>
      {!userName && (
        <div id="welcomeBox">
          <p>Welcome! Please enter your name to get started:</p>
          <div>
            <input
              type="text"
              placeholder="Enter your name"
              value={tempUserName}
              onChange={(e) => setTempUserName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && tempUserName.trim()) {
                  const newUserName = tempUserName.trim();
                  setUserName(newUserName);
                  addWelcomeMessage(newUserName);
                }
              }}
            />
            <button
              onClick={() => {
                if (tempUserName.trim()) {
                  const newUserName = tempUserName.trim();
                  setUserName(newUserName);
                  addWelcomeMessage(newUserName);
                }
              }}
              disabled={!tempUserName.trim()}
              style={{
                backgroundColor: tempUserName.trim() ? '#007cba' : '#ccc',
                cursor: tempUserName.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              Set Name
            </button>
          </div>
        </div>
      )}
      {userName && (
        <div className="user-info">
          Chatting as: <strong>{userName}</strong>
        </div>
      )}

      <div id="chatLog" ref={chatLogRef}>
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.role}`}>
            <strong>{msg.role === 'user' ? 'You' : 'AI'}:</strong> {msg.content}
          </div>
        ))}
        {isStreaming && (
          <div className="message assistant streaming">
            <strong>AI:</strong> {streamingMessage}
            <span className="cursor">|</span>
          </div>
        )}

        {loading && !isStreaming && (
          <div className="message loading">
            <strong>AI:</strong> <em>Typing...</em>
          </div>
        )}
      </div>
      {error && (
        <div
          className="error-message"
          style={{ color: 'red', margin: '10px 0' }}
        >
          Error: {error}
        </div>
      )}
      <div>
        {suggestedReplies.length > 0 && (
          <div className="suggested-replies">
            {suggestedReplies.map((reply, index) => (
              <button
                key={index}
                onClick={() => handleSuggestedReply(reply)}
                disabled={loading}
                style={{ marginRight: '8px', marginBottom: '8px' }}
              >
                {reply}
              </button>
            ))}
          </div>
        )}
        <input
          type="text"
          placeholder={
            userName ? 'Type your message...' : 'Please set your name first'
          }
          value={input}
          id="messageInput"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !loading && userName) {
              handleSend();
            }
          }}
          disabled={loading || !userName}
        />
        <button
          id="sendButton"
          onClick={() => handleSend()}
          disabled={loading || !userName}
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}

export default App;
