import express from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import cors from 'cors';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static('.'));

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Chatbot endpoint that accepts conversation history
// Chatbot endpoint that accepts conversation history
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, stream = false } = req.body;

    // Validate input
    if (!messages || !Array.isArray(messages)) {
      return res
        .status(400)
        .json({ error: 'Messages is required and must be an array' });
    }

    if (messages.length === 0) {
      return res.status(400).json({ error: 'Messages array cannot be empty' });
    }

    // Validate each message has required properties
    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        return res.status(400).json({
          error: 'Each message must have role and content properties',
        });
      }
      if (typeof msg.content !== 'string') {
        return res
          .status(400)
          .json({ error: 'Message content must be a string' });
      }
    }

    // Handle streaming vs non-streaming responses
    if (stream) {
      // Set up Server-Sent Events headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      });

      try {
        // Call OpenAI API with streaming
        const stream = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: messages,
          max_tokens: 150,
          temperature: 0.7,
          stream: true, // Enable streaming
        });

        // Process streaming chunks
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            // Send chunk as Server-Sent Event
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
          }
        }

        // Signal end of stream
        res.write('data: [DONE]\n\n');
        res.end();
      } catch (streamError) {
        console.error('Streaming error:', streamError);
        res.write(
          `data: ${JSON.stringify({
            error: 'Streaming failed',
            content: 'Sorry, I encountered an error while responding.',
          })}\n\n`
        );
        res.write('data: [DONE]\n\n');
        res.end();
      }
    } else {
      // Non-streaming response (existing functionality)
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: messages,
        max_tokens: 150,
        temperature: 0.7,
      });

      // Return the response
      res.json({ reply: response.choices[0].message.content });
    }
  } catch (error) {
    console.error('Error calling OpenAI API:', error);

    // Handle error differently based on response type
    if (req.body.stream) {
      if (!res.headersSent) {
        res.writeHead(500, {
          'Content-Type': 'text/event-stream',
          'Access-Control-Allow-Origin': '*',
        });
      }
      res.write(
        `data: ${JSON.stringify({
          error: 'Failed to get response from AI service',
          content: 'Please check your API key and try again.',
        })}\n\n`
      );
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      res.status(500).json({
        error: 'Failed to get response from AI service',
        message: 'Please check your API key and try again',
      });
    }
  }
});

// Serve the HTML file on the root route
app.get('/', (req, res) => {
  res.sendFile('simple-chatbot.html', { root: '.' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Chat server running on http://localhost:${PORT}`);
});

export default app;
